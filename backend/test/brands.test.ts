import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { normalizeDomain } from '../src/modules/brands/domain-name.js';
import { sanitizeFileName, sniffLogoType } from '../src/modules/brands/logo-sniff.js';
import type { Role } from '../src/modules/organizations/roles.js';
import { buildAuthTestApp } from './helpers.js';

const OWNER_PASSWORD = 'correct horse battery staple';
const MEMBER_PASSWORD = 'quiet orange mountain river';
const LOGO_MESSAGE = 'Upload a PNG, JPEG or WebP image up to 1 MB.';

/* Real, tiny image files (1×1 pixel) and some things that must be refused. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
);
const WEBP = Buffer.from('UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=', 'base64');
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
  'utf8',
);
const TEXT = Buffer.from('just some text, not an image', 'utf8');
const EXE = Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'latin1');
/** PNG signature padded to exactly `size` bytes. */
const pngOfSize = (size: number) => Buffer.concat([PNG, Buffer.alloc(size - PNG.length, 0)]);

/** Reads a response body as raw bytes. */
function binary(res: request.Response, done: (err: Error | null, body: Buffer) => void) {
  // At runtime superagent hands parsers the raw Node response stream.
  const stream = res as unknown as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk));
  stream.on('end', () => done(null, Buffer.concat(chunks)));
}

async function organisation() {
  const context = buildAuthTestApp();
  const owner = request.agent(context.app);
  await owner
    .post('/api/v1/auth/sign-up')
    .send({
      name: 'Asha Rao',
      email: 'asha@acme.example',
      password: OWNER_PASSWORD,
      organizationName: 'Acme Brands',
    })
    .expect(201);

  /** Invites someone with `role` and accepts in a fresh browser session. */
  async function join(role: Role) {
    const created = await owner
      .post('/api/v1/organization/invites')
      .send({ email: `${role}@acme.example`, role });
    expect(created.status).toBe(201);
    const token = String(created.body.data.inviteUrl).split('/invite/')[1];
    const agent = request.agent(context.app);
    const accepted = await agent
      .post(`/api/v1/auth/invites/${token}/accept`)
      .send({ name: `Person ${role}`, password: MEMBER_PASSWORD });
    expect(accepted.status).toBe(201);
    return agent;
  }

  async function createBrand(body: Record<string, unknown> = { name: 'Acme Coffee' }) {
    const res = await owner.post('/api/v1/brands').send(body);
    expect(res.status).toBe(201);
    return res.body.data as { id: string; name: string };
  }

  const auditActions = () => context.stores.audit.map((event) => event.action);
  const lastAudit = () => context.stores.audit.at(-1);

  return { ...context, owner, join, createBrand, auditActions, lastAudit };
}

function expectValidation(res: request.Response, path: string, message: string) {
  expect(res.status).toBe(400);
  expect(res.body.error.code).toBe('VALIDATION_ERROR');
  expect(res.body.error.details).toContainEqual({ path, message });
}

/* -------------------------------------------------------------- helpers */

