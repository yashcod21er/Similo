/**
 * "The problem in numbers": public, checkable research about phishing, look-alike domains,
 * brand impersonation and domain disputes. Shown by `components/marketing/ResearchProof.tsx`.
 *
 * Rules for this file (see docs/DESIGN-SYSTEM.md, "Proof"):
 * - Every figure is copied from the source named next to it. Never round up, never add.
 * - These are public industry figures, not Similo customer data. The page says so.
 * - When a newer edition of a source appears, update the number, the period and the link
 *   together, and the date in the comment below.
 *
 * Each figure was checked against the source text itself on 2026-11-09:
 * - Interisle: Phishing Landscape 2025 (report PDF, table "Key Results", and executive summary).
 * - APWG: Phishing Activity Trends Report, 2nd Quarter 2026 (PDF, published 28 August 2026).
 * - WIPO: "WIPO ADR Highlights 2025" news page.
 */

export interface ResearchFigure {
  id: string;
  /** The exact number, as written in the source. */
  value: number;
  prefix?: string;
  suffix?: string;
  /** What the number counts, in plain words. */
  label: string;
  /** One plain sentence that helps a non-expert read it. */
  explanation: string;
  /** Who published it. */
  source: string;
  /** The period the number covers, and when it was published. */
  period: string;
  /** The page that states the number. */
  url: string;
}

export const RESEARCH_FIGURES: ResearchFigure[] = [
  {
    id: 'phishing-domains',
    value: 1542922,
    label: 'domain names reported for phishing in one year',
    explanation:
      '38% more than the year before, and the highest count since Interisle began measuring five years ago.',
    source: 'Interisle Consulting Group, Phishing Landscape 2025',
    period: 'May 2024 to April 2025, published September 2025',
    url: 'https://interisle.net/PhishingLandscape2025',
  },
  {
    id: 'registered-on-purpose',
    value: 77,
    suffix: '%',
    label: 'of those domain names were registered on purpose for the attack',
    explanation:
      'Interisle counts a name as maliciously registered when a phisher registered it on purpose to carry out a phishing attack.',
    source: 'Interisle Consulting Group, Phishing Landscape 2025',
    period: 'May 2024 to April 2025, published September 2025',
    url: 'https://interisle.net/PhishingLandscape2025',
  },
  {
    id: 'brands-impersonated',
    value: 941,
    label: 'different brands impersonated in phishing reports in one quarter',
    explanation:
      'Half of them were attacked five times or less: phishers also build pages for lesser-known and regional brands.',
    source: 'APWG, Phishing Activity Trends Report, 2nd Quarter 2026',
    period: 'April to June 2026, published August 2026',
    url: 'https://docs.apwg.org/reports/apwg_trends_report_q2_2026.pdf',
  },
  {
    id: 'domain-disputes',
    value: 6282,
    label: 'domain name disputes filed by trademark owners at WIPO',
    explanation:
      'The most in a single year since the service began, up 1.8% on 2024. Each one is a trademark owner disputing a domain name.',
    source: 'WIPO Arbitration and Mediation Center, ADR Highlights 2025',
    period: 'Calendar year 2025',
    url: 'https://www.wipo.int/amc/en/news/2026/news_0001.html',
  },
];

/** Shown under the figures. Keep it plain and always visible. */
export const RESEARCH_NOTE = 'Figures from public industry research; not Similo customer data.';

/** When the figures were last checked against their sources. */
export const RESEARCH_CHECKED = '9 November 2026';
