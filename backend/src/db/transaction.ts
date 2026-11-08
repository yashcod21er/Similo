import mongoose, { type ClientSession, type Types } from 'mongoose';

/** An open database transaction. Repository writes that must succeed or fail together take one. */
export type Tx = ClientSession;

/** Runs `work` inside a transaction. Fakes in tests simply call `work(undefined)`. */
export type RunInTransaction = <T>(work: (tx: Tx | undefined) => Promise<T>) => Promise<T>;

/**
 * MongoDB transaction (Atlas clusters are replica sets, which support them).
 * `withTransaction` commits on success, aborts on error and retries on
 * transient errors such as a primary failover.
 */
export const runInMongoTransaction: RunInTransaction = async <T>(
  work: (tx: Tx | undefined) => Promise<T>,
): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    let result: { value: T } | undefined;
    await session.withTransaction(async () => {
      result = { value: await work(session) };
    });
    if (!result) throw new Error('Transaction finished without a result');
    return result.value;
  } finally {
    await session.endSession();
  }
};

/** Converts an ObjectId (or anything with toString) to its string form for records. */
export function toId(value: Types.ObjectId | string): string {
  return value.toString();
}

/** True when a write failed because a unique index already holds this value. */
export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000
  );
}