describe('normalizeDomain', () => {
  it.each([
    ['example.com', 'example.com'],
    ['https://www.Example.com/path', 'example.com'],
    ['  HTTP://WWW.EXAMPLE.COM:8080/a/b?c=d#e  ', 'example.com'],
    ['shop.example.co.uk', 'shop.example.co.uk'],
    ['example.com.', 'example.com'],
    ['bücher.de', 'xn--bcher-kva.de'],
    ['https://www.bücher.de/katalog', 'xn--bcher-kva.de'],
    ['xn--bcher-kva.de', 'xn--bcher-kva.de'],
    ['my-brand.example', 'my-brand.example'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    'not a domain',
    'localhost',
    'example',
    '192.168.0.1',
    'example.c',
    'example.123',
    '-bad.com',
    'bad-.com',
    'exa_mple.com',
    'user@example.com',
    'https://user:pass@example.com',
    'ftp://example.com',
    'example..com',
    `${'a'.repeat(64)}.com`,
    `${'a.'.repeat(130)}com`,
  ])('rejects %j', (input) => {
    expect(normalizeDomain(input)).toBeNull();
  });
});

describe('logo type sniffing', () => {
  it('recognises PNG, JPEG and WebP by their first bytes', () => {
    expect(sniffLogoType(PNG)).toBe('image/png');
    expect(sniffLogoType(JPEG)).toBe('image/jpeg');
    expect(sniffLogoType(WEBP)).toBe('image/webp');
  });

  it('refuses SVG, GIF, text, programs and empty files', () => {
    for (const bytes of [SVG, GIF, TEXT, EXE, Buffer.alloc(0), Buffer.from('RIFF')]) {
      expect(sniffLogoType(bytes)).toBeNull();
    }
  });

  it('cleans file names for display', () => {
    expect(sanitizeFileName('C:\\Users\\me\\Desktop\\logo.png')).toBe('logo.png');
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('evil\u202Egnp.exe')).toBe('evilgnp.exe');
    expect(sanitizeFileName('a\u0000b\nc\td.png')).toBe('abcd.png');
    expect(sanitizeFileName('my   logo .png')).toBe('my logo .png');
    expect(sanitizeFileName('   ')).toBe('logo');
    expect(sanitizeFileName(undefined)).toBe('logo');
    expect([...sanitizeFileName(`${'é'.repeat(150)}.png`)]).toHaveLength(100);
  });
});

/* --------------------------------------------------------------- brands */

