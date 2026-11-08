import {
  BarChart3,
  FileCode2,
  FileImage,
  FolderKanban,
  Globe,
  History,
  MessagesSquare,
  NotebookPen,
  PenLine,
} from 'lucide-react';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import {
  CtaBand,
  FeatureCard,
  ProcessSteps,
  Section,
  SplitHero,
} from '@/components/marketing/sections';
import { ExampleTag, SectionHeading } from '@/components/ui/layout';
import { CardGrid, FaqBlock, ProductFigure, RuledList, SplitSection } from './page-kit';
import { HERO_SIZES, PAGE_PHOTOS } from './photos';

const STEPS = [
  {
    title: 'Open a case',
    description:
      'Group related alerts, say five fake sites from the same scammer, into one investigation with an owner and a priority.',
    detail: 'Under the hood: linked findings, status, assignee',
  },
  {
    title: 'Save the evidence',
    description:
      'Screenshots, page copies and registration records are saved together with where and when they were captured.',
    detail: 'Under the hood: SHA-256 fingerprint per file',
  },
  {
    title: 'Work it together',
    description:
      'Notes, assignments and every change appear on one timeline that the whole team can see.',
    detail: 'Under the hood: role-based access, audit log',
  },
  {
    title: 'Decide and act',
    description:
      'AI drafts the takedown request from the case evidence. A person edits it, approves it and sends it. Nothing is sent automatically.',
    detail: 'Under the hood: drafts grounded in the case, human approval',
  },
];

const TRUST = [
  {
    title: 'Saved with context',
    text: 'Each file records the web address it came from and the time it was captured.',
  },
  {
    title: 'Checked any time',
    text: 'Anyone can recalculate the fingerprint later and confirm the file is untouched.',
  },
  {
    title: 'Every access logged',
    text: 'Views, downloads and exports are recorded with who did them and when.',
  },
];

const CASE_FEATURES = [
  {
    icon: FolderKanban,
    title: 'One place per case',
    text: 'Alerts, evidence, people and decisions for one investigation, together. Findings from domains, apps and trademarks can be linked.',
  },
  {
    icon: NotebookPen,
    title: 'A timeline of everything',
    text: 'Every note, status change and new piece of evidence, in order.',
  },
  {
    icon: History,
    title: 'Who did what, recorded',
    text: 'Every view, change and approval is logged with a name and a time.',
  },
  {
    icon: PenLine,
    title: 'Drafts that people approve',
    text: 'Takedown requests and case reports are drafted from the case’s own evidence. A reviewer edits them, someone approves them and a person sends them.',
  },
  {
    icon: MessagesSquare,
    title: 'Ask about the case',
    text: 'The assistant answers only from your organisation’s records, points to the alert, file or document it used, and says plainly when the records don’t contain the answer.',
  },
  {
    icon: BarChart3,
    title: 'Reports for leadership',
    text: 'Clear summaries of open cases, outcomes and exposure, which can be exported.',
  },
];

const FAQ = [
  {
    question: 'What counts as evidence?',
    answer:
      'Screenshots, saved copies of web pages, domain registration records, app store listings and any files your team uploads. Each is stored with where and when it was captured.',
  },
  {
    question: 'How do I know the evidence hasn’t been changed?',
    answer:
      'Every file gets a fingerprint (a SHA-256 hash) when it is saved. Recalculating it later gives exactly the same code only if the file is untouched. Change anything, and the code changes completely.',
  },
  {
    question: 'Will Similo send takedown requests for me?',
    answer:
      'No. AI prepares a draft from the case evidence. A person on your team edits it, approves it and sends it. Every approval is recorded.',
  },
  {
    question: 'Who can see a case?',
    answer:
      'Only people in your organisation, with the access their role allows. Every view and change is written to the audit log.',
  },
  {
    question: 'Can the assistant make things up?',
    answer:
      'It is designed to answer only from your organisation’s records and to cite them. When the records don’t contain the answer, it says so. A person should still check anything that matters before acting on it.',
  },
  {
    question: 'Will this evidence be accepted in court?',
    answer:
      'Rules differ by country and by case. Fingerprints and capture details help show that evidence is intact, but your legal team decides how it is used.',
  },
];

