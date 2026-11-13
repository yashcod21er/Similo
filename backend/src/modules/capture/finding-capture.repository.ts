import { FindingCaptureModel } from './finding-capture.model.js';
import type { Tx } from '../../db/transaction.js';

/*
 * Tenant isolation rule: every method takes the organizationId first and
 * filters by it, so another organisation's finding id finds nothing.
 */

export interface NewFindingCapture {
  findingId: string;
  brandId: string;
  capturedAt: Date;
  finalUrl: string;
  title: string;
  screenshot: Buffer;
}

export interface FindingScreenshot {
  contentType: 'image/jpeg';
  data: Buffer;
  capturedAt: Date;
}

export interface FindingCaptureRepository {
  /** Stores the capture, replacing the finding's previous one. */
  save(organizationId: string, capture: NewFindingCapture): Promise<void>;
  findScreenshot(organizationId: string, findingId: string): Promise<FindingScreenshot | null>;
  deleteByFinding(organizationId: string, findingId: string): Promise<void>;
  /** Removes every capture of a brand's findings; returns how many. */
  deleteByBrand(organizationId: string, brandId: string, tx?: Tx): Promise<number>;
}

export const mongoFindingCaptureRepository: FindingCaptureRepository = {
  async save(organizationId, capture) {
    await FindingCaptureModel.findOneAndReplace(
      { organizationId, findingId: capture.findingId },
      { organizationId, ...capture, contentType: 'image/jpeg' },
      { upsert: true, runValidators: true },
    );
  },
  async findScreenshot(organizationId, findingId) {
    // Not lean: a hydrated document returns `screenshot` as a Node Buffer.
    const doc = await FindingCaptureModel.findOne(
      { organizationId, findingId },
      { screenshot: 1, contentType: 1, capturedAt: 1 },
    );
    if (!doc) return null;
    return {
      contentType: 'image/jpeg',
      data: Buffer.from(doc.screenshot),
      capturedAt: doc.capturedAt,
    };
  },
  async deleteByFinding(organizationId, findingId) {
    await FindingCaptureModel.deleteOne({ organizationId, findingId });
  },
  async deleteByBrand(organizationId, brandId, tx) {
    const result = await FindingCaptureModel.deleteMany(
      { organizationId, brandId },
      tx ? { session: tx } : {},
    );
    return result.deletedCount;
  },
};
