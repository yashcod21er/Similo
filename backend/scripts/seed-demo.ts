/**
 * Creates (or refreshes) a clearly labelled SAMPLE organisation with one user
 * per role, so roles and permissions can be tried quickly. Development only.
 *
 *   npm run seed:demo             create / refresh, and print a new password
 *   npm run seed:demo -- --remove delete the sample organisation and its users
 *
 * Emails use the reserved `.test` domain, so they can never belong to a real person.
 */
import { loadDotEnvFile, parseEnv } from '../src/config/env.js';
import { ensureIndexes } from '../src/db/indexes.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/db/mongo.js';
import { createLogger } from '../src/lib/logger.js';
import { hashPassword } from '../src/lib/passwords.js';
import { generateToken } from '../src/lib/tokens.js';
import { AuditEventModel } from '../src/modules/audit/audit.model.js';
import {
  InviteModel,
  MembershipModel,
  OrganizationModel,
} from '../src/modules/organizations/organization.model.js';
import { ROLE_LABELS, type Role } from '../src/modules/organizations/roles.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { UserModel } from '../src/modules/users/user.model.js';

const ORGANISATION_NAME = 'Demo Co (sample data)';
const DEMO_USERS: { role: Role; name: string; email: string }[] = [
  { role: 'owner', name: 'Olivia Owner', email: 'owner@demo.similo.test' },
  { role: 'admin', name: 'Arjun Admin', email: 'admin@demo.similo.test' },
  { role: 'analyst', name: 'Ana Analyst', email: 'analyst@demo.similo.test' },
  { role: 'legal', name: 'Leela Legal', email: 'legal@demo.similo.test' },
  { role: 'viewer', name: 'Victor Viewer', email: 'viewer@demo.similo.test' },
];

async function removeDemo(): Promise<void> {
  const users = await UserModel.find({ email: { $in: DEMO_USERS.map((u) => u.email) } }, '_id');
  const userIds = users.map((user) => user._id);
  const organizations = await OrganizationModel.find({ name: ORGANISATION_NAME }, '_id');
  const organizationIds = organizations.map((organization) => organization._id);

  await Promise.all([
    MembershipModel.deleteMany({ organizationId: { $in: organizationIds } }),
    InviteModel.deleteMany({ organizationId: { $in: organizationIds } }),
    AuditEventModel.deleteMany({ organizationId: { $in: organizationIds } }),
    SessionModel.deleteMany({ userId: { $in: userIds } }),
  ]);
  await OrganizationModel.deleteMany({ _id: { $in: organizationIds } });
  await UserModel.deleteMany({ _id: { $in: userIds } });
  console.log(`Removed the sample organisation and ${userIds.length} sample users.`);
}

async function seedDemo(): Promise<void> {
  // A fresh random password each run: never a known default that could leak.
  const password = `demo-${generateToken(12)}`;
  const passwordHash = await hashPassword(password);

  const users = [];
  for (const demo of DEMO_USERS) {
    const user = await UserModel.findOneAndUpdate(
      { email: demo.email },
      {
        $set: { name: demo.name, passwordHash, failedSignIns: 0, lockedUntil: null },
        $setOnInsert: { email: demo.email },
      },
      { upsert: true, new: true },
    );
    users.push({ ...demo, id: user._id });
  }

  const owner = users[0];
  if (!owner) throw new Error('No owner in DEMO_USERS');
  const organization =
    (await OrganizationModel.findOne({ name: ORGANISATION_NAME })) ??
    (await OrganizationModel.create({ name: ORGANISATION_NAME, createdBy: owner.id }));

  for (const user of users) {
    await MembershipModel.updateOne(
      { organizationId: organization._id, userId: user.id },
      { $set: { role: user.role }, $setOnInsert: { invitedBy: owner.id } },
      { upsert: true },
    );
  }
  // Old sessions used the previous password: sign them out.
  await SessionModel.deleteMany({ userId: { $in: users.map((user) => user.id) } });

  console.log(`\nSample organisation "${ORGANISATION_NAME}" is ready.\n`);
  console.table(users.map((user) => ({ role: ROLE_LABELS[user.role], email: user.email })));
  console.log(`Password for all five (shown once, new every run): ${password}`);
  console.log('Sign in at http://localhost:5173/sign-in\n');
}

async function main(): Promise<void> {
  loadDotEnvFile();
  const env = parseEnv(process.env);
  if (env.NODE_ENV === 'production') {
    throw new Error('seed:demo creates sample accounts and refuses to run in production.');
  }
  if (!env.MONGODB_URI) throw new Error('Set MONGODB_URI in backend/.env first.');

  const logger = createLogger({ ...env, LOG_LEVEL: 'warn' });
  await connectToDatabase({ uri: env.MONGODB_URI, dbName: env.MONGODB_DB_NAME, logger });
  try {
    await ensureIndexes();
    if (process.argv.includes('--remove')) await removeDemo();
    else await seedDemo();
  } finally {
    await disconnectFromDatabase();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
