/**
 * Resource library content.
 *
 * Real, educational articles written for the site (not placeholder copy).
 * Kept as typed data so the list page, filters and article page share one source.
 * When a CMS is added later, only this module needs to change.
 */

export type ResourceCategory =
  | 'Domain intelligence'
  | 'Trademark watch'
  | 'App ecosystem'
  | 'Investigations'
  | 'AI & methodology';

export type ResourceType = 'Guide' | 'Explainer' | 'Playbook';

export interface ResourceSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

/** A 3:2 photo (1600 x 1067) in frontend/public/images/pages; `src` has no size suffix. */
export interface ResourceCover {
  src: string;
  alt: string;
}

export interface Resource {
  slug: string;
  cover: ResourceCover;
  title: string;
  summary: string;
  category: ResourceCategory;
  type: ResourceType;
  readMinutes: number;
  tags: string[];
  sections: ResourceSection[];
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  'Domain intelligence',
  'Trademark watch',
  'App ecosystem',
  'Investigations',
  'AI & methodology',
];

export const RESOURCES: Resource[] = [
  {
    slug: 'lookalike-domains-explained',
    cover: {
      src: '/images/pages/cover-lookalike',
      alt: 'A woman working on a laptop at a desk in a bright office.',
    },
    title: 'Lookalike domains, explained: typosquatting, homoglyphs and combosquatting',
    summary:
      'The main ways attackers imitate your domain, how each one tricks people, and what signals separate a harmless registration from one being prepared for abuse.',
    category: 'Domain intelligence',
    type: 'Guide',
    readMinutes: 7,
    tags: ['typosquatting', 'homoglyphs', 'phishing'],
    sections: [
      {
        heading: 'Why lookalike domains work',
        paragraphs: [
          'People recognise words by their overall shape, not letter by letter. A domain that is one character away from yours — or that uses a character which looks identical — is easy to miss in an email link, a browser address bar or a search result.',
          'Because the attacker owns the lookalike domain, it can carry valid TLS certificates, send email that passes basic checks and host a convincing copy of your website. Nothing about it touches your own infrastructure, so perimeter security never sees it.',
        ],
      },
      {
        heading: 'The common patterns',
        paragraphs: ['Most lookalike domains fall into a handful of families:'],
        bullets: [
          'Typosquatting — missing, doubled, swapped or adjacent-key characters (acmme.com, acem.com).',
          'Homoglyphs — characters that look alike, such as "rn" for "m", "1" for "l", or Cyrillic "а" for Latin "a" in internationalised domain names (shown as xn-- punycode).',
          'Combosquatting — your brand plus a word that adds urgency or trust: acme-login.com, acme-support.net, secure-acme.co.',
          'TLD swaps — the exact brand on a different ending: acme.co, acme.app, acme.in.',
          'Subdomain tricks — acme.com.account-verify.net, where the real registered domain is at the end.',
        ],
      },
      {
        heading: 'Signals that a domain is being prepared for abuse',
        paragraphs: [
          'Registration alone is a weak signal: many lookalikes are parked by speculators or registered defensively. Risk rises sharply when infrastructure is added.',
        ],
        bullets: [
          'A very recent registration date.',
          'Mail exchange (MX) records, which allow the domain to send and receive email.',
          'A newly issued TLS certificate, visible in Certificate Transparency logs.',
          'A page that copies your branding or contains a password form.',
          'A form that submits data to a different host.',
        ],
      },
      {
        heading: 'What to do with a finding',
        paragraphs: [
          'Record evidence first: a screenshot, the page source, registration data and the time you captured them. Then decide on a response — monitoring, a registrar or hosting abuse report, a UDRP complaint, or simply blocking the domain on your own mail and web gateways.',
          'A similarity score helps you decide what to look at first. It is not a legal conclusion; that judgement belongs to your legal team.',
        ],
      },
    ],
  },
  {
    slug: 'rdap-for-brand-protection',
    cover: { src: '/images/pages/cover-registration', alt: 'Hands typing on a laptop keyboard.' },
    title: 'What RDAP tells you about a suspicious domain — and what it does not',
    summary:
      'RDAP has replaced WHOIS as the standard way to look up domain registration data. Here is what the fields mean for an investigation, and its important limits.',
    category: 'Domain intelligence',
    type: 'Explainer',
    readMinutes: 5,
    tags: ['RDAP', 'WHOIS', 'registration data'],
    sections: [
      {
        heading: 'From WHOIS to RDAP',
        paragraphs: [
          'The Registration Data Access Protocol (RDAP) returns domain registration data as structured JSON over HTTPS. ICANN made it the definitive source for generic top-level domains, replacing the older free-text WHOIS service.',
          'Structured responses mean dates, registrars and nameservers can be read reliably by software instead of being scraped from inconsistent text.',
        ],
      },
      {
        heading: 'Fields that matter in an investigation',
        paragraphs: [],
        bullets: [
          'Registration (creation) date — newly registered lookalikes deserve more attention.',
          'Registrar — tells you where to send an abuse report.',
          'Nameservers — shared nameservers can link domains run by the same actor.',
          'Status codes — show whether a domain is locked, on hold or pending deletion.',
          'Abuse contact — the registrar’s published channel for complaints.',
        ],
      },
      {
        heading: 'The limits',
        paragraphs: [
          'Registrant names and contact details are usually redacted for privacy, so RDAP rarely tells you who is behind a domain.',
          'RDAP is a lookup tool: you must already know the domain name. It cannot discover newly registered domains — that requires sources such as zone files or Certificate Transparency logs. Registries also apply rate limits, so lookups should be queued and cached rather than run on every page view.',
        ],
      },
    ],
  },
  {
    slug: 'trademark-watch-basics',
    cover: {
      src: '/images/pages/cover-trademark',
      alt: 'An open lined notebook with a pen and pencils on a wooden desk.',
    },
    title: 'Trademark watch basics: journals, Nice classes and opposition windows',
    summary:
      'How newly filed trademarks are published, why the Nice classification matters, and why the opposition deadline is the date that drives everything.',
    category: 'Trademark watch',
    type: 'Guide',
    readMinutes: 6,
    tags: ['trademarks', 'Nice classification', 'opposition'],
    sections: [
      {
        heading: 'Publication is your window',
        paragraphs: [
          'Most trademark offices publish accepted applications in an official journal or gazette before registration. Publication opens a fixed period in which anyone with earlier rights can oppose the application.',
          'Periods differ by office. In India, an opposition must be filed within four months of the application being advertised in the Trade Marks Journal. The USPTO allows 30 days from publication, extendable on request, and the EUIPO allows three months. Missing the window usually means a far more expensive cancellation action later.',
        ],
      },
      {
        heading: 'Why Nice classes matter',
        paragraphs: [
          'The Nice Classification sorts goods and services into 45 classes — 34 for goods and 11 for services. Two similar marks in unrelated classes can often coexist; the same marks in overlapping classes are far more likely to conflict.',
          'Class overlap is therefore one of the strongest signals for prioritising watch results, alongside how similar the marks look and sound.',
        ],
      },
      {
        heading: 'What a good watch result contains',
        paragraphs: [],
        bullets: [
          'The published mark, applicant and application number.',
          'Classes and the goods or services description.',
          'Publication date and the calculated opposition deadline.',
          'Why it matched: spelling, sound, class overlap or logo similarity.',
          'A link to the exact journal page, so the extraction can be verified.',
        ],
      },
    ],
  },
  {
    slug: 'rogue-mobile-apps',
    cover: {
      src: '/images/pages/cover-apps',
      alt: 'A person holding a smartphone at a café table, with an iced coffee beside it.',
    },
    title: 'Spotting rogue mobile apps that impersonate your brand',
    summary:
      'A practical playbook for finding lookalike apps, telling them apart from legitimate partners, and preparing a marketplace complaint.',
    category: 'App ecosystem',
    type: 'Playbook',
    readMinutes: 5,
    tags: ['mobile apps', 'impersonation', 'marketplaces'],
    sections: [
      {
        heading: 'How impersonating apps look',
        paragraphs: [
          'Rogue apps rarely copy everything. A typical one reuses a near-identical icon, adds a word like "Pro" or "Wallet" to your name, and lists a publisher whose name resembles yours.',
        ],
        bullets: [
          'Icon: same shape and colours, slightly altered to avoid exact-match detection.',
          'Name: your brand plus a generic product word.',
          'Publisher: a name similar to yours, or an unrelated developer.',
          'Description: repeated use of your brand name and product terms.',
        ],
      },
      {
        heading: 'Start with an allow-list',
        paragraphs: [
          'Before searching, list your own publisher accounts, official apps and approved partners. Most false alarms come from legitimate apps that mention your brand, and an allow-list removes them up front.',
        ],
      },
      {
        heading: 'Know your data sources',
        paragraphs: [
          'Apple provides a public Search API for its store. Google Play has no official public search API — the Play Developer API only covers apps you publish — so systematic discovery there usually needs a licensed data provider. Be clear internally about which stores are actually monitored.',
        ],
      },
      {
        heading: 'Preparing a complaint',
        paragraphs: [
          'Capture the listing page, icon, screenshots and publisher details with timestamps. Marketplaces have their own intellectual property complaint forms; a concise complaint that points to your registered marks and the specific copied elements is processed fastest.',
        ],
      },
    ],
  },
  {
    slug: 'evidence-chain-of-custody',
    cover: {
      src: '/images/pages/cover-evidence',
      alt: 'Two colleagues reviewing charts on a laptop and on paper at a desk.',
    },
    title: 'Preserving digital evidence: hashes, timestamps and chain of custody',
    summary:
      'Web content changes or disappears quickly. These practices make sure what you captured can be shown to be complete and unaltered later.',
    category: 'Investigations',
    type: 'Playbook',
    readMinutes: 6,
    tags: ['evidence', 'SHA-256', 'chain of custody'],
    sections: [
      {
        heading: 'Capture early, capture fully',
        paragraphs: [
          'Infringing pages are often taken down or changed as soon as their operators notice attention. Capture as soon as a finding looks credible: a full-page screenshot, the HTML source, the URL including any redirects, and the registration data.',
        ],
      },
      {
        heading: 'Hash everything',
        paragraphs: [
          'A cryptographic hash such as SHA-256 is a fingerprint of a file. Changing even one byte produces a completely different hash. Recording the hash at capture time lets you prove later that the file you present is exactly the file you collected.',
        ],
      },
      {
        heading: 'Record who, what, when and where',
        paragraphs: ['For every item, store:'],
        bullets: [
          'The source URL and the time of capture (in UTC).',
          'Who or what captured it.',
          'The SHA-256 hash.',
          'Every later access, export or transfer — the chain of custody.',
        ],
      },
      {
        heading: 'Keep originals separate from working copies',
        paragraphs: [
          'Annotate and crop copies, never originals. Store originals in write-once or access-controlled storage, and re-verify their hashes before using them in a complaint or proceeding. Requirements for admissibility vary by jurisdiction, so involve counsel early for anything likely to reach a court.',
        ],
      },
    ],
  },
  {
    slug: 'explainable-risk-scores',
    cover: {
      src: '/images/pages/cover-methodology',
      alt: 'A man working on a laptop at a desk in a colourful office.',
    },
    title: 'Why explainable risk scores matter more than accuracy claims',
    summary:
      'A single "98% accurate" number tells an analyst nothing about a specific finding. Reason codes and separate signals do.',
    category: 'AI & methodology',
    type: 'Explainer',
    readMinutes: 4,
    tags: ['AI', 'risk scoring', 'explainability'],
    sections: [
      {
        heading: 'The problem with a single number',
        paragraphs: [
          'A headline accuracy figure depends entirely on the dataset it was measured on. It does not tell an analyst why this particular domain or app was flagged, or how much to trust this particular result.',
        ],
      },
      {
        heading: 'Keep signals separate',
        paragraphs: [
          'Fuzzy string similarity, semantic similarity, phonetic matches and image similarity measure different things. Blending them into one opaque value hides useful information. Storing each as a named signal lets a reviewer see, for example, that a match is purely phonetic.',
        ],
      },
      {
        heading: 'Reason codes make scores reviewable',
        paragraphs: [
          'A score of 91 with the reasons HOMOGLYPH, NEW_REGISTRATION and CREDENTIAL_FORM is something an analyst can check in seconds. It also lets teams tune weights openly and audit decisions later.',
          'Most importantly, a risk score prioritises work. It is not a finding of infringement — that decision stays with people.',
        ],
      },
    ],
  },
];

export function findResource(slug: string): Resource | undefined {
  return RESOURCES.find((resource) => resource.slug === slug);
}
