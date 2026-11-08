import mongoose from 'mongoose';
import type { Logger } from '../lib/logger.js';

interface ConnectOptions {
  uri: string;
  dbName: string;
  logger: Logger;
}

/**
 * Opens the single, shared MongoDB connection used by every Mongoose model.
 * Mongoose keeps an internal connection pool, so we connect once at startup
 * rather than per request.
 */
export async function connectToDatabase({ uri, dbName, logger }: ConnectOptions): Promise<void> {
  // Reject query filters on fields that aren't in the schema (avoids silent typos).
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info({ dbName }, 'MongoDB connected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10_000 });
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}

/** True when the shared connection is open and can accept writes. */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

/** Round-trips a `ping` command to the server. Throws if not connected. */
export async function pingDatabase(): Promise<void> {
  const { db, readyState } = mongoose.connection;
  if (readyState !== mongoose.ConnectionStates.connected || !db) {
    throw new Error('MongoDB is not connected');
  }
  await db.admin().ping();
}
