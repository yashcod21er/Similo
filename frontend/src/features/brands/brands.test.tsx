import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { OverviewPage } from '@/features/app-shell/OverviewPage';
import type { Permission } from '@/features/auth/api';
import type { Brand, BrandSummary } from './api';
import { BrandDetailPage } from './BrandDetailPage';
import { BrandsPage } from './BrandsPage';
import { checkLogoFile, LOGO_ERROR, parseNiceClass, previewDomain } from './rules';

/* ------------------------------------------------------------------ Fixtures */

const VIEWER_PERMISSIONS: Permission[] = ['organization:read', 'members:read', 'brands:read'];
const OWNER_PERMISSIONS: Permission[] = [...VIEWER_PERMISSIONS, 'members:manage', 'brands:manage'];

function me(role: 'owner' | 'viewer') {
  return {
    user: { id: 'u1', name: 'Asha Rao', email: 'asha@acme.example' },
    organization: { id: 'o1', name: 'Acme Brands' },
    role,
    roleLabel: role === 'owner' ? 'Owner' : 'Viewer',
    permissions: role === 'owner' ? OWNER_PERMISSIONS : VIEWER_PERMISSIONS,
  };
}

const NOW = '2026-11-08T10:00:00.000Z';

function makeBrand(overrides: Partial<Brand> = {}): Brand {
  return {
    id: 'b1',
    name: 'Acme',
    description: 'Anvils and rockets',
    status: 'active',
    keywords: ['acme corp'],
    domains: [{ domain: 'acme.com', addedAt: NOW }],
    trademarks: [
      {
        id: 't1',
        mark: 'ACME',
        office: 'USPTO',
        number: '12345',
        classes: [9, 35],
        status: 'registered',
        date: '2026-01-15',
      },
    ],
    logos: [
      {
        id: 'l1',
        fileName: 'acme.png',
        contentType: 'image/png',
        size: 2048,
        uploadedAt: NOW,
        url: '/api/v1/brands/b1/logos/l1',
      },
    ],
    monitoring: {
      domains: true,
      apps: false,
      trademarks: false,
      sensitivity: 'medium',
      emailAlerts: false,
      updatedAt: null,
    },
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function summaryOf(brand: Brand): BrandSummary {
  return {
    id: brand.id,
    name: brand.name,
    description: brand.description,
    status: brand.status,
    logoUrl: brand.logos[0]?.url ?? null,
    counts: {
      keywords: brand.keywords.length,
      domains: brand.domains.length,
      trademarks: brand.trademarks.length,
      logos: brand.logos.length,
    },
    updatedAt: brand.updatedAt,
  };
}

/* ------------------------------------------------------------------ Test API */

const ok = (data: unknown, status = 200) => Response.json({ success: true, data }, { status });
const fail = (status: number, code: string, message: string, details?: unknown) =>
  Response.json({ success: false, error: { code, message, requestId: 'r', details } }, { status });

interface Call {
  method: string;
  path: string;
  body: unknown;
  init: RequestInit;
}

/**
 * Stands in for the whole API. `handler` answers brand requests; /auth/me is built in.
 * Every request is recorded in `calls` so tests can check what was sent.
 */
function stubApi(role: 'owner' | 'viewer', handler: (call: Call) => Response | undefined) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = url.replace('/api/v1', '');
    const call: Call = {
      method: init.method ?? 'GET',
      path,
      body: typeof init.body === 'string' ? (JSON.parse(init.body) as unknown) : init.body,
      init,
    };
    if (path === '/auth/me') return ok(me(role));
    calls.push(call);
    return (
      handler(call) ?? fail(404, 'NOT_FOUND', `No fake answer for ${call.method} ${call.path}`)
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

function renderAt(initialPath: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      { path: '/app', element: <OverviewPage /> },
      { path: '/app/brands', element: <BrandsPage /> },
      { path: '/app/brands/:brandId', element: <BrandDetailPage /> },
    ],
    { initialEntries: [initialPath] },
  );
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
}

/* -------------------------------------------------------------------- Brands */

describe('BrandsPage', () => {
  it('explains what a brand is when there are none yet', async () => {
    stubApi('owner', ({ path }) => (path === '/brands' ? ok([]) : undefined));
    renderAt('/app/brands');

    expect(
      await screen.findByRole('heading', { name: 'Add the first brand you want to protect' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/A brand is a name your customers know you by/)).toBeInTheDocument();
    expect(screen.getByText('Monitoring starts in a later phase.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add brand' })).toBeInTheDocument();
  });

  it('lists brands as cards with their counts', async () => {
    const brand = makeBrand();
    stubApi('owner', ({ path }) => (path === '/brands' ? ok([summaryOf(brand)]) : undefined));
    renderAt('/app/brands');

    const link = await screen.findByRole('link', { name: 'Acme' });
    expect(link).toHaveAttribute('href', '/app/brands/b1');
    const card = link.closest('li') as HTMLElement;
    expect(within(card).getByText('1 domain')).toBeInTheDocument();
    expect(within(card).getByText('1 trademark')).toBeInTheDocument();
    expect(within(card).getByText('Active')).toBeInTheDocument();
  });

  it('adds a brand with keywords, then opens it', async () => {
    const created = makeBrand({ id: 'new1', name: 'Globex', keywords: ['globex corp', 'globex'] });
    const calls = stubApi('owner', ({ method, path }) => {
      if (path === '/brands' && method === 'GET') return ok([]);
      if (path === '/brands' && method === 'POST') return ok(created, 201);
      return undefined;
    });
    const router = renderAt('/app/brands');

    await userEvent.click(await screen.findByRole('button', { name: 'Add brand' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a brand' });
    await userEvent.type(within(dialog).getByLabelText('Brand name'), 'Globex');
    // A comma ends a keyword; Enter ends the last one. Enter must not submit the form.
    await userEvent.type(
      within(dialog).getByLabelText('Keywords and other spellings (optional)'),
      'globex corp,globex{Enter}',
    );
    expect(within(dialog).getByText('globex corp')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add brand' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/brands/new1'));
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.body).toEqual({
      name: 'Globex',
      description: '',
      keywords: ['globex corp', 'globex'],
    });
  });

  it('keeps a keyword that was typed but not yet confirmed', async () => {
    const calls = stubApi('owner', ({ method, path }) => {
      if (path === '/brands' && method === 'GET') return ok([]);
      if (path === '/brands' && method === 'POST') return ok(makeBrand({ id: 'x' }), 201);
      return undefined;
    });
    renderAt('/app/brands');

    await userEvent.click(await screen.findByRole('button', { name: 'Add brand' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a brand' });
    await userEvent.type(within(dialog).getByLabelText('Brand name'), 'Globex');
    await userEvent.type(
      within(dialog).getByLabelText('Keywords and other spellings (optional)'),
      'globex shop',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add brand' }));

    await waitFor(() => expect(calls.some((call) => call.method === 'POST')).toBe(true));
    expect(calls.find((call) => call.method === 'POST')?.body).toMatchObject({
      keywords: ['globex shop'],
    });
  });

  it('checks the name before sending anything', async () => {
    const calls = stubApi('owner', ({ path }) => (path === '/brands' ? ok([]) : undefined));
    renderAt('/app/brands');

    await userEvent.click(await screen.findByRole('button', { name: 'Add brand' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a brand' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add brand' }));

    expect(await within(dialog).findByText('Enter a brand name')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it("shows the API's validation message on the matching field", async () => {
    stubApi('owner', ({ method, path }) => {
      if (path === '/brands' && method === 'GET') return ok([]);
      if (path === '/brands' && method === 'POST') {
        return fail(400, 'VALIDATION_ERROR', 'Check the highlighted fields.', [
          { path: 'name', message: 'Brand names cannot contain < or >.' },
          { path: 'keywords.1', message: 'Keywords can be at most 60 characters.' },
        ]);
      }
      return undefined;
    });
    renderAt('/app/brands');

    await userEvent.click(await screen.findByRole('button', { name: 'Add brand' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a brand' });
    const name = within(dialog).getByLabelText('Brand name');
    await userEvent.type(name, 'A<b>');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add brand' }));

    const message = await within(dialog).findByText('Brand names cannot contain < or >.');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name.getAttribute('aria-describedby')).toBe(message.id);
    expect(within(dialog).getByText('Keywords can be at most 60 characters.')).toBeInTheDocument();
  });

  it('shows "you already have a brand with this name" next to the name field', async () => {
    stubApi('owner', ({ method, path }) => {
      if (path === '/brands' && method === 'GET') return ok([]);
      if (path === '/brands' && method === 'POST') {
        return fail(409, 'CONFLICT', 'You already have a brand with this name.');
      }
      return undefined;
    });
    renderAt('/app/brands');

    await userEvent.click(await screen.findByRole('button', { name: 'Add brand' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a brand' });
    const name = within(dialog).getByLabelText('Brand name');
    await userEvent.type(name, 'Acme');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add brand' }));

    const message = await within(dialog).findByText('You already have a brand with this name.');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name.getAttribute('aria-describedby')).toBe(message.id);
  });

  it('shows a Viewer the brands but no way to add one', async () => {
    stubApi('viewer', ({ path }) => (path === '/brands' ? ok([]) : undefined));
    renderAt('/app/brands');

    expect(await screen.findByText(/Ask an Owner or Admin to add your brands/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add brand' })).not.toBeInTheDocument();
  });

  it('opens the add form straight away from the Overview link (?add=1)', async () => {
    stubApi('owner', ({ path }) => (path === '/brands' ? ok([]) : undefined));
    renderAt('/app/brands?add=1');
    expect(await screen.findByRole('dialog', { name: 'Add a brand' })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------ Overview step */

describe('Overview "add your first brand" step', () => {
  const organization = { id: 'o1', name: 'Acme Brands', createdAt: NOW, memberCount: 1 };

  it('points an Owner with no brands to the add form', async () => {
    stubApi('owner', ({ path }) => {
      if (path === '/brands') return ok([]);
      if (path === '/organization') return ok(organization);
      return undefined;
    });
    renderAt('/app');

    const link = await screen.findByRole('link', { name: /Add your first brand/ });
    expect(link).toHaveAttribute('href', '/app/brands?add=1');
  });

  it('is done, and offers no "first brand" link, once a brand exists', async () => {
    stubApi('owner', ({ path }) => {
      if (path === '/brands') return ok([summaryOf(makeBrand())]);
      if (path === '/organization') return ok(organization);
      return undefined;
    });
    renderAt('/app');

    expect(await screen.findByText('1 brand is on file.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Add your first brand/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage your brands/ })).toBeInTheDocument();
  });
});

/* --------------------------------------------------------------- Brand page */

const detail = (brand: Brand) => (call: Call) =>
  call.path === `/brands/${brand.id}` && call.method === 'GET' ? ok(brand) : undefined;

describe('BrandDetailPage', () => {
  it('shows a friendly page when the brand does not exist', async () => {
    stubApi('owner', () => fail(404, 'NOT_FOUND', 'Brand not found'));
    renderAt('/app/brands/nope');

    expect(await screen.findByRole('heading', { name: 'Brand not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to all brands/ })).toHaveAttribute(
      'href',
      '/app/brands',
    );
  });

  it('moves between tabs with the arrow keys', async () => {
    stubApi('owner', detail(makeBrand()));
    renderAt('/app/brands/b1');

    const overview = await screen.findByRole('tab', { name: 'Overview' });
    expect(screen.getByRole('tablist', { name: 'Brand sections' })).toBeInTheDocument();
    expect(overview).toHaveAttribute('aria-selected', 'true');

    overview.focus();
    await userEvent.keyboard('{ArrowRight}');
    const domains = screen.getByRole('tab', { name: /^Domains/ });
    expect(domains).toHaveAttribute('aria-selected', 'true');
    expect(domains).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(/Domains/);

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Monitoring' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('saves only the fields that changed', async () => {
    const brand = makeBrand();
    const calls = stubApi('owner', (call) => {
      if (call.method === 'PATCH') return ok({ ...brand, name: 'Acme Global' });
      return detail(brand)(call);
    });
    renderAt('/app/brands/b1');

    const name = await screen.findByLabelText('Brand name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Acme Global');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByText('Changes saved.');
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ name: 'Acme Global' });
  });

  it('pauses a brand from the header', async () => {
    const brand = makeBrand();
    const calls = stubApi('owner', (call) => {
      if (call.method === 'PATCH') return ok({ ...brand, status: 'paused' });
      return detail(brand)(call);
    });
    renderAt('/app/brands/b1');

    await userEvent.click(await screen.findByRole('radio', { name: 'Paused' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Paused' })).toBeChecked());
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ status: 'paused' });
  });

  it('shows a simultaneous-edit conflict and loads the brand again', async () => {
    const brand = makeBrand();
    const calls = stubApi('owner', (call) => {
      if (call.method === 'PATCH') {
        return fail(
          409,
          'CONFLICT',
          'Someone else changed this brand at the same moment. Reload and try again.',
        );
      }
      return detail(brand)(call);
    });
    renderAt('/app/brands/b1');

    await userEvent.click(await screen.findByRole('radio', { name: 'Paused' }));

    expect(await screen.findByText(/Someone else changed this brand/)).toBeInTheDocument();
    await waitFor(() =>
      expect(
        calls.filter((call) => call.method === 'GET' && call.path === '/brands/b1'),
      ).toHaveLength(2),
    );
    // The screen still shows what is really saved.
    expect(screen.getByRole('radio', { name: 'Active' })).toBeChecked();
  });

  it('asks before deleting a brand, then goes back to the list', async () => {
    const brand = makeBrand();
    const calls = stubApi('owner', (call) => {
      if (call.method === 'DELETE') return ok({ deleted: true });
      if (call.path === '/brands') return ok([]);
      return detail(brand)(call);
    });
    const router = renderAt('/app/brands/b1');

    await userEvent.click(await screen.findByRole('button', { name: 'Delete brand' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Acme?' });
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete brand' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/brands'));
    expect(calls.some((call) => call.method === 'DELETE' && call.path === '/brands/b1')).toBe(true);
  });

  describe('for a Viewer', () => {
    it('shows everything but offers no way to change it', async () => {
      stubApi('viewer', detail(makeBrand()));
      renderAt('/app/brands/b1');

      // Overview: plain text instead of a form, no status switch, no delete.
      expect(await screen.findByRole('heading', { name: 'Acme', level: 1 })).toBeInTheDocument();
      expect(screen.getByText('Anvils and rockets')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delete brand' })).not.toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: 'Paused' })).not.toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: /^Domains/ }));
      expect(await screen.findByText('acme.com')).toBeInTheDocument();
      expect(screen.queryByLabelText('Add an official domain')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: /^Logos/ }));
      expect(await screen.findByAltText('Logo file acme.png')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Choose file' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Remove logo/ })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: /^Trademarks/ }));
      expect(await screen.findByText('ACME')).toBeInTheDocument();
      expect(screen.getByText('Class 35')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add trademark' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Edit/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('tab', { name: 'Monitoring' }));
      expect(await screen.findByRole('switch', { name: /Lookalike websites/ })).toBeDisabled();
      expect(screen.getByRole('radio', { name: /Medium/ })).toBeDisabled();
      expect(
        screen.queryByRole('button', { name: 'Save monitoring settings' }),
      ).not.toBeInTheDocument();
    });

    it('does show the same controls to an Owner', async () => {
      stubApi('owner', detail(makeBrand()));
      renderAt('/app/brands/b1?tab=trademarks');

      expect(await screen.findByRole('button', { name: 'Add trademark' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit ACME' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove ACME' })).toBeInTheDocument();
    });
  });
});

/* ------------------------------------------------------------------- Domains */

describe('Domains tab', () => {
  it('shows what will be saved while typing, and sends what was typed', async () => {
    const brand = makeBrand({ domains: [] });
    const calls = stubApi('owner', (call) => {
      if (call.method === 'POST' && call.path === '/brands/b1/domains') {
        return ok(makeBrand({ domains: [{ domain: 'example-shop.com', addedAt: NOW }] }), 201);
      }
      return detail(brand)(call);
    });
    renderAt('/app/brands/b1?tab=domains');

    const input = await screen.findByLabelText('Add an official domain');
    await userEvent.type(input, 'https://www.Example-Shop.com/x');
    expect(screen.getByText('example-shop.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add domain' }));

    expect(await screen.findByText('Added 8 Nov 2026')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      domain: 'https://www.Example-Shop.com/x',
    });
    expect(input).toHaveValue('');
  });

  it("shows the API's message under the field", async () => {
    stubApi('owner', (call) => {
      if (call.method === 'POST') {
        return fail(400, 'VALIDATION_ERROR', 'Check the field.', [
          { path: 'domain', message: 'Enter a domain like example.com' },
        ]);
      }
      return detail(makeBrand())(call);
    });
    renderAt('/app/brands/b1?tab=domains');

    const input = await screen.findByLabelText('Add an official domain');
    await userEvent.type(input, 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Add domain' }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.map((alert) => alert.textContent)).toContain('Enter a domain like example.com');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a duplicate domain (409) as a message on the field', async () => {
    stubApi('owner', (call) => {
      if (call.method === 'POST') {
        return fail(409, 'CONFLICT', 'This domain is already on this brand.');
      }
      return detail(makeBrand())(call);
    });
    renderAt('/app/brands/b1?tab=domains');

    await userEvent.type(await screen.findByLabelText('Add an official domain'), 'acme.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add domain' }));

    expect(await screen.findByText('This domain is already on this brand.')).toBeInTheDocument();
  });

  it('removes a domain', async () => {
    const calls = stubApi('owner', (call) => {
      if (call.method === 'DELETE') return ok(makeBrand({ domains: [] }));
      return detail(makeBrand())(call);
    });
    renderAt('/app/brands/b1?tab=domains');

    await userEvent.click(await screen.findByRole('button', { name: 'Remove acme.com' }));
    expect(
      await screen.findByText('No official domains yet. Add the first one above.'),
    ).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'DELETE')?.path).toBe(
      '/brands/b1/domains/acme.com',
    );
  });
});

/* --------------------------------------------------------------------- Logos */

describe('Logos tab', () => {
  const chooseFile = () => screen.getByLabelText('Choose logo files') as HTMLInputElement;
  // The file picker filters by type, but a dropped file isn't filtered: test that path too.
  const user = () => userEvent.setup({ applyAccept: false });

  it('refuses an SVG in the browser, without contacting the API', async () => {
    const calls = stubApi('owner', detail(makeBrand({ logos: [] })));
    renderAt('/app/brands/b1?tab=logos');
    await screen.findByRole('button', { name: 'Choose file' });

    const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], 'logo.svg', {
      type: 'image/svg+xml',
    });
    await user().upload(chooseFile(), svg);

    expect(await screen.findByText(LOGO_ERROR)).toBeInTheDocument();
    expect(screen.getByText('logo.svg')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('refuses a file over 1 MB', async () => {
    const calls = stubApi('owner', detail(makeBrand({ logos: [] })));
    renderAt('/app/brands/b1?tab=logos');
    await screen.findByRole('button', { name: 'Choose file' });

    const big = new File([new Uint8Array(1_048_577)], 'big.png', { type: 'image/png' });
    await user().upload(chooseFile(), big);

    expect(await screen.findByText(LOGO_ERROR)).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('uploads a PNG as multipart form data in the "logo" field', async () => {
    const withLogo = makeBrand();
    const calls = stubApi('owner', (call) => {
      if (call.method === 'POST' && call.path === '/brands/b1/logos') return ok(withLogo, 201);
      return detail(makeBrand({ logos: [] }))(call);
    });
    renderAt('/app/brands/b1?tab=logos');
    await screen.findByRole('button', { name: 'Choose file' });

    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'acme.png', {
      type: 'image/png',
    });
    await user().upload(chooseFile(), png);

    expect(await screen.findByText('Logo uploaded.')).toBeInTheDocument();
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.body).toBeInstanceOf(FormData);
    expect((post?.body as FormData).get('logo')).toBeInstanceOf(File);
    // The browser must add the multipart boundary itself.
    expect(JSON.stringify(post?.init.headers)).not.toMatch(/content-type/i);
    expect(await screen.findByAltText('Logo file acme.png')).toBeInTheDocument();
  });

  it("shows the API's message when it refuses a file the browser accepted", async () => {
    stubApi('owner', (call) => {
      if (call.method === 'POST') {
        return fail(400, 'VALIDATION_ERROR', 'Check the file.', [
          { path: 'logo', message: LOGO_ERROR },
        ]);
      }
      return detail(makeBrand({ logos: [] }))(call);
    });
    renderAt('/app/brands/b1?tab=logos');
    await screen.findByRole('button', { name: 'Choose file' });

    // Looks like a PNG by name and type, but the server checks the real contents.
    await user().upload(
      chooseFile(),
      new File(['not really an image'], 'fake.png', { type: 'image/png' }),
    );

    expect(await screen.findByText(LOGO_ERROR)).toBeInTheDocument();
  });

  it('asks before removing a logo', async () => {
    const calls = stubApi('owner', (call) => {
      if (call.method === 'DELETE') return ok(makeBrand({ logos: [] }));
      return detail(makeBrand())(call);
    });
    renderAt('/app/brands/b1?tab=logos');

    await userEvent.click(await screen.findByRole('button', { name: 'Remove logo acme.png' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove this logo?' });
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove logo' }));

    expect(await screen.findByText(/No logos yet/)).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'DELETE')?.path).toBe('/brands/b1/logos/l1');
  });
});

/* --------------------------------------------------------------- Trademarks */

describe('Trademarks tab', () => {
  it('adds a trademark with several Nice classes', async () => {
    const brand = makeBrand({ trademarks: [] });
    const calls = stubApi('owner', (call) => {
      if (call.method === 'POST' && call.path === '/brands/b1/trademarks') {
        return ok(makeBrand(), 201);
      }
      return detail(brand)(call);
    });
    renderAt('/app/brands/b1?tab=trademarks');

    await userEvent.click(await screen.findByRole('button', { name: 'Add trademark' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a trademark' });
    await userEvent.type(within(dialog).getByLabelText('Trademark text'), 'ACME');
    await userEvent.selectOptions(within(dialog).getByLabelText('Trademark office'), 'EUIPO');
    await userEvent.type(
      within(dialog).getByLabelText('Registration or application number'),
      '999',
    );
    await userEvent.type(within(dialog).getByLabelText('Nice classes'), '35,9 ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add trademark' }));

    await waitFor(() => expect(calls.some((call) => call.method === 'POST')).toBe(true));
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      mark: 'ACME',
      office: 'EUIPO',
      number: '999',
      classes: [9, 35],
      status: 'registered',
    });
  });

  it('asks for at least one class and for the number before saving', async () => {
    const calls = stubApi('owner', detail(makeBrand({ trademarks: [] })));
    renderAt('/app/brands/b1?tab=trademarks');

    await userEvent.click(await screen.findByRole('button', { name: 'Add trademark' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a trademark' });
    await userEvent.type(within(dialog).getByLabelText('Trademark text'), 'ACME');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add trademark' }));

    expect(
      await within(dialog).findByText('Enter the registration or application number'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Add at least one Nice class')).toBeInTheDocument();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('rejects a class outside 1 to 45 as you type', async () => {
    stubApi('owner', detail(makeBrand({ trademarks: [] })));
    renderAt('/app/brands/b1?tab=trademarks');

    await userEvent.click(await screen.findByRole('button', { name: 'Add trademark' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a trademark' });
    await userEvent.type(within(dialog).getByLabelText('Nice classes'), '46,');

    expect(
      await within(dialog).findByText('Enter a class number from 1 to 45.'),
    ).toBeInTheDocument();
  });

  it('sends only the changed fields when editing', async () => {
    const calls = stubApi('owner', (call) => {
      if (call.method === 'PATCH') return ok(makeBrand());
      return detail(makeBrand())(call);
    });
    renderAt('/app/brands/b1?tab=trademarks');

    await userEvent.click(await screen.findByRole('button', { name: 'Edit ACME' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit trademark' });
    await userEvent.selectOptions(within(dialog).getByLabelText('Status'), 'expired');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save trademark' }));

    await waitFor(() => expect(calls.some((call) => call.method === 'PATCH')).toBe(true));
    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.path).toBe('/brands/b1/trademarks/t1');
    expect(patch?.body).toEqual({ status: 'expired' });
  });
});

/* ---------------------------------------------------------------- Monitoring */

describe('Monitoring tab', () => {
  it('says plainly that nothing is scanned yet, and saves the settings', async () => {
    const calls = stubApi('owner', (call) => {
      if (call.method === 'PUT') {
        return ok(
          makeBrand({
            monitoring: {
              domains: true,
              apps: true,
              trademarks: false,
              sensitivity: 'high',
              emailAlerts: false,
              updatedAt: NOW,
            },
          }),
        );
      }
      return detail(makeBrand())(call);
    });
    renderAt('/app/brands/b1?tab=monitoring');

    expect(
      await screen.findByText(
        'Saved settings are used when monitoring starts in Phase 5 — nothing is scanned yet.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: /Copycat apps/ }));
    await userEvent.click(screen.getByRole('radio', { name: /High/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save monitoring settings' }));

    expect(await screen.findByText('Monitoring settings saved.')).toBeInTheDocument();
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
      domains: true,
      apps: true,
      trademarks: false,
      sensitivity: 'high',
      emailAlerts: false,
    });
  });
});

/* -------------------------------------------------------------------- Rules */

describe('previewDomain', () => {
  it('mirrors how the API tidies a domain', () => {
    expect(previewDomain('https://www.Example-Shop.com/x?y=1')).toBe('example-shop.com');
    expect(previewDomain('  Example.COM  ')).toBe('example.com');
    expect(previewDomain('http://shop.example.co.uk:8080/a')).toBe('shop.example.co.uk');
    expect(previewDomain('münchen.de')).toBe('xn--mnchen-3ya.de');
  });

  it('returns null for things that are not domains', () => {
    for (const bad of ['', 'localhost', 'nope', 'a b.com', 'example.c', '-bad-.com', 'http://']) {
      expect(previewDomain(bad), bad).toBeNull();
    }
  });
});

describe('checkLogoFile', () => {
  it('accepts PNG, JPEG and WebP up to 1 MB', () => {
    expect(checkLogoFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(checkLogoFile({ type: 'image/jpeg', size: 1_048_576 })).toBeNull();
    expect(checkLogoFile({ type: 'image/webp', size: 5 })).toBeNull();
  });

  it('refuses everything else with the API wording', () => {
    expect(checkLogoFile({ type: 'image/svg+xml', size: 10 })).toBe(LOGO_ERROR);
    expect(checkLogoFile({ type: 'image/gif', size: 10 })).toBe(LOGO_ERROR);
    expect(checkLogoFile({ type: '', size: 10 })).toBe(LOGO_ERROR);
    expect(checkLogoFile({ type: 'image/png', size: 1_048_577 })).toBe(LOGO_ERROR);
    expect(checkLogoFile({ type: 'image/png', size: 0 })).toBe(LOGO_ERROR);
  });
});

describe('parseNiceClass', () => {
  it('takes whole numbers from 1 to 45 once each', () => {
    expect(parseNiceClass(' 9 ', [])).toEqual({ value: '9' });
    expect(parseNiceClass('45', ['9'])).toEqual({ value: '45' });
    for (const bad of ['0', '46', 'x', '1.5', '-3', '']) {
      expect(parseNiceClass(bad, []), bad).toHaveProperty('error');
    }
    expect(parseNiceClass('9', ['9'])).toHaveProperty('error');
  });
});
