import {
  Binary,
  Database,
  FileScan,
  Gauge,
  HardDrive,
  Image as ImageIcon,
  Layers,
  type LucideIcon,
  MessageSquareText,
  Monitor,
  Network,
  Server,
  Workflow,
} from 'lucide-react';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { CtaBand, Section, SplitHero } from '@/components/marketing/sections';
import { Eyebrow, SectionHeading } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { FaqBlock } from './platform-faq';
import { ScoreBreakdown } from './technology-visuals';

/* ----------------------------------------------------------------- Data */

interface Check {
  id: string;
  icon: LucideIcon;
  name: string;
  title: string;
  plain: string;
  details: string[];
  tools: string;
}

const CHECKS: Check[] = [
  {
    id: 'names',
    icon: Binary,
    name: 'Names',
    title: 'Catches names that look or sound like yours.',
    plain:
      '“acrne-login.com” doesn’t look fake at a glance. The name check notices that “rn” reads as “m” and that an official-sounding word was added. It also catches names that sound the same when read aloud.',
    details: [
      'Edit distance and token matching for typos, swaps and added words',
      'Homoglyph and punycode normalisation for look-alike characters',
      'Phonetic keys for names that sound alike',
      'Sentence embeddings for names with a similar meaning',
    ],
    tools: 'RapidFuzz, Sentence Transformers',
  },
  {
    id: 'images',
    icon: ImageIcon,
    name: 'Logos and icons',
    title: 'Spots copied logos and app icons.',
    plain:
      'Copycats often shift a colour or crop a logo slightly so it isn’t an exact copy. Images are first put on an equal footing (same size, crop and colours) and then compared for near-copies and for overall style.',
    details: [
      'Resize, crop and colour normalisation before comparing',
      'Perceptual hashes to find near-identical copies',
      'Image embeddings to find logos with a similar style',
    ],
    tools: 'OpenCV, perceptual hashing, pretrained image embeddings',
  },
  {
    id: 'documents',
    icon: FileScan,
    name: 'Documents',
    title: 'Reads trademark journals for you.',
    plain:
      'Trademark offices publish new applications in long journals, often as scanned PDFs. Similo reads them, pulls out each mark and its classes, and keeps the page number so anyone can check the original.',
    details: [
      'Embedded PDF text is extracted directly when it exists',
      'OCR reads scanned pages, with a confidence level for each block',
      'Every record keeps its source file and page reference',
    ],
    tools: 'PyMuPDF, PaddleOCR or Tesseract',
  },
  {
    id: 'registration',
    icon: Network,
    name: 'Registration data',
    title: 'Finds out when a site was set up.',
    plain:
      'A look-alike website registered two days ago, set up to send email and given a padlock certificate is very likely being prepared for phishing. These public records tell that story, and some details, like a hidden owner, are normal on their own.',
    details: [
      'RDAP, the modern replacement for WHOIS, for registration dates and registrars',
      'DNS records, such as MX, show whether a domain can send and receive email',
      'Certificate Transparency logs show when a padlock certificate was issued',
    ],
    tools: 'RDAP, DNS, Certificate Transparency',
  },
  {
    id: 'score',
    icon: Gauge,
    name: 'Risk score',
    title: 'Adds everything up in the open.',
    plain:
      'Each check produces named signals. They are added up with weights you can see and change, giving a priority and a list of reasons. The score decides what your team looks at first, never what is legally true.',
    details: [
      'Configurable weights for every signal',
      'Reason codes stored with every alert',
      'Versioned rules, so old alerts can always be explained',
    ],
    tools: 'Weighted signals, reason codes, versioned rules',
  },
  {
    id: 'assistant',
    icon: MessageSquareText,
    name: 'Assistant',
    title: 'Answers questions with sources.',
    plain:
      'Ask “why was this flagged?” and the assistant answers from your own alerts, evidence and notes, with a numbered source for every claim. If the records don’t say, it tells you so instead of guessing.',
    details: [
      'Your records are split into passages and indexed for search',
      'Retrieval is limited to your organisation and your role',
      'Every answer cites its sources; missing information is stated',
      'The language model provider can be swapped',
    ],
    tools: 'Retrieval-augmented generation, MongoDB Atlas Vector Search',
  },
];

const STACK: { icon: LucideIcon; name: string; job: string; tech: string }[] = [
  {
    icon: Monitor,
    name: 'Web app',
    job: 'What your team uses every day',
    tech: 'React, TypeScript',
  },
  {
    icon: Server,
    name: 'API',
    job: 'Checks permissions and serves data',
    tech: 'Node.js, Express',
  },
  {
    icon: Workflow,
    name: 'Background jobs',
    job: 'Runs long checks without slowing the app',
    tech: 'Redis, BullMQ',
  },
  {
    icon: Layers,
    name: 'AI service',
    job: 'Name, image and document checks',
    tech: 'Python, FastAPI',
  },
  {
    icon: Database,
    name: 'Database and search',
    job: 'Records and the assistant’s search index',
    tech: 'MongoDB Atlas, Vector Search',
  },
  {
    icon: HardDrive,
    name: 'Evidence storage',
    job: 'Screenshots and files, with fingerprints',
    tech: 'S3-compatible storage',
  },
];

