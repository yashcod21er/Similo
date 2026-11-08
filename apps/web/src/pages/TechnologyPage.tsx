import {
  ArrowDown,
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
  Scale,
  Server,
  Workflow,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { CtaBand, Section, SplitHero } from '@/components/marketing/sections';
import { Eyebrow, SectionHeading } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { AssistantPreview } from '@/components/visuals/assistant';
import { cn } from '@/lib/cn';
import { FaqBlock } from './platform-faq';
import {
  DocumentCheckVisual,
  ImageCheckVisual,
  NameCheckVisual,
  RegistrationVisual,
  ScoreBreakdown,
  WeightsVisual,
} from './technology-visuals';

/* ----------------------------------------------------------------- Data */

interface Check {
  id: string;
  icon: LucideIcon;
  name: string;
  title: ReactNode;
  plain: string;
  summary: string;
  details: string[];
  tools: string;
  visual: ReactNode;
}

const CHECKS: Check[] = [
  {
    id: 'names',
    icon: Binary,
    name: 'Names',
    title: (
      <>
        Catches names that <em>look</em> or sound like yours.
      </>
    ),
    summary: 'Spots swapped letters, lookalike characters, added words and sound-alikes.',
    plain:
      '“acrne-login.com” doesn’t look fake at a glance. The name check notices that “rn” reads as “m” and that an official-sounding word was added — and it also catches names that sound the same when read aloud.',
    details: [
      'Edit distance and token matching for typos, swaps and added words',
      'Homoglyph and punycode normalisation for lookalike characters',
      'Phonetic keys for names that sound alike',
      'Sentence embeddings for names with a similar meaning',
    ],
    tools: 'RapidFuzz · Sentence Transformers',
    visual: <NameCheckVisual />,
  },
  {
    id: 'images',
    icon: ImageIcon,
    name: 'Logos & icons',
    title: (
      <>
        Spots copied <em>logos</em> and app icons.
      </>
    ),
    summary: 'Compares pictures the way a person would, even after small changes.',
    plain:
      'Copycats often shift a colour or crop a logo slightly so it isn’t an exact copy. Images are first put on an equal footing — same size, crop and colours — and then compared for near-copies and for overall style.',
    details: [
      'Resize, crop and colour normalisation before comparing',
      'Perceptual hashes to find near-identical copies',
      'Image embeddings to find logos with a similar style',
    ],
    tools: 'OpenCV · perceptual hashing · pretrained image embeddings',
    visual: <ImageCheckVisual />,
  },
  {
    id: 'documents',
    icon: FileScan,
    name: 'Documents',
    title: (
      <>
        Reads trademark journals <em>for</em> you.
      </>
    ),
    summary: 'Turns scanned journal pages into records you can search and check.',
    plain:
      'Trademark offices publish new applications in long journals, often as scanned PDFs. Similo reads them, pulls out each mark and its classes, and keeps the page number so anyone can check the original.',
    details: [
      'Embedded PDF text is extracted directly when it exists',
      'OCR reads scanned pages, with a confidence level for each block',
      'Every record keeps its source file and page reference',
    ],
    tools: 'PyMuPDF · PaddleOCR or Tesseract',
    visual: <DocumentCheckVisual />,
  },
  {
    id: 'registration',
    icon: Network,
    name: 'Registration data',
    title: (
      <>
        Finds out <em>when</em> a site was set up.
      </>
    ),
    summary: 'Registration dates, email set-up and certificates reveal intent.',
    plain:
      'A lookalike website registered two days ago, set up to send email and given a padlock certificate is very likely being prepared for phishing. These public records tell that story — and some details, like a hidden owner, are normal on their own.',
    details: [
      'RDAP, the modern replacement for WHOIS, for registration dates and registrars',
      'DNS records, such as MX, show whether a domain can send and receive email',
      'Certificate Transparency logs show when a padlock certificate was issued',
    ],
    tools: 'RDAP · DNS · Certificate Transparency',
    visual: <RegistrationVisual />,
  },
  {
    id: 'score',
    icon: Gauge,
    name: 'Risk score',
    title: (
      <>
        Adds everything up in the <em>open</em>.
      </>
    ),
    summary: 'A priority with the reasons that make it up. Weights you can tune.',
    plain:
      'Each check produces named signals. They are added up with weights you can see and change, giving a priority and a list of reasons. The score decides what your team looks at first — never what is legally true.',
    details: [
      'Configurable weights for every signal',
      'Reason codes stored with every alert',
      'Versioned rules, so old alerts can always be explained',
    ],
    tools: 'Weighted signals · reason codes · versioned rules',
    visual: <WeightsVisual />,
  },
  {
    id: 'assistant',
    icon: MessageSquareText,
    name: 'Assistant',
    title: (
      <>
        Answers questions with <em>sources</em>.
      </>
    ),
    summary: 'Answers only from your records, cites them, and says what it doesn’t know.',
    plain:
      'Ask “why was this flagged?” and the assistant answers from your own alerts, evidence and notes — with a numbered source for every claim. If the records don’t say, it tells you so instead of guessing.',
    details: [
      'Your records are split into passages and indexed for search',
      'Retrieval is limited to your organisation and your role',
      'Every answer cites its sources; missing information is stated',
      'The language model provider can be swapped',
    ],
    tools: 'Retrieval-augmented generation · MongoDB Atlas Vector Search',
    visual: <AssistantPreview />,
  },
];

const STACK: { icon: LucideIcon; name: string; job: string; tech: string }[] = [
  {
    icon: Monitor,
    name: 'Web app',
    job: 'What your team uses every day',
    tech: 'React · TypeScript',
  },
  {
    icon: Server,
    name: 'API',
    job: 'Checks permissions and serves data',
    tech: 'Node.js · Express',
  },
  {
    icon: Workflow,
    name: 'Background jobs',
    job: 'Runs long checks without slowing the app',
    tech: 'Redis · BullMQ',
  },
  {
    icon: Layers,
    name: 'AI service',
    job: 'Name, image and document checks',
    tech: 'Python · FastAPI',
  },
  {
    icon: Database,
    name: 'Database & search',
    job: 'Records and the assistant’s search index',
    tech: 'MongoDB Atlas · Vector Search',
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
    question: 'Does the AI decide what counts as infringement?',
    answer:
      'No. The AI finds, compares and explains. Whether something infringes your rights is a decision for qualified people, and Similo never takes enforcement action on its own.',
  },
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

/* ----------------------------------------------------------- Deep dive */

function DeepDive({ check, index }: { check: Check; index: number }) {
  const flip = index % 2 === 1;
  return (
    <Section id={check.id} tone={flip ? 'white' : 'light'}>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className={cn('min-w-0', flip && 'lg:order-2')}>
          <Eyebrow index={String(index + 2).padStart(2, '0')}>{check.name}</Eyebrow>
          <h2 className="text-headline mt-5 font-semibold text-balance">{check.title}</h2>
          <p className="text-lead mt-5 text-pretty text-muted">{check.plain}</p>
          <div className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-soft">
            <p className="font-mono text-[11.5px] tracking-[0.08em] text-muted uppercase">
              Technical detail
            </p>
            <ul className="mt-3 space-y-2.5">
              {check.details.map((detail) => (
                <li key={detail} className="flex gap-3 text-[15px] leading-snug">
                  <span
                    aria-hidden
                    className="mt-[7px] size-1.5 shrink-0 rounded-full bg-crimson"
                  />
                  {detail}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 font-mono text-[12px] text-muted">Under the hood: {check.tools}</p>
        </Reveal>
        <Reveal delay={0.1} className={cn('mx-auto w-full max-w-lg min-w-0', flip && 'lg:order-1')}>
          {check.visual}
        </Reveal>
      </div>
      {check.id === 'score' && (
        <Reveal className="mt-14">
          <div className="flex flex-col gap-4 rounded-3xl border border-crimson/25 bg-crimson/[0.04] p-6 sm:flex-row sm:items-center sm:p-8">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-crimson text-white">
              <Scale aria-hidden className="size-6" />
            </span>
            <p className="text-[1.0625rem] leading-relaxed text-ink">
              <strong className="font-semibold">Scores support decisions.</strong> They are not
              legal findings of infringement, and Similo never takes enforcement action on its own.
            </p>
          </div>
        </Reveal>
      )}
    </Section>
  );
}

/* ---------------------------------------------------------------- Page */

export function TechnologyPage() {
  return (
    <>
      <SplitHero
        eyebrow="The AI, explained"
        title={
          <>
            AI that <em>shows</em> its working.
          </>
        }
        description="Similo uses separate, focused checks for names, images and documents, then adds up what they find in the open. Every alert can be traced back to the evidence behind it."
        secondaryCta={{
          label: 'Why explainability matters',
          to: '/resources/explainable-risk-scores',
        }}
        highlights={[
          { label: 'Checks', value: 'One job each' },
          { label: 'Scores', value: 'Separate & named' },
          { label: 'Answers', value: 'With sources' },
        ]}
        visual={<ScoreBreakdown />}
      />

      <Section tone="white">
        <SectionHeading
          index="01"
          align="split"
          eyebrow="In plain words"
          title={
            <>
              Six checks, each with <em>one</em> job.
            </>
          }
          description="Each part does one thing and shows its result. Pick one to jump to the detail."
        />
        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CHECKS.map((check) => (
            <RevealItem key={check.id}>
              <a href={`#${check.id}`} className="group/link block h-full rounded-3xl">
                <SpotlightCard className="flex h-full flex-col p-6 sm:p-7">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-paper text-crimson-dark ring-1 ring-line transition-colors duration-300 group-hover/spot:bg-crimson group-hover/spot:text-white group-hover/spot:ring-crimson">
                    <check.icon aria-hidden className="size-5" />
                  </span>
                  <h3 className="text-title mt-6 font-semibold">{check.name}</h3>
                  <p className="mt-2 flex-1 leading-relaxed text-muted">{check.summary}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-crimson-dark">
                    See how it works
                    <ArrowDown
                      aria-hidden
                      className="size-4 transition-transform group-hover/link:translate-y-0.5"
                    />
                  </span>
                </SpotlightCard>
              </a>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {CHECKS.map((check, index) => (
        <DeepDive key={check.id} check={check} index={index} />
      ))}

      <Section tone="light">
        <SectionHeading
          index="08"
          align="split"
          eyebrow="What it’s built with"
          title={
            <>
              A modular stack, built to <em>grow</em>.
            </>
          }
          description="Long checks run in background workers, so the app stays fast while analysis happens. Each part can be scaled on its own."
        />
        <RevealGroup className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STACK.map((item) => (
            <RevealItem key={item.name}>
              <div className="flex h-full items-start gap-4 rounded-2xl border border-line bg-white p-5 shadow-soft">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper text-crimson-dark ring-1 ring-line">
                  <item.icon aria-hidden className="size-5" />
                </span>
                <div>
                  <p className="font-semibold tracking-[-0.01em]">{item.name}</p>
                  <p className="mt-0.5 text-[14.5px] text-muted">{item.job}</p>
                  <p className="mt-2 font-mono text-[12px] text-muted">{item.tech}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section tone="white">
        <FaqBlock
          index="09"
          title={
            <>
              Straight <em>answers</em> about the AI.
            </>
          }
          items={FAQ}
        />
      </Section>

      <CtaBand
        title={
          <>
            See the <em>reasons</em> behind every alert.
          </>
        }
        description="We’ll walk through a real scoring breakdown and show how your team would review it."
        secondary={{ label: 'The platform', to: '/platform' }}
      />
    </>
  );
}
