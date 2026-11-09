import { Section } from '@/components/marketing/sections';
import { Reveal } from '@/components/ui/Reveal';
import { Exhibit } from '@/components/ui/specimen';
import { EvidenceStampExhibit } from '@/components/visuals/exhibits';
import { EvidenceScene, FingerprintDemo, VanishingPage } from '@/components/visuals/evidence';
import {
  FaqBlock,
  OrangeBand,
  PageHero,
  RuledList,
  SectionHead,
  SpecimenGrid,
  StepsWithScene,
  type SpecimenData,
  type Step,
} from './page-kit';

const STEPS: Step[] = [
  {
    title: 'Open a case from related alerts.',
    text: 'Group related alerts, say five fake sites from the same scammer, into one investigation with an owner and a priority.',
    hood: 'Linked findings, status, assignee.',
  },
  {
    title: 'Save every file with its time and a fingerprint.',
    text: 'Screenshots, page copies and registration records are saved together with where and when they were captured.',
    hood: 'SHA-256 fingerprint per file.',
  },
  {
    title: 'Work it together on one timeline.',
    text: 'Notes, assignments and every change appear on one timeline that the whole team can see.',
    hood: 'Role-based access, audit log.',
  },
  {
    title: 'A drafted letter, approved by a person.',
    text: 'AI drafts the takedown request from the case evidence. A person edits it, approves it and sends it. Nothing is sent automatically.',
    hood: 'Drafts grounded in the case, human approval.',
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

const CASE_FEATURES: SpecimenData[] = [
  {
    title: 'One place per case',
    text: 'Alerts, evidence, people and decisions for one investigation, together. Findings from domains, apps and trademarks can be linked.',
  },
  {
    title: 'A timeline of everything',
    text: 'Every note, status change and new piece of evidence, in order.',
  },
  {
    title: 'Who did what, recorded',
    text: 'Every view, change and approval is logged with a name and a time.',
  },
  {
    title: 'Drafts that people approve',
    text: 'Takedown requests and case reports are drafted from the case’s own evidence. A reviewer edits them, someone approves them and a person sends them.',
  },
  {
    title: 'Ask about the case',
    text: 'The assistant answers only from your organisation’s records, points to the alert, file or document it used, and says plainly when the records don’t contain the answer.',
  },
  {
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
      <PageHero
        label="Case 04 · Evidence"
        title={
          <>
            Turn alerts into cases <em>you can prove.</em>
          </>
        }
        description="Gather screenshots and records in one place, keep them safe from tampering and work the case as a team. A person always reviews and sends."
        secondary={{
          label: 'How evidence is kept safe',
          to: '/resources/evidence-chain-of-custody',
        }}
        visual={<EvidenceStampExhibit />}
      />

      <Section scaffold tone="white">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <SectionHead
              label="The problem"
              title="Fake sites disappear, often before anyone acts."
              description="If nobody saved a copy, there is nothing to show the hosting company, the registrar or your lawyers. And a lone screenshot is easy to question: when was it taken, and has it been edited?"
            />
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-lg leading-relaxed text-ink/85">
                Similo saves the evidence the moment an alert is raised, records where and when it
                came from, and gives every file a fingerprint so it can be checked later.
              </p>
            </Reveal>
          </div>
          <Reveal className="min-w-0">
            <VanishingPage />
          </Reveal>
        </div>
      </Section>

      <Section scaffold tone="dark">
        <SectionHead
          tone="dark"
          label="How it works"
          title="From first alert to a decision you can stand behind."
          description="Four steps, the same every time, so nothing important depends on someone remembering to save a screenshot."
        />
        <div className="mt-14 lg:mt-20">
          <StepsWithScene
            tone="dark"
            steps={STEPS}
            scene={<EvidenceScene tone="dark" index="03" />}
          />
        </div>
      </Section>

      <Section scaffold>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <Reveal className="min-w-0 lg:order-2">
            <Exhibit
              label="Exhibit C · try it yourself"
              caption="Your browser does the sum. Nothing you type is sent."
            >
              <FingerprintDemo />
            </Exhibit>
          </Reveal>
          <div className="lg:order-1">
            <SectionHead
              label="Evidence you can trust"
              title="Proof that can’t be quietly changed."
              description="Every saved file gets a fingerprint worked out from its exact contents. Change one character and the fingerprint changes completely."
            />
            <div className="mt-10">
              <RuledList items={TRUST} />
            </div>
          </div>
        </div>
      </Section>

      <Section scaffold tone="white">
        <SectionHead
          label="The case workspace"
          title="Everything about a case, in one place."
          description="Investigations bring together alerts from every part of Similo, the evidence behind them and the people working on them."
        />
        <div className="mt-14 lg:mt-20">
          <SpecimenGrid items={CASE_FEATURES} columns={3} />
        </div>
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

      <OrangeBand
        label="Investigations"
        title="Build cases with evidence that holds up."
        description="See how an alert becomes an investigation, with saved evidence and a reviewed draft at the end."
        secondary={{ label: 'See how it works', to: '/platform' }}
      />
    </>
  );
}