const FAQ = [
  {
    question: 'How accurate is it?',
    answer:
      'We don’t publish accuracy figures until they have been measured on real, labelled data. Instead, every alert shows the reasons behind it, so your team can judge each one for themselves.',
  },
  {
    question: 'Which AI tools does it use?',
    answer:
      'Focused, well-known open-source tools, one per job: RapidFuzz for spelling, Sentence Transformers for meaning, OpenCV for images, and PyMuPDF with PaddleOCR or Tesseract for documents. The assistant’s language model provider can be swapped.',
  },
  {
    question: 'What does the assistant do when it doesn’t know?',
    answer:
      'It answers only from your organisation’s records, cites each source, and says plainly when the records don’t contain the answer.',
  },
];

/* ---------------------------------------------------------------- Page */

export function TechnologyPage() {
  return (
    <>
      <SplitHero
        eyebrow="How it works"
        title="AI that shows its working."
        description="Similo uses separate, focused checks for names, images and documents, then adds up what they find in the open. Every alert can be traced back to the evidence behind it."
        secondaryCta={{
          label: 'Why explainability matters',
          to: '/resources/explainable-risk-scores',
        }}
        visual={
          <PhotoFrame
            src="/images/core/analyst-desk"
            alt="A man typing on a laptop at a wooden desk in a bare concrete room"
            width={1600}
            height={1200}
            sizes="(min-width: 1280px) 600px, (min-width: 1024px) 45vw, 100vw"
            priority
          />
        }
      />

      <Section>
        <SectionHeading
          eyebrow="The checks"
          title="Six checks, each with one job."
          description="Each part does one thing and shows its result. The plain explanation comes first, then the technical detail for anyone who wants it."
        />
        <div className="mt-12 border-b border-line">
          {CHECKS.map((check) => (
            <Reveal key={check.id}>
              <article
                id={check.id}
                className="grid scroll-mt-24 grid-cols-1 gap-6 border-t border-line py-10 lg:grid-cols-[1fr_1.7fr] lg:gap-16"
              >
                <div>
                  <p className="flex items-center gap-2 text-[13px] font-medium text-crimson-dark">
                    <check.icon aria-hidden className="size-5" />
                    {check.name}
                  </p>
                  <h3 className="text-title mt-3 max-w-sm font-semibold text-balance">
                    {check.title}
                  </h3>
                </div>
                <div>
                  <p className="leading-relaxed text-pretty text-muted">{check.plain}</p>
                  <ul className="mt-5 space-y-2 border-l-2 border-line pl-4 text-[14.5px] leading-snug">
                    {check.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[13px] text-muted">Built with: {check.tools}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Eyebrow>The score</Eyebrow>
            <h2 className="text-headline mt-3 font-semibold text-balance">
              Every score shows its parts.
            </h2>
            <p className="text-lead mt-4 text-pretty text-muted">
              A high score is never just a number. It is a short list of reasons, each with its
              weight, so your team can see why something was flagged and disagree if they want to.
            </p>
          </Reveal>
          <Reveal delay={0.05} className="min-w-0">
            <ScoreBreakdown />
          </Reveal>
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="lg:order-2">
            <PhotoFrame
              src="/images/core/analyst-report"
              alt="A woman reading a printed report at her desk, with a laptop open beside her"
              width={1600}
              height={1067}
              ratio="aspect-[3/2]"
            />
          </Reveal>
          <Reveal delay={0.05} className="lg:order-1">
            <Eyebrow>People decide</Eyebrow>
            <h2 className="text-headline mt-3 font-semibold text-balance">
              The AI sorts. Your team decides.
            </h2>
            <p className="text-lead mt-4 text-pretty text-muted">
              The AI finds, compares and explains. Whether something infringes your rights is a
              decision for qualified people, and Similo never takes enforcement action on its own.
              Scores support decisions. They are not legal findings.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading
          eyebrow="What it’s built with"
          title="A modular stack, built to grow."
          description="Long checks run in background workers, so the app stays fast while analysis happens. Each part can be scaled on its own."
        />
        <Reveal className="mt-10">
          <ul className="divide-y divide-line border-y border-line">
            {STACK.map((item) => (
              <li
                key={item.name}
                className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[1fr_1.6fr_1fr] sm:items-center sm:gap-8"
              >
                <span className="flex items-center gap-3 font-semibold">
                  <item.icon aria-hidden className="size-5 shrink-0 text-crimson" />
                  {item.name}
                </span>
                <span className="text-muted">{item.job}</span>
                <span className="font-mono text-[13px] text-muted sm:text-right">{item.tech}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section>
        <FaqBlock title="Straight answers about the AI." items={FAQ} />
      </Section>

      <CtaBand
        title="See the reasons behind every alert."
        description="We will walk through a real scoring breakdown and show how your team would review it."
        secondary={{ label: 'The platform', to: '/platform' }}
      />
    </>
  );
}
