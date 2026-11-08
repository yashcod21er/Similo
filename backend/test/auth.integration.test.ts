import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadDotEnvFile } from '../src/config/env.js';
import { ensureIndexes } from '../src/db/indexes.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/db/mongo.js';
import { runInMongoTransaction } from '../src/db/transaction.js';
import { mongoAuditRepository } from '../src/modules/audit/audit.repository.js';
import { createAuthSystem } from '../src/modules/auth/auth.system.js';
import {
  InviteModel,
  MembershipModel,
  OrganizationModel,
} from '../src/modules/organizations/organization.model.js';
import {
  mongoInviteRepository,
  mongoMembershipRepository,
  mongoOrganizationRepository,
} from '../src/modules/organizations/organization.repository.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { mongoSessionRepository } from '../src/modules/sessions/session.repository.js';
import { UserModel } from '../src/modules/users/user.model.js';
import { mongoUserRepository } from '../src/modules/users/user.repository.js';
import { buildTestApp, healthyChecks, RELAXED_RATE_LIMITS, silentLogger, TEST_JWT_SECRET } from './helpers.js';

/**
 * Auth against real MongoDB Atlas, in a throwaway database that is deleted
 * afterwards. Skipped automatically when MONGODB_URI is not configured.
 */
loadDotEnvFile();
const uri = process.env.MONGODB_URI?.trim();
const dbName = `similo_test_${Date.now().toString(36)}`;

type IndexInfo = { key: Record<string, number>; unique?: boolean; expireAfterSeconds?: number };

describe.skipIf(!uri)('auth on MongoDB Atlas (integration)', () => {
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

  it('creates the unique, tenant and auto-expiry indexes', async () => {
    const indexes = async (model: { collection: { indexes(): Promise<unknown[]> } }) =>
      (await model.collection.indexes()) as IndexInfo[];

    expect(await indexes(UserModel)).toContainEqual(
      expect.objectContaining({ key: { email: 1 }, unique: true }),
    );
    expect(await indexes(MembershipModel)).toContainEqual(
      expect.objectContaining({ key: { organizationId: 1, userId: 1 }, unique: true }),
    );
    expect(await indexes(SessionModel)).toContainEqual(
      expect.objectContaining({ key: { expiresAt: 1 }, expireAfterSeconds: 0 }),
    );
    expect(await indexes(InviteModel)).toContainEqual(
      expect.objectContaining({ key: { expiresAt: 1 }, expireAfterSeconds: 0 }),
    );
  });

  it('signs up in one transaction, signs in, and enforces one account per email', async () => {
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
    const app = buildTestApp(healthyChecks, { auth });
    const account = {
      name: 'Integration Tester',
      email: 'tester@integration.example',
      password: 'correct horse battery staple',
      organizationName: 'Integration Org',
    };

    const agent = request.agent(app);
    expect((await agent.post('/api/v1/auth/sign-up').send(account)).status).toBe(201);
    expect((await agent.get('/api/v1/auth/me')).body.data.role).toBe('owner');

    const duplicate = await request(app).post('/api/v1/auth/sign-up').send(account);
    expect(duplicate.status).toBe(409);

    const signIn = await request(app)
      .post('/api/v1/auth/sign-in')
      .send({ email: account.email, password: account.password });
    expect(signIn.status).toBe(200);

    expect(await UserModel.countDocuments()).toBe(1);
    expect(await OrganizationModel.countDocuments()).toBe(1);
    expect(await MembershipModel.countDocuments({ role: 'owner' })).toBe(1);
  }, 60_000);

  it('rolls everything back when one step of a transaction fails', async () => {
    await expect(
      runInMongoTransaction(async (tx) => {
        await mongoUserRepository.create(
          { email: 'rollback@integration.example', name: 'Rollback', passwordHash: 'x' },
          tx,
        );
        throw new Error('simulated failure after the first write');
      }),
    ).rejects.toThrow('simulated failure');
    expect(await mongoUserRepository.findByEmail('rollback@integration.example')).toBeNull();
  }, 60_000);
});
