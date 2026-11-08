import type { RunInTransaction } from '../../src/db/transaction.js';
import type {
  AuditEventRecord,
  AuditRepository,
} from '../../src/modules/audit/audit.repository.js';
import type { AuthRepositories } from '../../src/modules/auth/auth.system.js';
import {
  brandNameKey,
  DEFAULT_MONITORING,
  type BrandLogoRepository,
  type BrandRecord,
  type BrandRepository,
  type NewBrandLogo,
} from '../../src/modules/brands/brand.repository.js';
import type {
  InviteRecord,
  InviteRepository,
  MembershipRecord,
  MembershipRepository,
  OrganizationRecord,
  OrganizationRepository,
} from '../../src/modules/organizations/organization.repository.js';
import type {
  SessionRecord,
  SessionRepository,
} from '../../src/modules/sessions/session.repository.js';
import type { UserRecord, UserRepository } from '../../src/modules/users/user.repository.js';

/**
 * In-memory stand-ins for the MongoDB repositories, with the same contracts
 * (including "one account per email"). Each call to createFakeAuthRepositories
 * returns an isolated world, so tests can't affect each other.
 */

let idCounter = 0;
/** 24-hex-character IDs, so they pass the same ObjectId validation as real ones. */
export function newId(): string {
  idCounter += 1;
  return idCounter.toString(16).padStart(24, '0');
}

function duplicateKeyError(): Error {
  return Object.assign(new Error('E11000 duplicate key error'), { code: 11000 });
}

const copy = <T>(value: T): T => structuredClone(value);

/** A clock tests can move forward (session expiry, lockouts, invite expiry). */
export function createClock(start = new Date('2026-11-08T10:00:00Z')) {
  let current = start.getTime();
  return {
    now: () => new Date(current),
    advance: (ms: number) => {
      current += ms;
    },
  };
}

/** Fakes have no real transactions: run the work directly. */
export const fakeTransaction: RunInTransaction = (work) => work(undefined);

