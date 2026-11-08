import { toId, type Tx } from '../../db/transaction.js';
import { UserModel, type UserDocument } from './user.model.js';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  failedSignIns: number;
  lockedUntil: Date | null;
  lastSignInAt: Date | null;
  createdAt: Date;
}

export interface NewUser {
  email: string;
  name: string;
  passwordHash: string;
}

/** Storage boundary for users. Services depend on this interface; tests use an in-memory fake. */
export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByIds(ids: string[]): Promise<UserRecord[]>;
  create(user: NewUser, tx?: Tx): Promise<UserRecord>;
  /** Adds one to the failed-attempt counter and returns the new count. */
  incrementFailedSignIns(id: string): Promise<number>;
  /** Locks sign-in until `until` and resets the counter for the next window. */
  lock(id: string, until: Date): Promise<void>;
  recordSuccessfulSignIn(id: string, at: Date): Promise<void>;
  updatePassword(id: string, passwordHash: string, at: Date): Promise<void>;
}

function toRecord(doc: UserDocument): UserRecord {
  return {
    id: toId(doc._id),
    email: doc.email,
    name: doc.name,
    passwordHash: doc.passwordHash,
    failedSignIns: doc.failedSignIns ?? 0,
    lockedUntil: doc.lockedUntil ?? null,
    lastSignInAt: doc.lastSignInAt ?? null,
    createdAt: doc.createdAt,
  };
}

export const mongoUserRepository: UserRepository = {
  async findById(id) {
    const doc = await UserModel.findById(id).lean<UserDocument>();
    return doc ? toRecord(doc) : null;
  },
  async findByEmail(email) {
    const doc = await UserModel.findOne({ email }).lean<UserDocument>();
    return doc ? toRecord(doc) : null;
  },
  async findByIds(ids) {
    if (ids.length === 0) return [];
    const docs = await UserModel.find({ _id: { $in: ids } }).lean<UserDocument[]>();
    return docs.map(toRecord);
  },
  async create(user, tx) {
    const doc = await new UserModel(user).save({ session: tx ?? null });
    return toRecord(doc.toObject() as UserDocument);
  },
  async incrementFailedSignIns(id) {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { $inc: { failedSignIns: 1 } },
      { new: true, projection: { failedSignIns: 1 } },
    ).lean<{ failedSignIns: number }>();
    return doc?.failedSignIns ?? 0;
  },
  async lock(id, until) {
    await UserModel.updateOne({ _id: id }, { $set: { lockedUntil: until, failedSignIns: 0 } });
  },
  async recordSuccessfulSignIn(id, at) {
    await UserModel.updateOne(
      { _id: id },
      { $set: { failedSignIns: 0, lockedUntil: null, lastSignInAt: at } },
    );
  },
  async updatePassword(id, passwordHash, at) {
    await UserModel.updateOne({ _id: id }, { $set: { passwordHash, passwordChangedAt: at } });
  },
};
