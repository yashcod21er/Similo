import type { Logger } from '../../lib/logger.js';
import { isReservedDomain } from './discovery-source.js';
import type { DomainDiscoverySource } from './discovery-source.js';
import type { BrandRepository } from '../brands/brand.repository.js';
import { normalizeDomain } from '../brands/domain-name.js';
import type { FindingRegistration, FindingRepository } from '../findings/finding.repository.js';
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
}

export interface MonitoringService {
  scanBrand(job: ScanBrandJob): Promise<ScanBrandResult>;
}

const MAX_FINDINGS_PER_SCAN = 15;

export function createMonitoringService({
  brands,
  findings,
  discovery,
  rdap,
  logger,
  now = () => new Date(),
}: {
  brands: BrandRepository;
  findings: FindingRepository;
  discovery: DomainDiscoverySource;
  rdap: RdapClient;
  logger: Logger;
  now?: () => Date;
}): MonitoringService {
  return {
    async scanBrand({ organizationId, brandId }) {
      const brand = await brands.findById(organizationId, brandId);
      if (!brand || brand.status !== 'active' || !brand.monitoring.domains) {
        return { brandId, source: 'skipped', candidates: 0, findings: 0 };
      }

      const candidates = await discovery.discover(brand);
      const threshold = thresholdForSensitivity(brand.monitoring.sensitivity);
      let written = 0;
      const seen = new Set<string>();

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

        await findings.upsert(organizationId, {
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
        written += 1;
        if (written >= MAX_FINDINGS_PER_SCAN) break;
      }

      return {
        brandId: brand.id,
        source: candidates[0]?.source ?? 'none',
        candidates: candidates.length,
        findings: written,
      };
    },
  };
}
