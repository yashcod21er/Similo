import { toId, type Tx } from '../../db/transaction.js';
import {
  InviteModel,
  MembershipModel,
  OrganizationModel,
  type InviteDocument,
  type MembershipDocument,
  type OrganizationDocument,
} from './organization.model.js';
import type { Role } from './roles.js';

/*
 * Tenant isolation rule: every membership and invite method takes the
 * organizationId as its first argument, so an unscoped query cannot be written
 * by accident. The only user-scoped lookup is `findFirstForUser`, used at
 * sign-in to decide which organisation a session opens.
 */

/* ------------------------------------------------------------ Organization */

export interface OrganizationRecord {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
}

export interface OrganizationRepository {
  create(data: { name: string; createdBy: string }, tx?: Tx): Promise<OrganizationRecord>;
  findById(id: string): Promise<OrganizationRecord | null>;
  rename(id: string, name: string): Promise<void>;
}

function toOrganization(doc: OrganizationDocument): OrganizationRecord {
  return {
    id: toId(doc._id),
    name: doc.name,
    createdBy: toId(doc.createdBy),
    createdAt: doc.createdAt,
  };
}

export const mongoOrganizationRepository: OrganizationRepository = {
  async create(data, tx) {
    const doc = await new OrganizationModel(data).save({ session: tx ?? null });
    return toOrganization(doc.toObject() as OrganizationDocument);
  },
  async findById(id) {
    const doc = await OrganizationModel.findById(id).lean<OrganizationDocument>();
    return doc ? toOrganization(doc) : null;
  },
  async rename(id, name) {
    await OrganizationModel.updateOne({ _id: id }, { $set: { name } });
  },
};

/* -------------------------------------------------------------- Membership */

export interface MembershipRecord {
  id: string;
  organizationId: string;
  userId: string;
  role: Role;
  invitedBy: string | null;
  createdAt: Date;
}

export interface NewMembership {
  organizationId: string;
  userId: string;
  role: Role;
  invitedBy: string | null;
}

export interface MembershipRepository {
  create(data: NewMembership, tx?: Tx): Promise<MembershipRecord>;
  find(organizationId: string, userId: string): Promise<MembershipRecord | null>;
  findFirstForUser(userId: string): Promise<MembershipRecord | null>;
  listByOrganization(organizationId: string): Promise<MembershipRecord[]>;
  countByRole(organizationId: string, role: Role): Promise<number>;
  updateRole(organizationId: string, userId: string, role: Role): Promise<void>;
  /** Returns false when there was no such membership. */
  remove(organizationId: string, userId: string): Promise<boolean>;
}

function toMembership(doc: MembershipDocument): MembershipRecord {
  return {
    id: toId(doc._id),
    organizationId: toId(doc.organizationId),
    userId: toId(doc.userId),
    role: doc.role,
    invitedBy: doc.invitedBy ? toId(doc.invitedBy) : null,
    createdAt: doc.createdAt,
  };
}

export const mongoMembershipRepository: MembershipRepository = {
  async create(data, tx) {
    const doc = await new MembershipModel(data).save({ session: tx ?? null });
    return toMembership(doc.toObject() as MembershipDocument);
  },
  async find(organizationId, userId) {
    const doc = await MembershipModel.findOne({
      organizationId,
      userId,
    }).lean<MembershipDocument>();
    return doc ? toMembership(doc) : null;
  },
  async findFirstForUser(userId) {
    const doc = await MembershipModel.findOne({ userId })
      .sort({ createdAt: 1 })
      .lean<MembershipDocument>();
    return doc ? toMembership(doc) : null;
  },
  async listByOrganization(organizationId) {
    const docs = await MembershipModel.find({ organizationId })
      .sort({ createdAt: 1 })
      .lean<MembershipDocument[]>();
    return docs.map(toMembership);
  },
  async countByRole(organizationId, role) {
    return MembershipModel.countDocuments({ organizationId, role });
  },
  async updateRole(organizationId, userId, role) {
    await MembershipModel.updateOne({ organizationId, userId }, { $set: { role } });
  },
  async remove(organizationId, userId) {
    const result = await MembershipModel.deleteOne({ organizationId, userId });
    return result.deletedCount === 1;
  },
};

/* ------------------------------------------------------------------ Invite */

export interface InviteRecord {
  id: string;
  organizationId: string;
  email: string;
  role: Role;
  tokenHash: string;
  invitedBy: string;
  expiresAt: Date;
  createdAt: Date;
}

export type NewInvite = Omit<InviteRecord, 'id' | 'createdAt'>;

export interface InviteRepository {
  /** Creates the invite, replacing any earlier one for the same email in this organisation. */
  upsert(data: NewInvite): Promise<InviteRecord>;
  listByOrganization(organizationId: string): Promise<InviteRecord[]>;
  findByTokenHash(tokenHash: string): Promise<InviteRecord | null>;
  /** Returns false when there was no such invite in this organisation. */
  delete(organizationId: string, id: string, tx?: Tx): Promise<boolean>;
}

function toInvite(doc: InviteDocument): InviteRecord {
  return {
    id: toId(doc._id),
    organizationId: toId(doc.organizationId),
    email: doc.email,
    role: doc.role,
    tokenHash: doc.tokenHash,
    invitedBy: toId(doc.invitedBy),
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
  };
}

export const mongoInviteRepository: InviteRepository = {
  async upsert(data) {
    const doc = await InviteModel.findOneAndUpdate(
      { organizationId: data.organizationId, email: data.email },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean<InviteDocument>();
    if (!doc) throw new Error('Invite upsert returned no document');
    return toInvite(doc);
  },
  async listByOrganization(organizationId) {
    const docs = await InviteModel.find({ organizationId })
      .sort({ createdAt: -1 })
      .lean<InviteDocument[]>();
    return docs.map(toInvite);
  },
  async findByTokenHash(tokenHash) {
    const doc = await InviteModel.findOne({ tokenHash }).lean<InviteDocument>();
    return doc ? toInvite(doc) : null;
  },
  async delete(organizationId, id, tx) {
    const result = await InviteModel.deleteOne(
      { _id: id, organizationId },
      tx ? { session: tx } : {},
    );
    return result.deletedCount === 1;
  },
};
