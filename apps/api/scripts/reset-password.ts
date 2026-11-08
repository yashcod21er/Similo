/**
 * Sets a new random password for one account and signs it out everywhere.
 * A development stand-in until password reset by email exists.
 *
 *   npm run auth:reset-password -- --email someone@example.com
 */
import { loadDotEnvFile, parseEnv } from '../src/config/env.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/db/mongo.js';
import { createLogger } from '../src/lib/logger.js';
import { hashPassword } from '../src/lib/passwords.js';
import { generateToken } from '../src/lib/tokens.js';
import { SessionModel } from '../src/modules/sessions/session.model.js';
import { UserModel } from '../src/modules/users/user.model.js';

function emailArgument(): string {
  const index = process.argv.indexOf('--email');
  const email = index >= 0 ? process.argv[index + 1] : undefined;
  if (!email) throw new Error('Usage: npm run auth:reset-password -- --email someone@example.com');
  return email.trim().toLowerCase();
}

async function main(): Promise<void> {
  loadDotEnvFile();
  const env = parseEnv(process.env);
  if (env.NODE_ENV === 'production') {
    throw new Error('auth:reset-password is a development tool and refuses to run in production.');
  }
  if (!env.MONGODB_URI) throw new Error('Set MONGODB_URI in apps/api/.env first.');
  const email = emailArgument();

  const logger = createLogger({ ...env, LOG_LEVEL: 'warn' });
  await connectToDatabase({ uri: env.MONGODB_URI, dbName: env.MONGODB_DB_NAME, logger });
  try {
    const password = generateToken(12);
    const user = await UserModel.findOneAndUpdate(
      { email },
      {
        $set: {
          passwordHash: await hashPassword(password),
          passwordChangedAt: new Date(),
          failedSignIns: 0,
          lockedUntil: null,
        },
      },
      { new: true },
    );
    if (!user) throw new Error(`No account found for ${email}.`);
    const { deletedCount } = await SessionModel.deleteMany({ userId: user._id });
    console.log(`\nNew password for ${email}: ${password}`);
    console.log(
      `Signed out of ${deletedCount} session(s). Ask them to change it after signing in.\n`,
    );
  } finally {
    await disconnectFromDatabase();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