const EVIDENCE_FILES = [
  {
    icon: FileImage,
    name: 'Screenshot of the sign-in page',
    file: 'page-capture.png',
    hash: '9f2c…a71e',
  },
  {
    icon: Globe,
    name: 'Who registered the website',
    file: 'registration-record.json',
    hash: '41bd…0c93',
  },
  { icon: FileCode2, name: 'Copy of the page code', file: 'page-source.html', hash: 'e07a…5b2d' },
];

/** A light, static example of one case with its saved evidence. */
function CaseFileExample() {
  return (
    <ProductFigure caption="Illustrative example: a case with its saved evidence. The names and fingerprints are made up.">
      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold tracking-[-0.01em]">Fake sign-in pages</p>
            <p className="mt-1 text-[13px] text-muted">3 alerts linked</p>
          </div>
          <ExampleTag tone="light" />
        </div>
        <p className="mt-6 text-[13px] font-medium text-muted">Saved evidence</p>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {EVIDENCE_FILES.map((item) => (
            <li key={item.file} className="flex items-center gap-3 py-3">
              <item.icon aria-hidden className="size-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px]">{item.name}</p>
                <p className="truncate font-mono text-[12px] text-muted">{item.file}</p>
              </div>
              <p className="shrink-0 text-right text-[12px] text-muted">
                Fingerprint
                <span className="block font-mono text-ink">{item.hash}</span>
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[13px] leading-relaxed text-muted">
          Analyst note: the sign-in form sends passwords to another server. Escalated to the legal
          reviewer.
        </p>
      </div>
    </ProductFigure>
  );
}

export function InvestigationEvidencePage() {
  return (
    <>
      <SplitHero
        eyebrow="Investigation & Evidence"
        title="Turn alerts into cases you can prove."
        description="Gather screenshots and records in one place, keep them safe from tampering and work the case as a team. AI can draft the takedown letter, and a person always reviews and sends it."
        secondaryCta={{
          label: 'How evidence is kept safe',
          to: '/resources/evidence-chain-of-custody',
        }}
        visual={<PhotoFrame {...PAGE_PHOTOS.evidence} priority sizes={HERO_SIZES} />}
      />

      <Section>
        <SplitSection
          text={
            <>
              <SectionHeading
                eyebrow="The problem"
                title="Fake sites disappear, often before anyone acts."
                description="Scam pages are often changed or taken offline quickly. If nobody saved a copy, there is nothing to show the hosting company, the registrar or your lawyers. And a lone screenshot is easy to question: when was it taken, and has it been edited?"
              />
              <p className="mt-6 leading-relaxed text-ink/85">
                Similo saves the evidence the moment an alert is raised, records where and when it
                came from, and gives every file a fingerprint so it can be checked later.
              </p>
            </>
          }
          media={<CaseFileExample />}
        />
      </Section>

      <Section tone="white">
        <SectionHeading
          eyebrow="How it works"
          title="From first alert to a decision you can stand behind."
          description="Four steps, the same every time, so nothing important depends on someone remembering to save a screenshot."
        />
        <div className="mt-12">
          <ProcessSteps steps={STEPS} />
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Evidence you can trust"
            title="Proof that can’t be quietly changed."
            description="When a file is saved, Similo calculates its fingerprint: a long code worked out from the file’s exact contents. Change even one character or pixel and the fingerprint changes completely."
          />
          <RuledList items={TRUST} />
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading
          eyebrow="The case workspace"
          title="Everything about a case, in one place."
          description="Investigations bring together alerts from every part of Similo, the evidence behind them and the people working on them."
        />
        <CardGrid className="mt-12">
          {CASE_FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={<feature.icon aria-hidden className="size-5" />}
              title={feature.title}
              description={feature.text}
            />
          ))}
        </CardGrid>
      </Section>

      <FaqBlock
        tone="light"
        title="Investigations, answered."
        description="The questions legal and security teams ask first."
        items={FAQ}
        link={{
          label: 'Read the evidence handling guide',
          to: '/resources/evidence-chain-of-custody',
        }}
      />

      <CtaBand
        eyebrow="Investigations"
        title="Build cases with evidence that holds up."
        description="See how an alert becomes an investigation, with saved evidence and a reviewed draft at the end."
        secondary={{ label: 'See how it works', to: '/platform' }}
      />
    </>
  );
}
