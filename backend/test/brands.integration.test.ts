import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadDotEnvFile } from '../src/config/env.js';
import { ensureIndexes } from '../src/db/indexes.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/db/mongo.js';
import { isDuplicateKeyError, runInMongoTransaction } from '../src/db/transaction.js';
import { mongoAuditRepository } from '../src/modules/audit/audit.repository.js';
import { createAuthSystem } from '../src/modules/auth/auth.system.js';
import { BrandLogoModel, BrandModel } from '../src/modules/brands/brand.model.js';
import {
  mongoBrandLogoRepository,
  mongoBrandRepository,
} from '../src/modules/brands/brand.repository.js';
import { createBrandService } from '../src/modules/brands/brand.service.js';
import {
  mongoInviteRepository,
  mongoMembershipRepository,
  mongoOrganizationRepository,
} from '../src/modules/organizations/organization.repository.js';
import { mongoSessionRepository } from '../src/modules/sessions/session.repository.js';
import { mongoUserRepository } from '../src/modules/users/user.repository.js';
import {
  buildTestApp,
  healthyChecks,
  RELAXED_RATE_LIMITS,
  silentLogger,
  TEST_JWT_SECRET,
} from './helpers.js';

/**
 * Brands against real MongoDB Atlas, in a throwaway database that is deleted
 * afterwards. Skipped automatically when MONGODB_URI is not configured.
 */
loadDotEnvFile();
const uri = process.env.MONGODB_URI?.trim();
const dbName = `similo_test_brands_${Date.now().toString(36)}`;

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

type IndexInfo = { key: Record<string, number>; unique?: boolean };

function binary(res: request.Response, done: (err: Error | null, body: Buffer) => void) {
  // At runtime superagent hands parsers the raw Node response stream.
  const stream = res as unknown as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(chunk));
  stream.on('end', () => done(null, Buffer.concat(chunks)));
}

