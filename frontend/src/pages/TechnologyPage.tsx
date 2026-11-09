import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { Section } from '@/components/marketing/sections';
import { StampSlam } from '@/components/scenes';
import { MonoLabel } from '@/components/ui/specimen';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { AssistantScene } from '@/components/visuals/assistant';
import { NameLoupeExhibit } from '@/components/visuals/exhibits';
import { FaqBlock } from './platform-faq';
import {
  FigNote,
  OrangeBand,
  PageHero,
  SectionHead,
  StepRows,
  UnderTheHood,
  type Step,
} from './solutions/page-kit';
import { HowWeScore } from './technology-visuals';

/* ----------------------------------------------------------------- Data */

interface Check {
  id: string;
  name: string;
  title: string;
  plain: string;
  details: string[];
  tools: string;
}

const CHECKS: Check[] = [
  {
    id: 'names',
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

const STACK: { name: string; job: string; tech: string }[] = [
  { name: 'Web app', job: 'What your team uses every day', tech: 'React, TypeScript' },
  { name: 'API', job: 'Checks permissions and serves data', tech: 'Node.js, Express' },
  {
    name: 'Background jobs',
    job: 'Runs long checks without slowing the app',
    tech: 'Redis, BullMQ',
  },
  { name: 'AI service', job: 'Name, image and document checks', tech: 'Python, FastAPI' },
  {
    name: 'Database and search',
    job: 'Records and the assistant’s search index',
    tech: 'MongoDB Atlas, Vector Search',
  },
  {
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

const STEPS: Step[] = [
  {
    title: 'Collect',
    text: 'Similo collects newly registered websites, app store listings and trademark filings from approved sources. A source that is not set up is never shown as active.',
    hood: 'Scheduled collectors, de-duplication.',
  },
  {
    title: 'Compare',
    text: 'Each new name, logo and page is compared with your brand: how it is spelled, how it sounds and how it looks. Every check gives its own score.',
    hood: 'Edit distance, perceptual hashes, embeddings, OCR.',
  },
  {
    title: 'Score',
    text: 'The scores are weighted and added into a priority. You can see the weights and change them.',
    hood: 'Configurable weights, versioned rules.',
  },
  {
    title: 'Explain',
    text: 'Every alert lists why it was raised, with a code stored beside each reason so it can always be checked later.',
    hood: 'Reason codes stored with every alert.',
  },
  {
    title: 'You decide',
    text: 'Your team reviews the evidence and chooses what happens. Scores support decisions. They are not legal findings.',
    hood: 'Roles, approvals, audit log.',
  },
];

/* ---------------------------------------------------------------- Page */

export function TechnologyPage() {
  return (
    <>
      <PageHero
        tone="dark"
        label="How it works"
        title={
          <>
            AI that <em>shows its working.</em>
          </>
        }
        description="Separate checks for names, images and documents, added up in the open. Every alert traces back to its evidence."
        secondary={{
          label: 'Why explainability matters',
          to: '/resources/explainable-risk-scores',
        }}
        visual={<NameLoupeExhibit tone="dark" />}
      />

      <Section scaffold tone="white" id="how-we-score">
        <SectionHead
          label="How we score"
          title="Every score shows its parts."
          description="A high priority is never just a number. It is four separate scores, each one explained, with the weights written down."
        />
        <div className="mt-14 lg:mt-20">
          <HowWeScore />
        </div>
      </Section>

      <Section scaffold>
        <SectionHead
          label="From finding to decision"
          title="Five steps, and a person at the end."
          description="This is what happens to every website, app and trademark filing Similo looks at."
        />
        <div className="mt-14 lg:mt-20">
          <StepRows steps={STEPS} />
        </div>
      </Section>

      <Section scaffold tone="white">
        <SectionHead
          label="The checks"
          title="Six checks, each with one job."
          description="The plain explanation comes first. The technical detail is one click away."
        />
        <RevealGroup className="mt-14 lg:mt-20">
          <div className="border-b border-line-strong">
            {CHECKS.map((check, index) => (
              <RevealItem key={check.id}>
                <article
                  id={check.id}
                  className="grid scroll-mt-24 grid-cols-1 gap-x-12 gap-y-5 border-t border-line-strong py-9 lg:grid-cols-[12rem_minmax(0,1fr)_minmax(0,1.25fr)]"
                >
                  <p className="flex items-start gap-2 pt-1.5">
                    <span aria-hidden className="mt-[3px] size-1.5 shrink-0 bg-accent" />
                    <MonoLabel>
                      FIG. {String(index + 1).padStart(2, '0')} · {check.name}
                    </MonoLabel>
                  </p>
                  <h3 className="max-w-sm text-[clamp(1.5rem,1.1rem+1.2vw,2.125rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-balance">
                    {check.title}
                  </h3>
                  <div>
                    <p className="leading-relaxed text-pretty text-muted">{check.plain}</p>
                    <UnderTheHood className="mt-3">
                      {check.details.join('. ')}. Built with {check.tools}.
                    </UnderTheHood>
                  </div>
                </article>
              </RevealItem>
            ))}
          </div>
        </RevealGroup>
      </Section>

      <Section scaffold tone="dark">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <SectionHead
              tone="dark"
              label="The assistant"
              title="Ask why. Get the sources."
              description="It answers only from your own records, numbers its sources, and says so when the records don’t hold the answer."
            />
          </div>
          <Reveal className="min-w-0">
            <AssistantScene tone="dark" />
          </Reveal>
        </div>
      </Section>

      <Section scaffold>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="relative lg:order-2">
            <PhotoFrame
              src="/images/core/analyst-report"
              alt="A woman reading a printed report at her desk, with a laptop open beside her"
              width={1600}
              height={1067}
              ratio="aspect-[3/2]"
            />
          </Reveal>
          <div className="lg:order-1">
            <SectionHead
              label="People decide"
              title="The AI sorts. Your team decides."
              description="Whether something infringes your rights is a decision for qualified people. Similo never takes enforcement action on its own."
            />
            <StampSlam text="Reviewed" detail="By a person" tone="night" className="mt-10" />
            <FigNote className="mt-8">
              Scores support decisions. They are not legal findings.
            </FigNote>
          </div>
        </div>
      </Section>

      <Section scaffold tone="white">
        <SectionHead
          label="What it’s built with"
          title="A modular stack, built to grow."
          description="Long checks run in background workers, so the app stays fast. Each part can be scaled on its own."
        />
        <Reveal className="mt-12">
          <ul className="divide-y divide-line-strong border-y border-line-strong">
            {STACK.map((item, index) => (
              <li
                key={item.name}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 gap-y-1 py-5 sm:grid-cols-[3rem_1fr_1.6fr_1fr] sm:items-center sm:gap-x-8"
              >
                <MonoLabel>0{index + 1}</MonoLabel>
                <span className="text-[1.125rem] font-semibold tracking-[-0.02em]">
                  {item.name}
                </span>
                <span className="col-start-2 text-muted sm:col-start-auto">{item.job}</span>
                <span className="col-start-2 font-mono text-[12.5px] text-muted sm:col-start-auto sm:text-right">
                  {item.tech}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section scaffold>
        <FaqBlock title="Straight answers about the AI." items={FAQ} />
      </Section>

      <OrangeBand
        label="Request a demo"
        title="See the reasons behind every alert."
        description="We will walk through a scoring breakdown and show how your team would review it."
        secondary={{ label: 'The platform', to: '/platform' }}
      />
    </>
  );
}