describe('brands: create, read, update, delete', () => {
  it('starts empty, creates a brand and shows it in the list and detail', async () => {
    const { owner, clock } = await organisation();
    expect((await owner.get('/api/v1/brands')).body.data).toEqual([]);

    const created = await owner.post('/api/v1/brands').send({
      name: '  Acme   Coffee ',
      description: ' Our coffee shops ',
      keywords: [' acme ', 'Acme', 'acme coffee', 'ACME  roasters'],
    });
    expect(created.status).toBe(201);
    const brand = created.body.data;
    expect(brand).toEqual({
      id: expect.stringMatching(/^[a-f\d]{24}$/),
      name: 'Acme Coffee',
      description: 'Our coffee shops',
      status: 'active',
      keywords: ['acme', 'acme coffee', 'ACME roasters'],
      domains: [],
      trademarks: [],
      logos: [],
      monitoring: {
        domains: true,
        apps: false,
        trademarks: false,
        sensitivity: 'medium',
        emailAlerts: false,
        updatedAt: null,
      },
      createdAt: clock.now().toISOString(),
      updatedAt: clock.now().toISOString(),
    });

    clock.advance(1000);
    await owner.post('/api/v1/brands').send({ name: 'Acme Tea' }).expect(201);

    const list = await owner.get('/api/v1/brands');
    expect(list.status).toBe(200);
    expect(list.headers['cache-control']).toBe('private, no-store');
    expect(list.body.data.map((row: { name: string }) => row.name)).toEqual([
      'Acme Tea',
      'Acme Coffee',
    ]);
    expect(list.body.data[1]).toEqual({
      id: brand.id,
      name: 'Acme Coffee',
      description: 'Our coffee shops',
      status: 'active',
      logoUrl: null,
      counts: { keywords: 3, domains: 0, trademarks: 0, logos: 0 },
      updatedAt: brand.updatedAt,
    });

    const detail = await owner.get(`/api/v1/brands/${brand.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data).toEqual(brand);
  });

  it('validates every brand field with plain messages', async () => {
    const { owner } = await organisation();
    const post = (body: unknown) => owner.post('/api/v1/brands').send(body as object);

    expectValidation(await post({}), 'name', 'Enter a brand name');
    expectValidation(await post({ name: '   ' }), 'name', 'Enter a brand name');
    expectValidation(await post({ name: 'x'.repeat(81) }), 'name', 'Use at most 80 characters');
    expectValidation(
      await post({ name: 'Ok', description: 'x'.repeat(501) }),
      'description',
      'Use at most 500 characters',
    );
    expectValidation(
      await post({ name: 'Ok', keywords: Array.from({ length: 51 }, (_, i) => `k${i}`) }),
      'keywords',
      'Add at most 50 keywords',
    );
    expectValidation(
      await post({ name: 'Ok', keywords: ['fine', 'x'.repeat(61)] }),
      'keywords.1',
      'Keep each keyword to 60 characters or fewer',
    );
    expectValidation(
      await post({ name: 'Ok', keywords: ['  '] }),
      'keywords.0',
      "Keywords can't be empty",
    );
    expectValidation(
      await post({ name: 'Ok', keywords: 'acme' }),
      'keywords',
      'Keywords must be a list',
    );

    // Exactly at the limits is fine.
    const atLimits = await post({
      name: 'x'.repeat(80),
      description: 'y'.repeat(500),
      keywords: Array.from(
        { length: 50 },
        (_, i) => `${'k'.repeat(58)}${i.toString().padStart(2, '0')}`,
      ),
    });
    expect(atLimits.status).toBe(201);
    expect(atLimits.body.data.keywords).toHaveLength(50);
  });

  it('refuses a second brand with the same name, ignoring case', async () => {
    const { owner, createBrand } = await organisation();
    await createBrand({ name: 'Acme Coffee' });
    const again = await owner.post('/api/v1/brands').send({ name: 'ACME coffee' });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('CONFLICT');

    const tea = await createBrand({ name: 'Acme Tea' });
    const rename = await owner.patch(`/api/v1/brands/${tea.id}`).send({ name: 'acme COFFEE' });
    expect(rename.status).toBe(409);
    // Changing only the case of its own name is allowed.
    const recase = await owner.patch(`/api/v1/brands/${tea.id}`).send({ name: 'ACME Tea' });
    expect(recase.status).toBe(200);
    expect(recase.body.data.name).toBe('ACME Tea');
  });

  it('allows at most 50 brands per organisation', async () => {
    const { owner, createBrand } = await organisation();
    for (let i = 0; i < 50; i += 1) await createBrand({ name: `Brand ${i}` });
    const tooMany = await owner.post('/api/v1/brands').send({ name: 'Brand 51' });
    expect(tooMany.status).toBe(409);
    expect(tooMany.body.error.message).toBe('Your organisation can have up to 50 brands.');
  });

  it('updates name, description, keywords and status, and audits the change', async () => {
    const { owner, createBrand, lastAudit } = await organisation();
    const brand = await createBrand({ name: 'Acme Coffee' });

    expectValidation(
      await owner.patch(`/api/v1/brands/${brand.id}`).send({}),
      '',
      'Change at least one field',
    );
    expectValidation(
      await owner.patch(`/api/v1/brands/${brand.id}`).send({ status: 'deleted' }),
      'status',
      'Choose active or paused',
    );

    const res = await owner.patch(`/api/v1/brands/${brand.id}`).send({
      name: 'Acme Roasters',
      description: 'New description',
      keywords: ['roast'],
      status: 'paused',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: 'Acme Roasters',
      description: 'New description',
      keywords: ['roast'],
      status: 'paused',
    });
    expect(lastAudit()).toMatchObject({
      action: 'brand.updated',
      target: { type: 'brand', id: brand.id, label: 'Acme Roasters' },
      metadata: {
        brandName: 'Acme Roasters',
        previousName: 'Acme Coffee',
        fields: ['name', 'description', 'keywords', 'status'],
        status: 'paused',
      },
    });

    // Saving the same values again changes nothing and writes no audit event.
    const before = lastAudit();
    const same = await owner.patch(`/api/v1/brands/${brand.id}`).send({ status: 'paused' });
    expect(same.status).toBe(200);
    expect(lastAudit()).toBe(before);
  });

  it('answers 400 for a malformed id and 404 for an unknown one', async () => {
    const { owner } = await organisation();
    const bad = await owner.get('/api/v1/brands/not-an-id');
    expectValidation(bad, 'brandId', 'Must be a valid ID');
    const unknown = await owner.get(`/api/v1/brands/${'f'.repeat(24)}`);
    expect(unknown.status).toBe(404);
    expect(unknown.body.error.code).toBe('NOT_FOUND');
  });

  it('deletes a brand together with its logos', async () => {
    const { owner, createBrand, stores, lastAudit } = await organisation();
    const brand = await createBrand();
    const keep = await createBrand({ name: 'Keep Me' });
    for (const target of [brand, keep]) {
      await owner
        .post(`/api/v1/brands/${target.id}/logos`)
        .attach('logo', PNG, 'logo.png')
        .expect(201);
    }
    expect(stores.brandLogos.size).toBe(2);

    const res = await owner.delete(`/api/v1/brands/${brand.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ deleted: true });
    expect((await owner.get(`/api/v1/brands/${brand.id}`)).status).toBe(404);
    expect([...stores.brandLogos.values()].map((logo) => logo.brandId)).toEqual([keep.id]);
    expect(lastAudit()).toMatchObject({
      action: 'brand.deleted',
      metadata: { brandName: 'Acme Coffee', logos: 1 },
    });
    expect((await owner.delete(`/api/v1/brands/${brand.id}`)).status).toBe(404);
  });
});

