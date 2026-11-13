import {
  AiServiceError,
  type AiAnalysePage,
  type AiAnalyseRequest,
  type AiAnalyseResponse,
  type AiServiceClient,
} from '../../clients/ai-service.client.js';
import type { Logger } from '../../lib/logger.js';
import type { BrandLogoRepository, BrandRecord, BrandRepository } from '../brands/brand.repository.js';
import type { CapturedPage, PageCapturer } from '../capture/capture.types.js';
import type { FindingCaptureRepository } from '../capture/finding-capture.repository.js';
import type { FindingRecord, FindingRepository } from '../findings/finding.repository.js';
import { pendingAnalysis, type AnalysisCapture, type FindingAnalysis } from './analysis.types.js';

/**
 * The Phase 6 analysis pipeline for one finding:
 *
 *   load finding + brand (scoped by organisation) → mark "pending"
 *   → capture the suspect page safely (unless capture is turned off)
 *   → ask the AI service for an explainable score (page: null when not captured,
 *     so the name and registration-age signals still count)
 *   → store the result on the finding.
 *
 * Failures never put raw errors or stack traces into the stored document: the
 * `error` field is always one of the plain sentences below.
 */

export interface AnalyseFindingJob {
  organizationId: string;
  findingId: string;
  requestedBy?: string;
}

export interface AnalysisService {
  /** Returns the stored analysis, or null when the finding does not exist. */
  analyseFinding(job: AnalyseFindingJob): Promise<FindingAnalysis | null>;
}

export const ANALYSIS_MESSAGES = {
  notConfigured: 'The AI service is not set up yet, so this finding has no AI score.',
  unreachable: 'The AI service could not be reached. Try again later.',
  invalidResponse: 'The AI service sent a result Similo could not read, so no score was saved.',
  rejected: 'The AI service could not analyse this finding.',
  brandMissing: 'The brand for this finding no longer exists.',
  unexpected: 'Something went wrong while analysing this finding. Try again later.',
} as const;

/** Keeps the JSON request under the AI service's 16 MB limit with room to spare. */
export const MAX_REQUEST_BYTES = 14 * 1024 * 1024;
const MAX_BRAND_LOGOS = 5;

interface CaptureStep {
  capture: AnalysisCapture;
  page: CapturedPage | null;
}

