import { afterAll, describe, expect, it } from 'vitest';
import { loadDotEnvFile } from '../src/config/env.js';
import { connectToDatabase, disconnectFromDatabase, pingDatabase } from '../src/db/mongo.js';
import { silentLogger } from './helpers.js';

/**
 * Real connection test against MongoDB Atlas.
 * Skipped automatically unless MONGODB_URI is set (in apps/api/.env or the shell),
 * so the rest of the suite runs without credentials.
 */
loadDotEnvFile();
const uri = process.env.MONGODB_URI?.trim();

describe.skipIf(!uri)('MongoDB connection (integration)', () => {
  afterAll(async () => {
    await disconnectFromDatabase();
  });

  it('connects and answers a ping', async () => {
    await connectToDatabase({
      uri: uri as string,
      dbName: process.env.MONGODB_DB_NAME || 'similo',
      logger: silentLogger,
    });
    await expect(pingDatabase()).resolves.toBeUndefined();
  }, 20_000);
});