export function createFakeAuthRepositories(now: () => Date = () => new Date()) {
  const userStore = new Map<string, UserRecord>();
  const organizationStore = new Map<string, OrganizationRecord>();
  const membershipStore: MembershipRecord[] = [];
  const inviteStore = new Map<string, InviteRecord>();
  const sessionStore = new Map<string, SessionRecord>();
  const auditStore: AuditEventRecord[] = [];

  const mustGetUser = (id: string): UserRecord => {
    const user = userStore.get(id);
    if (!user) throw new Error(`No user ${id}`);
    return user;
  };

  const users: UserRepository = {
    async findById(id) {
      const user = userStore.get(id);
      return user ? copy(user) : null;
    },
    async findByEmail(email) {
      const user = [...userStore.values()].find((row) => row.email === email);
      return user ? copy(user) : null;
    },
    async findByIds(ids) {
      return ids.flatMap((id) => {
        const user = userStore.get(id);
        return user ? [copy(user)] : [];
      });
    },
    async create(data) {
      if ([...userStore.values()].some((row) => row.email === data.email)) {
        throw duplicateKeyError();
      }
      const user: UserRecord = {
        id: newId(),
        ...data,
        failedSignIns: 0,
        lockedUntil: null,
        lastSignInAt: null,
        createdAt: now(),
      };
      userStore.set(user.id, user);
      return copy(user);
    },
    async incrementFailedSignIns(id) {
      const user = mustGetUser(id);
      user.failedSignIns += 1;
      return user.failedSignIns;
    },
    async lock(id, until) {
      const user = mustGetUser(id);
      user.lockedUntil = until;
      user.failedSignIns = 0;
    },
    async recordSuccessfulSignIn(id, at) {
      const user = mustGetUser(id);
      user.failedSignIns = 0;
      user.lockedUntil = null;
      user.lastSignInAt = at;
    },
    async updatePassword(id, passwordHash) {
      mustGetUser(id).passwordHash = passwordHash;
    },
  };

  const organizations: OrganizationRepository = {
    async create(data) {
      const organization: OrganizationRecord = { id: newId(), ...data, createdAt: now() };
      organizationStore.set(organization.id, organization);
      return copy(organization);
    },
    async findById(id) {
      const organization = organizationStore.get(id);
      return organization ? copy(organization) : null;
    },
    async rename(id, name) {
      const organization = organizationStore.get(id);
      if (organization) organization.name = name;
    },
  };

  const memberships: MembershipRepository = {
    async create(data) {
      if (
        membershipStore.some(
          (row) => row.organizationId === data.organizationId && row.userId === data.userId,
        )
      ) {
        throw duplicateKeyError();
      }
      const membership: MembershipRecord = { id: newId(), ...data, createdAt: now() };
      membershipStore.push(membership);
      return copy(membership);
    },
    async find(organizationId, userId) {
      const row = membershipStore.find(
        (item) => item.organizationId === organizationId && item.userId === userId,
      );
      return row ? copy(row) : null;
    },
    async findFirstForUser(userId) {
      const row = membershipStore.find((item) => item.userId === userId);
      return row ? copy(row) : null;
    },
    async listByOrganization(organizationId) {
      return membershipStore.filter((row) => row.organizationId === organizationId).map(copy);
    },
    async countByRole(organizationId, role) {
      return membershipStore.filter(
        (row) => row.organizationId === organizationId && row.role === role,
      ).length;
    },
    async updateRole(organizationId, userId, role) {
      const row = membershipStore.find(
        (item) => item.organizationId === organizationId && item.userId === userId,
      );
      if (row) row.role = role;
    },
    async remove(organizationId, userId) {
      const index = membershipStore.findIndex(
        (item) => item.organizationId === organizationId && item.userId === userId,
      );
      if (index === -1) return false;
      membershipStore.splice(index, 1);
      return true;
    },
  };

  const invites: InviteRepository = {
    async upsert(data) {
      const existing = [...inviteStore.values()].find(
        (row) => row.organizationId === data.organizationId && row.email === data.email,
      );
      const invite: InviteRecord = {
        id: existing?.id ?? newId(),
        createdAt: existing?.createdAt ?? now(),
        ...data,
      };
      inviteStore.set(invite.id, invite);
      return copy(invite);
    },
    async listByOrganization(organizationId) {
      return [...inviteStore.values()]
        .filter((row) => row.organizationId === organizationId)
        .map(copy);
    },
    async findByTokenHash(tokenHash) {
      const invite = [...inviteStore.values()].find((row) => row.tokenHash === tokenHash);
      return invite ? copy(invite) : null;
    },
    async delete(organizationId, id) {
      const invite = inviteStore.get(id);
      if (!invite || invite.organizationId !== organizationId) return false;
      inviteStore.delete(id);
      return true;
    },
  };

  const sessions: SessionRepository = {
    async create(data) {
      const session: SessionRecord = { id: newId(), ...data, createdAt: now() };
      sessionStore.set(session.id, session);
      return copy(session);
    },
    async findByTokenHash(tokenHash) {
      const session = [...sessionStore.values()].find((row) => row.tokenHash === tokenHash);
      return session ? copy(session) : null;
    },
    async touch(id, lastSeenAt, expiresAt) {
      const session = sessionStore.get(id);
      if (session) Object.assign(session, { lastSeenAt, expiresAt });
    },
    async deleteById(id) {
      sessionStore.delete(id);
    },
    async deleteByUser(userId, exceptSessionId) {
      for (const [id, session] of sessionStore) {
        if (session.userId === userId && id !== exceptSessionId) sessionStore.delete(id);
      }
    },
    async deleteByUserInOrganization(userId, organizationId) {
      for (const [id, session] of sessionStore) {
        if (session.userId === userId && session.organizationId === organizationId) {
          sessionStore.delete(id);
        }
      }
    },
  };

  const audit: AuditRepository = {
    async record(event) {
      auditStore.push({
        id: newId(),
        ...event,
        target: event.target ?? null,
        metadata: event.metadata ?? {},
        createdAt: now(),
      });
    },
    async list(organizationId, { before, limit }) {
      return auditStore
        .filter((row) => row.organizationId === organizationId)
        .filter(
          (row) =>
            !before ||
            row.createdAt < before.createdAt ||
            (row.createdAt.getTime() === before.createdAt.getTime() && row.id < before.id),
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
        .slice(0, limit)
        .map(copy);
    },
  };

  const repositories: AuthRepositories = {
    users,
    organizations,
    memberships,
    invites,
    sessions,
    audit,
  };

  return {
    repositories,
    stores: {
      users: userStore,
      organizations: organizationStore,
      memberships: membershipStore,
      invites: inviteStore,
      sessions: sessionStore,
      audit: auditStore,
    },
  };
}

/**
 * In-memory brand and logo repositories with the same contracts as MongoDB:
 * names unique per organisation ignoring case, updates only at the expected
 * revision, and every lookup scoped by organisation.
 */
export function createFakeBrandRepositories(now: () => Date = () => new Date()) {
  const brandStore = new Map<string, BrandRecord>();
  const logoStore = new Map<string, NewBrandLogo>();

  const nameTaken = (organizationId: string, name: string, exceptId?: string) =>
    [...brandStore.values()].some(
      (row) =>
        row.organizationId === organizationId &&
        brandNameKey(row.name) === brandNameKey(name) &&
        row.id !== exceptId,
    );

  const scoped = (organizationId: string, id: string) => {
    const brand = brandStore.get(id);
    return brand && brand.organizationId === organizationId ? brand : undefined;
  };

  const brands: BrandRepository = {
    async create(data) {
      if (nameTaken(data.organizationId, data.name)) throw duplicateKeyError();
      const at = now();
      const brand: BrandRecord = {
        id: newId(),
        ...data,
        status: 'active',
        domains: [],
        trademarks: [],
        logos: [],
        monitoring: { ...DEFAULT_MONITORING },
        revision: 0,
        createdAt: at,
        updatedAt: at,
      };
      brandStore.set(brand.id, brand);
      return copy(brand);
    },
    async listByOrganization(organizationId) {
      return [...brandStore.values()]
        .filter((row) => row.organizationId === organizationId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
        .map(copy);
    },
    async findById(organizationId, id) {
      const brand = scoped(organizationId, id);
      return brand ? copy(brand) : null;
    },
    async findByName(organizationId, name) {
      const brand = [...brandStore.values()].find(
        (row) =>
          row.organizationId === organizationId && brandNameKey(row.name) === brandNameKey(name),
      );
      return brand ? copy(brand) : null;
    },
    async countByOrganization(organizationId) {
      return [...brandStore.values()].filter((row) => row.organizationId === organizationId).length;
    },
    async update(organizationId, id, expectedRevision, changes) {
      const brand = scoped(organizationId, id);
      if (!brand || brand.revision !== expectedRevision) return null;
      if (changes.name !== undefined && nameTaken(organizationId, changes.name, id)) {
        throw duplicateKeyError();
      }
      Object.assign(brand, copy(changes), { revision: brand.revision + 1, updatedAt: now() });
      return copy(brand);
    },
    async delete(organizationId, id) {
      if (!scoped(organizationId, id)) return false;
      brandStore.delete(id);
      return true;
    },
  };

  const findLogo = (organizationId: string, brandId: string, logoId: string) => {
    const logo = logoStore.get(logoId);
    return logo && logo.organizationId === organizationId && logo.brandId === brandId
      ? logo
      : undefined;
  };

  const logos: BrandLogoRepository = {
    async create(data) {
      logoStore.set(data.id, { ...data, data: Buffer.from(data.data) });
    },
    async find(organizationId, brandId, logoId) {
      const logo = findLogo(organizationId, brandId, logoId);
      return logo ? { contentType: logo.contentType, data: Buffer.from(logo.data) } : null;
    },
    async delete(organizationId, brandId, logoId) {
      if (!findLogo(organizationId, brandId, logoId)) return false;
      logoStore.delete(logoId);
      return true;
    },
    async deleteByBrand(organizationId, brandId) {
      let removed = 0;
      for (const [id, logo] of logoStore) {
        if (logo.organizationId === organizationId && logo.brandId === brandId) {
          logoStore.delete(id);
          removed += 1;
        }
      }
      return removed;
    },
  };

  return { brands, logos, stores: { brands: brandStore, brandLogos: logoStore } };
}
