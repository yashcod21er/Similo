import {
  BarChart3,
  FolderKanban,
  History,
  MessagesSquare,
  NotebookPen,
  PenLine,
} from 'lucide-react';
import { CtaBand, FeatureCard, Section, SplitHero } from '@/components/marketing/sections';
import { Eyebrow, SectionHeading } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { AssistantScene } from '@/components/visuals/assistant';
import {
  CaseDecidePanel,
  CaseOpenPanel,
  CaseTeamPanel,
  EvidenceFilesPanel,
  EvidenceScene,
  FingerprintDemo,
  VanishingPage,
} from '@/components/visuals/evidence';
import { CardGrid, FaqBlock, RuledList, SplitSection, StoryBand, type StoryItem } from './page-kit';

const STORY_ITEMS: StoryItem[] = [
  {
    label: 'Open a case',
    title: 'Related alerts, grouped into one case.',
    description:
      'Group related alerts, say five fake sites from the same scammer, into one investigation with an owner and a priority.',
    detail: 'Under the hood: linked findings, status, assignee',
    visual: <CaseOpenPanel />,
  },
  {
    label: 'Save the evidence',
    title: 'Every file saved with its time and a fingerprint.',
    description:
      'Screenshots, page copies and registration records are saved together with where and when they were captured.',
    detail: 'Under the hood: SHA-256 fingerprint per file',
    visual: <EvidenceFilesPanel />,
  },
  {
    label: 'Work it together',
    title: 'One timeline the whole team can see.',
    description:
      'Notes, assignments and every change appear on one timeline that the whole team can see.',
    detail: 'Under the hood: role-based access, audit log',
    visual: <CaseTeamPanel />,
  },
  {
    label: 'Decide and act',
    title: 'A drafted letter, approved by a person.',
    description:
      'AI drafts the takedown request from the case evidence. A person edits it, approves it and sends it. Nothing is sent automatically.',
    detail: 'Under the hood: drafts grounded in the case, human approval',
    visual: <CaseDecidePanel />,
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

export function InvestigationEvidencePage() {
  return (
    <>
      <SplitHero
        eyebrow="Investigation & Evidence"
        title={
          <>
            Turn alerts into cases <em className="text-accent-soft">you can prove.</em>
          </>
        }
        description="Gather screenshots and records in one place, keep them safe from tampering and work the case as a team. AI can draft the takedown letter, and a person always reviews and sends it."
        secondaryCta={{
          label: 'How evidence is kept safe',
          to: '/resources/evidence-chain-of-custody',
        }}
        visual={<EvidenceScene />}
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
          media={<VanishingPage />}
        />
      </Section>

      <StoryBand
        eyebrow="How it works"
        title={
          <>
            From first alert to a decision <em>you can stand behind.</em>
          </>
        }
        description="Four steps, the same every time, so nothing important depends on someone remembering to save a screenshot."
        items={STORY_ITEMS}
      />

      <Section tone="white">
        <SplitSection
          flip
          text={
            <>
              <SectionHeading
                eyebrow="Evidence you can trust"
                title="Proof that can’t be quietly changed."
                description="When a file is saved, Similo calculates its fingerprint: a long code worked out from the file’s exact contents. Change even one character or pixel and the fingerprint changes completely."
              />
              <div className="mt-8">
                <RuledList items={TRUST} />
              </div>
            </>
          }
          media={
            <Reveal>
              <FingerprintDemo />
            </Reveal>
          }
        />
      </Section>

      <Section>
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

      <Section tone="white">
        <SplitSection
          text={
            <Reveal>
              <Eyebrow>The assistant</Eyebrow>
              <h2 className="text-headline mt-3 font-semibold text-balance">
                Ask about the case. Get an answer with its sources.
              </h2>
              <p className="text-lead mt-4 text-pretty text-muted">
                The assistant reads only your organisation’s records. Every claim points to the
                alert, file or document it came from, and when the records don’t say, it tells you
                so instead of guessing.
              </p>
            </Reveal>
          }
          media={<AssistantScene tone="light" />}
        />
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
        title={
          <>
            Build cases with evidence that <em>holds up.</em>
          </>
        }
        description="See how an alert becomes an investigation, with saved evidence and a reviewed draft at the end."
        secondary={{ label: 'See how it works', to: '/platform' }}
      />
    </>
  );
}
