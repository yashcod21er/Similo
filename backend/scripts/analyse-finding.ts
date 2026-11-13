/**
 * Runs the Phase 6 analysis pipeline for one finding right now, without Redis
 * or the worker (for local demos): safe page capture, AI analysis, and the
 * result saved on the finding exactly as the worker would save it.
 *
 *   npm run analysis:run --workspace @similo/backend -- <findingId>
 *
 * Needs MONGODB_URI in backend/.env, the AI service running with the same
 * AI_SERVICE_TOKEN, and (on Windows without Playwright's Chromium)
 * CAPTURE_BROWSER_CHANNEL=msedge.
 */
import type { Types } from 'mongoose';
import { createAiServiceClient } from '../src/clients/ai-service.client.js';
import { loadDotEnvFile, parseEnv } from '../src/config/env.js';
import { ensureIndexes } from '../src/db/indexes.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/db/mongo.js';
import { toId } from '../src/db/transaction.js';
import { createLogger } from '../src/lib/logger.js';
import { createAnalysisService } from '../src/modules/analysis/analysis.service.js';
import {
  mongoBrandLogoRepository,
  mongoBrandRepository,
} from '../src/modules/brands/brand.repository.js';
import { mongoFindingCaptureRepository } from '../src/modules/capture/finding-capture.repository.js';
import { createPlaywrightCapturer } from '../src/modules/capture/playwright-capturer.js';
import { FindingModel } from '../src/modules/findings/finding.model.js';
import { mongoFindingRepository } from '../src/modules/findings/finding.repository.js';

function findingIdArgument(): string {
  const id = process.argv.slice(2).find((arg) => !arg.startsWith('-'));
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw new Error('Usage: npm run analysis:run --workspace @similo/backend -- <findingId>');
  }
  return id;
}

async function main(): Promise<void> {
  loadDotEnvFile();
  const env = parseEnv(process.env);
  if (env.NODE_ENV === 'production') {
    throw new Error('analysis:run is a development tool and refuses to run in production.');
  }
  if (!env.MONGODB_URI) throw new Error('Set MONGODB_URI in backend/.env first.');
  const findingId = findingIdArgument();

  const logger = createLogger({ ...env, LOG_LEVEL: 'warn' });
  await connectToDatabase({ uri: env.MONGODB_URI, dbName: env.MONGODB_DB_NAME, logger });
  try {
    await ensureIndexes();
    // A local operator tool: look up which organisation owns the finding, then
    // run the normal tenant-scoped pipeline for that organisation.
    const owner = await FindingModel.findById(findingId, { organizationId: 1 }).lean<{
      organizationId: Types.ObjectId;
    }>();
    if (!owner) throw new Error(`No finding ${findingId}.`);
    const organizationId = toId(owner.organizationId);

    const analysis = createAnalysisService({
      findings: mongoFindingRepository,
      brands: mongoBrandRepository,
      logos: mongoBrandLogoRepository,
      captures: mongoFindingCaptureRepository,
      capturer: env.CAPTURE_ENABLED
        ? createPlaywrightCapturer({ browserChannel: env.CAPTURE_BROWSER_CHANNEL, logger })
        : null,
      ai: createAiServiceClient({
        baseUrl: env.AI_SERVICE_URL,
        timeoutMs: env.AI_SERVICE_TIMEOUT_MS,
        token: env.AI_SERVICE_TOKEN,
        analysisTimeoutMs: env.AI_ANALYSIS_TIMEOUT_MS,
      }),
      logger,
    });

    console.log(`Analysing finding ${findingId}...`);
    const started = Date.now();
    const result = await analysis.analyseFinding({ organizationId, findingId });
    if (!result) throw new Error(`No finding ${findingId}.`);

    console.log(`\nStatus:  ${result.status} (${Math.round((Date.now() - started) / 1000)} s)`);
    console.log(`Capture: ${result.capture?.status ?? 'none'} ${result.capture?.finalUrl ?? ''}`);
    if (result.score !== null) console.log(`Score:   ${result.score} (${result.level})`);
    for (const signal of result.signals) {
      console.log(`  ${signal.points}/${signal.maxPoints}  ${signal.label}: ${signal.detail}`);
    }
    if (result.unavailable.length > 0) {
      console.log(`Not computed: ${result.unavailable.join(', ')}`);
    }
    if (result.error) console.log(`Note:    ${result.error}`);
  } finally {
    await disconnectFromDatabase();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