describe.skipIf(!uri)('brands on MongoDB Atlas (integration)', () => {
  beforeAll(async () => {
    await connectToDatabase({ uri: uri as string, dbName, logger: silentLogger });
    await ensureIndexes();
  }, 60_000);

  afterAll(async () => {
    const db = mongoose.connection.db;
    if (db) {
      for (const { name } of await db.listCollections().toArray()) {
        await db.dropCollection(name).catch(() => undefined);
      }
    }
    await disconnectFromDatabase();
  }, 60_000);

  function buildApp() {
    const auth = createAuthSystem({
      repositories: {
        users: mongoUserRepository,
        organizations: mongoOrganizationRepository,
        memberships: mongoMembershipRepository,
        invites: mongoInviteRepository,
        sessions: mongoSessionRepository,
        audit: mongoAuditRepository,
      },
      runInTransaction: runInMongoTransaction,
      logger: silentLogger,
      appUrl: 'http://localhost:5173',
      cookieSecure: false,
      jwtSecret: TEST_JWT_SECRET,
      rateLimits: RELAXED_RATE_LIMITS,
    });
    const brandService = createBrandService({
      brands: mongoBrandRepository,
      logos: mongoBrandLogoRepository,
      audit: auth.auditService,
      runInTransaction: runInMongoTransaction,
      now: () => new Date(),
    });
    return buildTestApp(healthyChecks, { auth, brandService });
  }

  it('creates the brands and brand_logos collections with tenant-first indexes', async () => {
    expect(BrandModel.collection.collectionName).toBe('brands');
    expect(BrandLogoModel.collection.collectionName).toBe('brand_logos');
    const brandIndexes = (await BrandModel.collection.indexes()) as IndexInfo[];
    expect(brandIndexes).toContainEqual(
      expect.objectContaining({ key: { organizationId: 1, nameLower: 1 }, unique: true }),
    );
    const logoIndexes = (await BrandLogoModel.collection.indexes()) as IndexInfo[];
    expect(logoIndexes).toContainEqual(
      expect.objectContaining({ key: { organizationId: 1, brandId: 1 } }),
    );
  });

  it('enforces unique names per organisation, ignoring case, in the database itself', async () => {
    const organizationId = new mongoose.Types.ObjectId().toHexString();
    const otherOrganizationId = new mongoose.Types.ObjectId().toHexString();
    const createdBy = new mongoose.Types.ObjectId().toHexString();
    const base = { description: '', keywords: [], createdBy };

    await mongoBrandRepository.create({ ...base, organizationId, name: 'Acme Coffee' });
    const error = await mongoBrandRepository
      .create({ ...base, organizationId, name: 'ACME COFFEE' })
      .then(() => null)
      .catch((err: unknown) => err);
    expect(isDuplicateKeyError(error)).toBe(true);

    // The same name in another organisation is fine.
    await expect(
      mongoBrandRepository.create({
        ...base,
        organizationId: otherOrganizationId,
        name: 'Acme Coffee',
      }),
    ).resolves.toMatchObject({ name: 'Acme Coffee' });

    // A stale revision never overwrites a newer change.
    const brand = await mongoBrandRepository.findByName(organizationId, 'acme coffee');
    expect(brand).not.toBeNull();
    const first = await mongoBrandRepository.update(organizationId, brand!.id, brand!.revision, {
      description: 'first',
    });
    expect(first?.revision).toBe(brand!.revision + 1);
    const stale = await mongoBrandRepository.update(organizationId, brand!.id, brand!.revision, {
      description: 'stale',
    });
    expect(stale).toBeNull();
    // Another organisation can't update it even with the right revision.
    expect(
      await mongoBrandRepository.update(otherOrganizationId, brand!.id, first!.revision, {
        description: 'foreign',
      }),
    ).toBeNull();
  }, 60_000);

  it('stores a logo, serves the same bytes back, and deletes it with its brand', async () => {
    const agent = request.agent(buildApp());
    await agent
      .post('/api/v1/auth/sign-up')
      .send({
        name: 'Brand Tester',
        email: 'brands@integration.example',
        password: 'correct horse battery staple',
        organizationName: 'Brand Integration Org',
      })
      .expect(201);

    const created = await agent.post('/api/v1/brands').send({ name: 'Round Trip' }).expect(201);
    const brandId = created.body.data.id as string;
    await agent.post('/api/v1/brands').send({ name: 'round TRIP' }).expect(409);
    await agent
      .post(`/api/v1/brands/${brandId}/domains`)
      .send({ domain: 'https://www.Bücher.de/x' })
      .expect(201);

    const uploaded = await agent
      .post(`/api/v1/brands/${brandId}/logos`)
      .attach('logo', PNG, 'round-trip.png')
      .expect(201);
    const logo = uploaded.body.data.logos[0];

    const stored = await BrandLogoModel.findById(logo.id).lean();
    expect(stored?.organizationId).toBeInstanceOf(mongoose.Types.ObjectId);
    expect(stored?.brandId.toString()).toBe(brandId);
    expect(stored?.contentType).toBe('image/png');

    const image = await agent.get(logo.url).buffer(true).parse(binary).expect(200);
    expect(Buffer.compare(image.body as Buffer, PNG)).toBe(0);
    expect(image.headers['content-type']).toBe('image/png');

    const detail = await agent.get(`/api/v1/brands/${brandId}`).expect(200);
    expect(detail.body.data.domains[0].domain).toBe('xn--bcher-kva.de');

    await agent.delete(`/api/v1/brands/${brandId}`).expect(200);
    expect(await BrandModel.countDocuments({ _id: brandId })).toBe(0);
    expect(await BrandLogoModel.countDocuments({ brandId })).toBe(0);
  }, 60_000);

  it('never goes over 50 brands, even when several are created at the same moment', async () => {
    const organizationId = new mongoose.Types.ObjectId().toHexString();
    const userId = new mongoose.Types.ObjectId().toHexString();
    const service = createBrandService({
      brands: mongoBrandRepository,
      logos: mongoBrandLogoRepository,
      audit: createAuthSystem({
        repositories: {
          users: mongoUserRepository,
          organizations: mongoOrganizationRepository,
          memberships: mongoMembershipRepository,
          invites: mongoInviteRepository,
          sessions: mongoSessionRepository,
          audit: mongoAuditRepository,
        },
        runInTransaction: runInMongoTransaction,
        logger: silentLogger,
        appUrl: 'http://localhost:5173',
        cookieSecure: false,
        jwtSecret: TEST_JWT_SECRET,
      }).auditService,
      runInTransaction: runInMongoTransaction,
      now: () => new Date(),
    });
    const auth = {
      sessionId: new mongoose.Types.ObjectId().toHexString(),
      user: { id: userId, name: 'Limit Tester', email: 'limit@e2e.similo.test' },
      organizationId,
      role: 'owner' as const,
      ip: '127.0.0.1',
      userAgent: 'vitest',
    };

    // 47 brands exist; 6 more are requested at once. Exactly 3 may succeed.
    await BrandModel.insertMany(
      Array.from({ length: 47 }, (_, i) => ({
        organizationId,
        name: `Existing ${i}`,
        nameLower: `existing ${i}`,
        createdBy: userId,
      })),
    );
    const results = await Promise.allSettled(
      Array.from({ length: 6 }, (_, i) => service.create(auth, { name: `Racing ${i}` })),
    );

    const created = results.filter((result) => result.status === 'fulfilled');
    const refused = results.filter((result) => result.status === 'rejected');
    expect(created).toHaveLength(3);
    for (const result of refused) {
      expect((result as PromiseRejectedResult).reason).toMatchObject({
        statusCode: 409,
        message: 'Your organisation can have up to 50 brands.',
      });
    }
    expect(await BrandModel.countDocuments({ organizationId })).toBe(50);
  }, 120_000);
});