/* -------------------------------------------------------------- domains */

describe('brands: official domains', () => {
  it('normalises, stores and removes domains', async () => {
    const { owner, createBrand, clock, lastAudit } = await organisation();
    const brand = await createBrand();
    const url = `/api/v1/brands/${brand.id}/domains`;

    const added = await owner.post(url).send({ domain: 'https://www.Example.com/path' });
    expect(added.status).toBe(201);
    expect(added.body.data.domains).toEqual([
      { domain: 'example.com', addedAt: clock.now().toISOString() },
    ]);
    expect(lastAudit()).toMatchObject({
      action: 'brand.domain_added',
      metadata: { brandName: 'Acme Coffee', domain: 'example.com' },
    });

    const idn = await owner.post(url).send({ domain: 'bücher.de' });
    expect(idn.status).toBe(201);
    expect(idn.body.data.domains.map((d: { domain: string }) => d.domain)).toEqual([
      'example.com',
      'xn--bcher-kva.de',
    ]);

    const duplicate = await owner.post(url).send({ domain: 'WWW.EXAMPLE.COM' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.message).toBe('This domain is already on this brand.');

    // The URL may hold the domain in any form; it is normalised the same way.
    const removed = await owner.delete(`${url}/${encodeURIComponent('www.bücher.de')}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.domains.map((d: { domain: string }) => d.domain)).toEqual([
      'example.com',
    ]);
    expect(lastAudit()).toMatchObject({
      action: 'brand.domain_removed',
      metadata: { domain: 'xn--bcher-kva.de' },
    });

    expect((await owner.delete(`${url}/other.example`)).status).toBe(404);
    expectValidation(
      await owner.delete(`${url}/not_valid`),
      'domain',
      'Enter a domain like example.com',
    );
  });

  it.each(['', 'not a domain', 'localhost', '192.168.1.1', 'exa_mple.com', 'user@example.com'])(
    'refuses %j with the plain domain message',
    async (domain) => {
      const { owner, createBrand } = await organisation();
      const brand = await createBrand();
      const res = await owner.post(`/api/v1/brands/${brand.id}/domains`).send({ domain });
      expectValidation(res, 'domain', 'Enter a domain like example.com');
    },
  );

  it('refuses a missing domain field and allows at most 50 domains', async () => {
    const { owner, createBrand } = await organisation();
    const brand = await createBrand();
    const url = `/api/v1/brands/${brand.id}/domains`;
    expectValidation(await owner.post(url).send({}), 'domain', 'Enter a domain like example.com');

    for (let i = 0; i < 50; i += 1) {
      await owner
        .post(url)
        .send({ domain: `site${i}.example` })
        .expect(201);
    }
    const tooMany = await owner.post(url).send({ domain: 'one-more.example' });
    expect(tooMany.status).toBe(409);
    expect(tooMany.body.error.message).toBe('A brand can have up to 50 domains.');
  });
});

/* ----------------------------------------------------------- trademarks */

describe('brands: trademarks', () => {
  const valid = {
    mark: 'ACME COFFEE',
    office: 'IP_INDIA',
    number: '1234567',
    classes: [43, 30, 30],
    status: 'registered',
  };

  it('adds, edits and removes trademarks', async () => {
    const { owner, createBrand, lastAudit } = await organisation();
    const brand = await createBrand();
    const url = `/api/v1/brands/${brand.id}/trademarks`;

    const added = await owner.post(url).send(valid);
    expect(added.status).toBe(201);
    const [trademark] = added.body.data.trademarks;
    expect(trademark).toEqual({
      id: expect.stringMatching(/^[a-f\d]{24}$/),
      mark: 'ACME COFFEE',
      office: 'IP_INDIA',
      number: '1234567',
      classes: [30, 43],
      status: 'registered',
      date: null,
    });
    expect(lastAudit()).toMatchObject({
      action: 'brand.trademark_added',
      metadata: { brandName: 'Acme Coffee', mark: 'ACME COFFEE' },
    });

    const edited = await owner
      .patch(`${url}/${trademark.id}`)
      .send({ status: 'expired', date: '2024-05-31', classes: [9] });
    expect(edited.status).toBe(200);
    expect(edited.body.data.trademarks[0]).toMatchObject({
      id: trademark.id,
      mark: 'ACME COFFEE',
      status: 'expired',
      date: '2024-05-31',
      classes: [9],
    });
    expect(lastAudit()).toMatchObject({
      action: 'brand.trademark_updated',
      metadata: { mark: 'ACME COFFEE', fields: ['status', 'date', 'classes'] },
    });

    const cleared = await owner.patch(`${url}/${trademark.id}`).send({ date: null });
    expect(cleared.body.data.trademarks[0].date).toBeNull();

    expectValidation(
      await owner.patch(`${url}/${trademark.id}`).send({}),
      '',
      'Change at least one field',
    );
    expect((await owner.patch(`${url}/${'e'.repeat(24)}`).send({ mark: 'X' })).status).toBe(404);

    const removed = await owner.delete(`${url}/${trademark.id}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.trademarks).toEqual([]);
    expect(lastAudit()).toMatchObject({
      action: 'brand.trademark_removed',
      metadata: { mark: 'ACME COFFEE' },
    });
    expect((await owner.delete(`${url}/${trademark.id}`)).status).toBe(404);
  });

  it.each([
    [{ mark: '' }, 'mark', 'Enter the trademark'],
    [{ mark: 'x'.repeat(121) }, 'mark', 'Use at most 120 characters'],
    [{ office: 'MOON' }, 'office', 'Choose a trademark office'],
    [{ number: ' ' }, 'number', 'Enter the registration or application number'],
    [{ number: '1'.repeat(41) }, 'number', 'Use at most 40 characters'],
    [{ classes: [] }, 'classes', 'Add at least one Nice class'],
    [{ classes: [0] }, 'classes.0', 'Nice classes are whole numbers from 1 to 45'],
    [{ classes: [46] }, 'classes.0', 'Nice classes are whole numbers from 1 to 45'],
    [{ classes: [1.5] }, 'classes.0', 'Nice classes are whole numbers from 1 to 45'],
    [{ classes: ['9'] }, 'classes.0', 'Nice classes are whole numbers from 1 to 45'],
    [{ status: 'pending' }, 'status', 'Choose filed, registered or expired'],
    [{ date: '2024-02-30' }, 'date', 'Enter a date like 2024-05-31'],
    [{ date: '31/05/2024' }, 'date', 'Enter a date like 2024-05-31'],
  ])('refuses %j', async (override, path, message) => {
    const { owner, createBrand } = await organisation();
    const brand = await createBrand();
    const res = await owner
      .post(`/api/v1/brands/${brand.id}/trademarks`)
      .send({ ...valid, ...override });
    expectValidation(res, path, message);
  });

  it('allows at most 100 trademarks per brand', async () => {
    const { owner, createBrand } = await organisation();
    const brand = await createBrand();
    const url = `/api/v1/brands/${brand.id}/trademarks`;
    for (let i = 0; i < 100; i += 1) {
      await owner
        .post(url)
        .send({ ...valid, number: `N${i}` })
        .expect(201);
    }
    const tooMany = await owner.post(url).send(valid);
    expect(tooMany.status).toBe(409);
    expect(tooMany.body.error.message).toBe('A brand can have up to 100 trademarks.');
  });
});

/* ----------------------------------------------------------- monitoring */

describe('brands: monitoring settings', () => {
  const settings = {
    domains: false,
    apps: true,
    trademarks: true,
    sensitivity: 'high',
    emailAlerts: true,
  };

  it('stores the full settings and audits the change', async () => {
    const { owner, createBrand, clock, lastAudit } = await organisation();
    const brand = await createBrand();
    clock.advance(60_000);
    const res = await owner.put(`/api/v1/brands/${brand.id}/monitoring`).send(settings);
    expect(res.status).toBe(200);
    expect(res.body.data.monitoring).toEqual({
      ...settings,
      updatedAt: clock.now().toISOString(),
    });
    expect(lastAudit()).toMatchObject({
      action: 'brand.monitoring_updated',
      metadata: { brandName: 'Acme Coffee', ...settings },
    });
  });

  it('needs every setting, with valid values', async () => {
    const { owner, createBrand } = await organisation();
    const brand = await createBrand();
    const url = `/api/v1/brands/${brand.id}/monitoring`;
    expectValidation(await owner.put(url).send({ domains: true }), 'apps', 'Choose on or off');
    expectValidation(
      await owner.put(url).send({ ...settings, sensitivity: 'extreme' }),
      'sensitivity',
      'Choose low, medium or high',
    );
    expectValidation(
      await owner.put(url).send({ ...settings, emailAlerts: 'yes' }),
      'emailAlerts',
      'Choose on or off',
    );
  });
});

/* ---------------------------------------------------------------- logos */

describe('brands: logos', () => {
  it.each([
    ['PNG', PNG, 'logo.png', 'image/png'],
    ['JPEG', JPEG, 'logo.jpg', 'image/jpeg'],
    ['WebP', WEBP, 'logo.webp', 'image/webp'],
    // The type comes from the bytes, not the name.
    ['PNG named .gif', PNG, 'logo.gif', 'image/png'],
  ])('accepts a real %s and serves it back safely', async (_label, bytes, name, type) => {
    const { owner, createBrand, clock, lastAudit } = await organisation();
    const brand = await createBrand();
    const res = await owner
      .post(`/api/v1/brands/${brand.id}/logos`)
      .attach('logo', bytes, { filename: name, contentType: 'application/octet-stream' });
    expect(res.status).toBe(201);
    const [logo] = res.body.data.logos;
    expect(logo).toEqual({
      id: expect.stringMatching(/^[a-f\d]{24}$/),
      fileName: name,
      contentType: type,
      size: bytes.length,
      uploadedAt: clock.now().toISOString(),
      url: `/api/v1/brands/${brand.id}/logos/${logo.id}`,
    });
    expect(lastAudit()).toMatchObject({
      action: 'brand.logo_uploaded',
      metadata: { brandName: 'Acme Coffee', fileName: name },
    });

    const image = await owner.get(logo.url).buffer(true).parse(binary);
    expect(image.status).toBe(200);
    expect(Buffer.compare(image.body as Buffer, bytes)).toBe(0);
    expect(image.headers['content-type']).toBe(type);
    expect(image.headers['x-content-type-options']).toBe('nosniff');
    expect(image.headers['content-security-policy']).toBe("default-src 'none'");
    expect(image.headers['cache-control']).toBe('private, max-age=300');
    expect(image.headers['content-disposition']).toBe('inline');

    const list = await owner.get('/api/v1/brands');
    expect(list.body.data[0]).toMatchObject({ logoUrl: logo.url, counts: { logos: 1 } });
  });

  it.each([
    ['SVG', SVG, 'logo.svg', 'image/svg+xml'],
    ['GIF', GIF, 'logo.gif', 'image/gif'],
    ['text renamed .png', TEXT, 'logo.png', 'image/png'],
    ['program renamed .png', EXE, 'logo.png', 'image/png'],
    ['empty file', Buffer.alloc(0), 'logo.png', 'image/png'],
    ['file over 1 MB', pngOfSize(1_048_577), 'big.png', 'image/png'],
  ])('refuses a %s with a plain 400', async (_label, bytes, name, claimedType) => {
    const { owner, createBrand, stores } = await organisation();
    const brand = await createBrand();
    const res = await owner
      .post(`/api/v1/brands/${brand.id}/logos`)
      .attach('logo', bytes, { filename: name, contentType: claimedType });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [{ path: 'logo', message: LOGO_MESSAGE }],
    });
    expect(stores.brandLogos.size).toBe(0);
  });

  it('accepts a file of exactly 1 MB', async () => {
    const { owner, createBrand } = await organisation();
    const brand = await createBrand();
    const res = await owner
      .post(`/api/v1/brands/${brand.id}/logos`)
      .attach('logo', pngOfSize(1_048_576), 'exact.png');
    expect(res.status).toBe(201);
    expect(res.body.data.logos[0].size).toBe(1_048_576);
  });

  it('refuses a missing file, a wrong field name and two files', async () => {
    const { owner, createBrand } = await organisation();
    const brand = await createBrand();
    const url = `/api/v1/brands/${brand.id}/logos`;
    for (const res of [
      await owner.post(url).send({}),
      await owner.post(url).field('note', 'no file'),
      await owner.post(url).attach('image', PNG, 'logo.png'),
      await owner.post(url).attach('logo', PNG, 'a.png').attach('logo', PNG, 'b.png'),
    ]) {
      expect(res.status).toBe(400);
      expect(res.body.error.details).toEqual([{ path: 'logo', message: LOGO_MESSAGE }]);
    }
  });

  it('cleans the file name it stores', async () => {
    const { owner, createBrand } = await organisation();
    const brand = await createBrand();
    const res = await owner
      .post(`/api/v1/brands/${brand.id}/logos`)
      .attach('logo', PNG, 'Café\u202Egnp.exe.png');
    expect(res.status).toBe(201);
    expect(res.body.data.logos[0].fileName).toBe('Cafégnp.exe.png');
  });

  it('allows at most 5 logos and removes them', async () => {
    const { owner, createBrand, stores, lastAudit } = await organisation();
    const brand = await createBrand();
    const url = `/api/v1/brands/${brand.id}/logos`;
    let latest;
    for (let i = 0; i < 5; i += 1) {
      latest = await owner.post(url).attach('logo', PNG, `logo-${i}.png`).expect(201);
    }
    const sixth = await owner.post(url).attach('logo', PNG, 'six.png');
    expect(sixth.status).toBe(409);
    expect(sixth.body.error.message).toBe('A brand can have up to 5 logos.');
    expect(stores.brandLogos.size).toBe(5);

    const first = latest?.body.data.logos[0];
    const removed = await owner.delete(`${url}/${first.id}`);
    expect(removed.status).toBe(200);
    expect(removed.body.data.logos).toHaveLength(4);
    expect(stores.brandLogos.size).toBe(4);
    expect(lastAudit()).toMatchObject({
      action: 'brand.logo_removed',
      metadata: { fileName: 'logo-0.png' },
    });
    expect((await owner.get(first.url)).status).toBe(404);
    expect((await owner.delete(`${url}/${first.id}`)).status).toBe(404);
  });
});

