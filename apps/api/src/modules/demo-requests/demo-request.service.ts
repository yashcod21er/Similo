import { AppError, ErrorCode } from '../../lib/errors.js';
import type { Logger } from '../../lib/logger.js';
import type { DemoRequestRepository } from './demo-request.repository.js';
import type { CreateDemoRequestInput } from './demo-request.schemas.js';

export interface DemoRequestService {
  submit(input: CreateDemoRequestInput): Promise<void>;
}

interface Dependencies {
  repository: DemoRequestRepository;
  /** True when MongoDB is connected and writes can succeed. */
  isDatabaseReady: () => boolean;
  logger: Logger;
}

export function createDemoRequestService({
  repository,
  isDatabaseReady,
  logger,
}: Dependencies): DemoRequestService {
  return {
    async submit(input) {
      // Honeypot filled → almost certainly a bot. Respond exactly like a success
      // (so the bot learns nothing) but store nothing.
      if (input.website) {
        logger.info('Demo request discarded by honeypot');
        return;
      }

      // Fail clearly instead of letting Mongoose buffer the write and time out,
      // and never tell the visitor their request was saved when it was not.
      if (!isDatabaseReady()) {
        throw new AppError(
          503,
          ErrorCode.ServiceUnavailable,
          'We could not save your request right now. Please try again later.',
        );
      }

      const { consent: _consent, website: _website, ...data } = input;
      const { id } = await repository.create(data);
      logger.info({ demoRequestId: id }, 'Demo request received');
    },
  };
}