export function createAnalysisService({
  findings,
  brands,
  logos,
  captures,
  capturer,
  ai,
  logger,
  now = () => new Date(),
}: {
  findings: FindingRepository;
  brands: BrandRepository;
  logos: BrandLogoRepository;
  captures: FindingCaptureRepository;
  /** null when CAPTURE_ENABLED=false: analysis then runs without a page. */
  capturer: PageCapturer | null;
  ai: AiServiceClient;
  logger: Logger;
  now?: () => Date;
}): AnalysisService {
  function notScored(
    status: 'failed' | 'unavailable',
    capture: AnalysisCapture | null,
    error: string,
  ): FindingAnalysis {
    return {
      status,
      score: null,
      level: null,
      signals: [],
      reasons: [],
      unavailable: [],
      capture,
      logoMatch: null,
      modelVersion: null,
      analysedAt: now(),
      error,
    };
  }

  function completed(response: AiAnalyseResponse, capture: AnalysisCapture): FindingAnalysis {
    return {
      status: 'complete',
      score: response.score,
      level: response.level,
      signals: response.signals.map((signal) => ({ ...signal })),
      reasons: [...response.reasons],
      unavailable: [...response.unavailable],
      capture,
      logoMatch: response.logoMatch ? { ...response.logoMatch } : null,
      modelVersion: response.modelVersion,
      analysedAt: now(),
      error: null,
    };
  }

  async function captureSite(
    organizationId: string,
    finding: FindingRecord,
  ): Promise<CaptureStep> {
    const previous = finding.analysis?.capture ?? null;
    // When a new capture does not succeed, an earlier screenshot is kept as evidence.
    const keepEarlier = (status: AnalysisCapture['status']): AnalysisCapture =>
      previous?.hasScreenshot
        ? { ...previous, status }
        : { status, finalUrl: null, title: null, hasScreenshot: false, capturedAt: null };

    if (!capturer) return { capture: keepEarlier('skipped'), page: null };

    let result = await capturer.capture(`https://${finding.domain}/`);
    if (result.status === 'unreachable') {
      const plain = await capturer.capture(`http://${finding.domain}/`);
      if (plain.status !== 'unreachable') result = plain;
    }
    if (result.status !== 'captured') {
      logger.info(
        { organizationId, findingId: finding.id, status: result.status, reason: result.reason },
        'Suspect page was not captured',
      );
      return { capture: keepEarlier(result.status), page: null };
    }

    let saved = false;
    try {
      await captures.save(organizationId, {
        findingId: finding.id,
        brandId: finding.brandId,
        capturedAt: result.capturedAt,
        finalUrl: result.page.finalUrl,
        title: result.page.title,
        screenshot: result.page.screenshot,
      });
      saved = true;
    } catch (err) {
      logger.warn({ err, organizationId, findingId: finding.id }, 'Could not store screenshot');
    }
    return {
      capture: {
        status: 'captured',
        finalUrl: result.page.finalUrl,
        title: result.page.title,
        hasScreenshot: saved,
        capturedAt: result.capturedAt,
      },
      page: result.page,
    };
  }

  async function brandLogos(organizationId: string, brand: BrandRecord) {
    const loaded: { id: string; imageBase64: string }[] = [];
    for (const logo of brand.logos.slice(0, MAX_BRAND_LOGOS)) {
      const file = await logos.find(organizationId, brand.id, logo.id);
      if (file) loaded.push({ id: logo.id, imageBase64: file.data.toString('base64') });
    }
    return loaded;
  }

  async function run(finding: FindingRecord): Promise<FindingAnalysis> {
    const { organizationId } = finding;
    const brand = await brands.findById(organizationId, finding.brandId);
    if (!brand) return notScored('failed', null, ANALYSIS_MESSAGES.brandMissing);

    const { capture, page } = await captureSite(organizationId, finding);
    if (!ai.canAnalyse()) return notScored('unavailable', capture, ANALYSIS_MESSAGES.notConfigured);

    const request = fitRequestSize(
      buildAnalyseRequest(brand, await brandLogos(organizationId, brand), finding, page),
    );
    try {
      return completed(await ai.analyse(request), capture);
    } catch (err) {
      if (!(err instanceof AiServiceError)) throw err;
      logger.warn(
        { err, kind: err.kind, organizationId, findingId: finding.id },
        'AI analysis call failed',
      );
      if (err.kind === 'unavailable') {
        return notScored('unavailable', capture, ANALYSIS_MESSAGES.unreachable);
      }
      return notScored(
        'failed',
        capture,
        err.kind === 'invalid_response'
          ? ANALYSIS_MESSAGES.invalidResponse
          : ANALYSIS_MESSAGES.rejected,
      );
    }
  }

  return {
    async analyseFinding({ organizationId, findingId }) {
      const finding = await findings.findById(organizationId, findingId);
      if (!finding) return null;
      await findings.setAnalysis(organizationId, findingId, pendingAnalysis(finding.analysis));

      let analysis: FindingAnalysis;
      try {
        analysis = await run(finding);
      } catch (err) {
        logger.error({ err, organizationId, findingId }, 'Finding analysis failed');
        analysis = notScored(
          'failed',
          finding.analysis?.capture ?? null,
          ANALYSIS_MESSAGES.unexpected,
        );
      }
      await findings.setAnalysis(organizationId, findingId, analysis);
      logger.info(
        { organizationId, findingId, status: analysis.status, score: analysis.score },
        'Finding analysis finished',
      );
      return analysis;
    },
  };
}

function toAiPage(page: CapturedPage): AiAnalysePage {
  return {
    finalUrl: page.finalUrl,
    title: page.title,
    text: page.text,
    screenshotBase64: page.screenshot.toString('base64'),
    images: page.images.map((image) => ({
      kind: image.kind,
      imageBase64: image.data.toString('base64'),
    })),
    forms: { ...page.forms },
    certificateIssuedAt: page.certificateIssuedAt,
  };
}

export function buildAnalyseRequest(
  brand: BrandRecord,
  logos: { id: string; imageBase64: string }[],
  finding: FindingRecord,
  page: CapturedPage | null,
): AiAnalyseRequest {
  return {
    brand: {
      name: brand.name,
      description: brand.description,
      keywords: [...brand.keywords],
      officialDomains: brand.domains.map((entry) => entry.domain),
      logos,
    },
    candidate: {
      domain: finding.domain,
      domainScore: finding.score,
      registeredAt: finding.registration.registeredAt?.toISOString() ?? null,
      page: page ? toAiPage(page) : null,
    },
  };
}

/** Drops page images, then extra brand logos, until the JSON fits MAX_REQUEST_BYTES. */
export function fitRequestSize(
  request: AiAnalyseRequest,
  maxBytes = MAX_REQUEST_BYTES,
): AiAnalyseRequest {
  const size = () => Buffer.byteLength(JSON.stringify(request));
  const page = request.candidate.page;
  while (page && page.images.length > 0 && size() > maxBytes) page.images.pop();
  while (request.brand.logos.length > 1 && size() > maxBytes) request.brand.logos.pop();
  return request;
}
