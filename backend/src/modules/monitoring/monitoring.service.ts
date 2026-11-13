import type { Logger } from '../../lib/logger.js';
import { isReservedDomain } from './discovery-source.js';
import type { DomainDiscoverySource } from './discovery-source.js';
import type { BrandRepository } from '../brands/brand.repository.js';
import { normalizeDomain } from '../brands/domain-name.js';
import type {
  FindingRecord,
  FindingRegistration,
  FindingRepository,
} from '../findings/finding.repository.js';
import type { RdapClient } from './rdap.client.js';
import { assessDomainSimilarity, isOfficialDomain, thresholdForSensitivity } from './similarity.js';

export interface ScanBrandJob {
  organizationId: string;
  brandId: string;
  requestedBy?: string;
}

export interface ScanBrandResult {
  brandId: string;
  source: string;
  candidates: number;
  findings: number;
  /** Phase 6: findings to queue for AI analysis (new, or not analysed for 7 days). */
  toAnalyse: string[];
}

export interface MonitoringService {
  scanBrand(job: ScanBrandJob): Promise<ScanBrandResult>;
}

const MAX_FINDINGS_PER_SCAN = 15;
/** A finding is analysed again when its last analysis is older than this. */
export const REANALYSE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** True for new findings and ones whose analysis is missing or more than 7 days old. */
export function needsAnalysis(finding: FindingRecord, at: Date): boolean {
  if (finding.status === 'dismissed') return false;
  const analysis = finding.analysis;
  if (!analysis) return true;
  if (analysis.status === 'pending') return false;
  if (!analysis.analysedAt) return true;
  return at.getTime() - analysis.analysedAt.getTime() > REANALYSE_AFTER_MS;
}

export function createMonitoringService({
  brands,
  findings,
  discovery,
  rdap,
  logger,
  maxAnalysesPerScan = 20,
  now = () => new Date(),
}: {
  brands: BrandRepository;
  findings: FindingRepository;
  discovery: DomainDiscoverySource;
  rdap: RdapClient;
  logger: Logger;
  /** ANALYSIS_MAX_PER_SCAN: cap on findings queued for analysis by one scan. */
  maxAnalysesPerScan?: number;
  now?: () => Date;
}): MonitoringService {
  return {
    async scanBrand({ organizationId, brandId }) {
      const brand = await brands.findById(organizationId, brandId);
      if (!brand || brand.status !== 'active' || !brand.monitoring.domains) {
        return { brandId, source: 'skipped', candidates: 0, findings: 0, toAnalyse: [] };
      }

      const candidates = await discovery.discover(brand);
      const threshold = thresholdForSensitivity(brand.monitoring.sensitivity);
      let written = 0;
      const seen = new Set<string>();
      const toAnalyse: string[] = [];

      for (const candidate of candidates) {
        const domain = normalizeDomain(candidate.domain);
        if (
          !domain ||
          seen.has(domain) ||
          (candidate.source !== 'fixture' && isReservedDomain(domain)) ||
          isOfficialDomain(brand, domain)
        ) {
          continue;
        }
        seen.add(domain);
        const assessment = assessDomainSimilarity(brand, domain);
        if (!assessment || assessment.score < threshold) continue;

        let registration: FindingRegistration = {
          registeredAt: null,
          registrar: null,
          nameservers: [] as string[],
          checkedAt: null,
        };
        if (candidate.source !== 'fixture') {
          try {
            const data = await rdap.lookup(domain);
            if (data) registration = data;
          } catch (err) {
            // Discovery is still useful when a registry is slow or has a temporary outage.
            logger.warn({ err, domain }, 'RDAP enrichment failed');
          }
        }

        const saved = await findings.upsert(organizationId, {
          organizationId,
          brandId: brand.id,
          brandName: brand.name,
          domain,
          source: candidate.source,
          sourceReferences: candidate.references,
          score: assessment.score,
          matchedTerm: assessment.matchedTerm,
          reasons: assessment.reasons,
          registration,
          seenAt: now(),
        });
        if (toAnalyse.length < maxAnalysesPerScan && needsAnalysis(saved, now())) {
          toAnalyse.push(saved.id);
        }
        written += 1;
        if (written >= MAX_FINDINGS_PER_SCAN) break;
      }

      return {
        brandId: brand.id,
        source: candidates[0]?.source ?? 'none',
        candidates: candidates.length,
        findings: written,
        toAnalyse,
      };
    },
  };
}