/* ---------------------------------------------------------- permissions */

describe('brands: roles and sign-in', () => {
  it.each(['viewer', 'analyst', 'legal'] as const)(
    'lets a %s read everything but change nothing',
    async (role) => {
      const { owner, join, createBrand, stores } = await organisation();
      const brand = await createBrand();
      const withLogo = await owner
        .post(`/api/v1/brands/${brand.id}/logos`)
        .attach('logo', PNG, 'logo.png');
      const logo = withLogo.body.data.logos[0];
      const trademark = (
        await owner.post(`/api/v1/brands/${brand.id}/trademarks`).send({
          mark: 'ACME',
          office: 'USPTO',
          number: '1',
          classes: [30],
          status: 'filed',
        })
      ).body.data.trademarks[0];
      await owner.post(`/api/v1/brands/${brand.id}/domains`).send({ domain: 'acme.example' });

      const member = await join(role);
      expect((await member.get('/api/v1/brands')).status).toBe(200);
      expect((await member.get(`/api/v1/brands/${brand.id}`)).status).toBe(200);
      expect((await member.get(logo.url)).status).toBe(200);

      const base = `/api/v1/brands/${brand.id}`;
      const attempts = [
        member.post('/api/v1/brands').send({ name: 'Mine' }),
        member.patch(base).send({ name: 'Renamed' }),
        member.delete(base),
        member.post(`${base}/domains`).send({ domain: 'new.example' }),
        member.delete(`${base}/domains/acme.example`),
        member.post(`${base}/trademarks`).send({ mark: 'X' }),
        member.patch(`${base}/trademarks/${trademark.id}`).send({ mark: 'X' }),
        member.delete(`${base}/trademarks/${trademark.id}`),
        member.put(`${base}/monitoring`).send({}),
        member.post(`${base}/logos`).attach('logo', PNG, 'logo.png'),
        member.delete(`${base}/logos/${logo.id}`),
      ];
      for (const res of await Promise.all(attempts)) {
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
      }
      expect(stores.brands.size).toBe(1);
      expect(stores.brandLogos.size).toBe(1);
    },
  );

  it('lets an Admin manage brands', async () => {
    const { join } = await organisation();
    const admin = await join('admin');
    expect((await admin.post('/api/v1/brands').send({ name: 'Admin Brand' })).status).toBe(201);
  });

  it('needs sign-in, the database, and a trusted origin', async () => {
    const { app, owner } = await organisation();
    const anonymous = await request(app).get('/api/v1/brands');
    expect(anonymous.status).toBe(401);
    expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

    const crossSite = await owner
      .post('/api/v1/brands')
      .set('Origin', 'https://evil.example')
      .send({ name: 'Sneaky' });
    expect(crossSite.status).toBe(403);
    expect(crossSite.body.error.code).toBe('FORBIDDEN_ORIGIN');

    const down = buildAuthTestApp({ databaseReady: false });
    expect((await request(down.app).get('/api/v1/brands')).status).toBe(503);
  });

  it('records every change in the audit log in order', async () => {
    const { owner, createBrand, auditActions } = await organisation();
    const brand = await createBrand();
    const base = `/api/v1/brands/${brand.id}`;
    await owner.patch(base).send({ description: 'x' }).expect(200);
    await owner.post(`${base}/domains`).send({ domain: 'acme.example' }).expect(201);
    await owner.delete(`${base}/domains/acme.example`).expect(200);
    const tm = await owner
      .post(`${base}/trademarks`)
      .send({ mark: 'ACME', office: 'OTHER', number: '1', classes: [1], status: 'filed' })
      .expect(201);
    const tmId = tm.body.data.trademarks[0].id;
    await owner.patch(`${base}/trademarks/${tmId}`).send({ mark: 'ACME 2' }).expect(200);
    await owner.delete(`${base}/trademarks/${tmId}`).expect(200);
    await owner
      .put(`${base}/monitoring`)
      .send({
        domains: true,
        apps: false,
        trademarks: false,
        sensitivity: 'low',
        emailAlerts: false,
      })
      .expect(200);
    const logo = await owner.post(`${base}/logos`).attach('logo', PNG, 'l.png').expect(201);
    await owner.delete(`${base}/logos/${logo.body.data.logos[0].id}`).expect(200);
    await owner.delete(base).expect(200);

    expect(auditActions().filter((action) => action.startsWith('brand.'))).toEqual([
      'brand.created',
      'brand.updated',
      'brand.domain_added',
      'brand.domain_removed',
      'brand.trademark_added',
      'brand.trademark_updated',
      'brand.trademark_removed',
      'brand.monitoring_updated',
      'brand.logo_uploaded',
      'brand.logo_removed',
      'brand.deleted',
    ]);
  });
});
