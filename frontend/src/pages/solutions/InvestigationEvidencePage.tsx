import {
  BarChart3,
  Bot,
  ChevronRight,
  ClipboardCheck,
  FolderKanban,
  History,
  MessagesSquare,
  NotebookPen,
  PenLine,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router';
import { CtaBand, ProcessSteps, Section, SplitHero } from '@/components/marketing/sections';
import { Accordion } from '@/components/ui/Accordion';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { AlertCard } from '@/components/visuals/AlertCard';
import { AssistantPreview } from '@/components/visuals/assistant';
import { EvidenceVaultCard, FingerprintDemo } from '@/components/visuals/evidence';
import { cn } from '@/lib/cn';

/* ------------------------------------------------------- 01 The problem */

function Problem() {
  return (
    <Section tone="white">
      <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
        <div>
          <SectionHeading
            index="01"
            eyebrow="The problem"
            title={
              <>
                Fake sites <em>disappear</em> — often before anyone acts.
              </>
            }
            description="Scam pages are often changed or taken offline quickly. If nobody saved a copy, there is nothing to show the hosting company, the registrar or your lawyers. And a lone screenshot is easy to question: when was it taken, and has it been edited?"
          />
          <Reveal>
            <p className="mt-8 text-[1.0625rem] leading-relaxed text-ink/85">
              Similo saves the evidence the moment an alert is raised, records where and when it
              came from, and gives every file a fingerprint so it can be checked later.
            </p>
          </Reveal>
        </div>
        <Reveal className="relative">
          <div
            aria-hidden
            className="absolute inset-x-0 -inset-y-6 -z-10 rounded-[40px] sm:-inset-6 bg-gradient-to-br from-coral/20 via-transparent to-crimson/10 blur-2xl"
          />
          <AlertCard
            kind="website"
            name="acme-login.com"
            facts={[
              'A copy of your sign-in page',
              'Screenshot and page code saved at 09:42',
              'Added to the case “Fake sign-in pages”',
            ]}
            level="high"
            className="relative sm:mx-6"
          />
        </Reveal>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------- 02 How it works */

const STEPS = [
  {
    title: 'Open a case',
    description:
      'Group related alerts — say, five fake sites from the same scammer — into one investigation with an owner and a priority.',
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
      'AI drafts the takedown request from the case evidence. A person edits it, approves it and sends it.',
    detail: 'Nothing is sent automatically',
  },
];

/* ----------------------------------------------------- 03 Fingerprints */

function Fingerprints() {
  return (
    <Section tone="white">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20">
        <div>
          <SectionHeading
            index="03"
            eyebrow="Evidence you can trust"
            title={
              <>
                Proof that can’t be <em>quietly</em> changed.
              </>
            }
            description="When a file is saved, Similo calculates its fingerprint: a long code worked out from the file’s exact contents. Change even one character or pixel and the fingerprint changes completely."
          />
          <Reveal>
            <ul className="mt-9 space-y-4">
              {[
                [
                  'Saved with context',
                  'Each file records the web address it came from and the time it was captured.',
                ],
                [
                  'Checked any time',
                  'Anyone can recalculate the fingerprint later and confirm the file is untouched.',
                ],
                [
                  'Every access logged',
                  'Views, downloads and exports are recorded with who did them and when.',
                ],
              ].map(([title, text]) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-crimson/10 text-crimson-dark">
                    <ShieldCheck aria-hidden className="size-3.5" />
                  </span>
                  <span>
                    <span className="block font-semibold tracking-[-0.01em]">{title}</span>
                    <span className="mt-0.5 block leading-relaxed text-muted">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal>
          <FingerprintDemo />
        </Reveal>
      </div>
    </Section>
  );
}

/* -------------------------------------------------- 04 Case workspace */

const TILES = [
  {
    icon: FolderKanban,
    title: 'One place per case',
    text: 'Alerts, evidence, people and decisions for one investigation, together.',
    under: 'Linked findings across domains, apps and trademarks',
  },
  {
    icon: NotebookPen,
    title: 'A timeline of everything',
    text: 'Every note, status change and new piece of evidence, in order.',
    under: 'Append-only case history',
  },
  {
    icon: History,
    title: 'Who did what, recorded',
    text: 'Every view, change and approval is logged with a name and a time.',
    under: 'Audit log per organisation',
  },
  {
    icon: PenLine,
    title: 'Drafts written for you',
    text: 'Takedown requests and case reports drafted from the case’s own evidence.',
    under: 'Retrieval-grounded drafting, human approval',
  },
  {
    icon: BarChart3,
    title: 'Reports for leadership',
    text: 'Clear summaries of open cases, outcomes and exposure.',
    under: 'Exportable reports',
  },
];

function Workspace() {
  return (
    <Section>
      <SectionHeading
        index="04"
        align="split"
        eyebrow="The case workspace"
        title={
          <>
            Everything about a case, <em>in one place</em>.
          </>
        }
        description="Investigations bring together alerts from every part of Similo, the evidence behind them and the people working on them."
      />
      <RevealGroup className="mt-14 grid gap-5 lg:grid-cols-3">
        <RevealItem className="lg:col-span-2 lg:row-span-2">
          <SpotlightCard className="flex h-full flex-col p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-crimson text-white">
                <MessagesSquare aria-hidden className="size-5" />
              </span>
              <div>
                <h3 className="text-title font-semibold">
                  Ask about the case. Get answers with sources.
                </h3>
                <p className="mt-2 max-w-xl leading-relaxed text-muted">
                  The assistant answers only from your organisation’s records, points to the alert,
                  file or document it used, and says plainly when the records don’t contain the
                  answer.
                </p>
                <p className="mt-3 font-mono text-[12px] text-muted">
                  Under the hood: retrieval-augmented generation scoped to your organisation
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-1 items-end">
              {/* Inline-size containment lets the preview shrink to narrow screens. */}
              <div className="w-full [contain:inline-size]">
                <AssistantPreview />
              </div>
            </div>
          </SpotlightCard>
        </RevealItem>
        {TILES.map((tile) => (
          <RevealItem key={tile.title}>
            <SpotlightCard className="flex h-full flex-col p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-paper text-crimson-dark ring-1 ring-line transition-colors duration-300 group-hover/spot:bg-crimson group-hover/spot:text-white group-hover/spot:ring-crimson">
                <tile.icon aria-hidden className="size-5" />
              </span>
              <h3 className="mt-6 text-[1.125rem] font-semibold tracking-[-0.02em]">
                {tile.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted">{tile.text}</p>
              <p className="mt-auto pt-5 font-mono text-[12px] text-muted">{tile.under}</p>
            </SpotlightCard>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}

/* --------------------------------------------- 05 People stay in charge */

const DRAFT_FLOW = [
  { icon: Bot, title: 'AI drafts', text: 'From the case evidence only, with sources.' },
  { icon: PenLine, title: 'A reviewer edits', text: 'A legal reviewer corrects and completes it.' },
  {
    icon: ClipboardCheck,
    title: 'Someone approves',
    text: 'The approval is saved in the audit log.',
  },
  { icon: Send, title: 'A person sends it', text: 'Nothing is ever sent automatically.' },
];

function PeopleDecide() {
  return (
    <Section tone="white">
      <SectionHeading
        index="05"
        align="center"
        eyebrow="People stay in charge"
        title={
          <>
            AI prepares. <em>People</em> decide.
          </>
        }
        description="Drafts take care of the routine writing. Responsibility for what is sent stays with your team."
      />
      <RevealGroup className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {DRAFT_FLOW.flatMap((step, index) => {
          const last = index === DRAFT_FLOW.length - 1;
          const card = (
            <RevealItem key={step.title}>
              <div
                className={cn(
                  'flex h-full flex-col rounded-3xl p-6',
                  last
                    ? 'bg-crimson text-white shadow-[0_18px_48px_-16px_rgb(217_47_72/0.7)]'
                    : 'bg-paper ring-1 ring-line',
                )}
              >
                <span
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    last ? 'bg-white/15' : 'bg-white text-crimson-dark ring-1 ring-line',
                  )}
                >
                  <step.icon aria-hidden className="size-5" />
                </span>
                <p
                  className={cn(
                    'mt-6 font-mono text-[12px] font-medium',
                    last ? 'text-white' : 'text-crimson-dark',
                  )}
                >
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-1 text-[1.125rem] font-semibold tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className={cn('mt-2 leading-relaxed', last ? 'text-white' : 'text-muted')}>
                  {step.text}
                </p>
              </div>
            </RevealItem>
          );
          return last
            ? [card]
            : [
                card,
                <span
                  key={`${step.title}-arrow`}
                  aria-hidden
                  className="hidden items-center justify-center text-line-strong lg:flex"
                >
                  <ChevronRight className="size-5" />
                </span>,
              ];
        })}
      </RevealGroup>
    </Section>
  );
}

/* ------------------------------------------------------------- 06 FAQ */

const FAQ = [
  {
    question: 'What counts as evidence?',
    answer:
      'Screenshots, saved copies of web pages, domain registration records, app store listings and any files your team uploads. Each is stored with where and when it was captured.',
  },
  {
    question: 'How do I know the evidence hasn’t been changed?',
    answer:
      'Every file gets a fingerprint (a SHA-256 hash) when it is saved. Recalculating it later gives exactly the same code only if the file is untouched — change anything, and the code changes completely.',
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

function Faq() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <SectionHeading
            index="06"
            eyebrow="Questions"
            title={
              <>
                Investigations, <em>answered</em>.
              </>
            }
            description="The questions legal and security teams ask first."
          />
          <Reveal>
            <Link
              to="/resources/evidence-chain-of-custody"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[14.5px] font-medium ring-1 ring-line transition-colors hover:ring-ink/30"
            >
              <ShieldCheck aria-hidden className="size-4 text-crimson-dark" />
              Read the evidence handling guide
            </Link>
          </Reveal>
        </div>
        <Reveal>
          <Accordion items={FAQ} />
        </Reveal>
      </div>
    </Section>
  );
}

export function InvestigationEvidencePage() {
  return (
    <>
      <SplitHero
        eyebrow="Investigation & Evidence"
        title={
          <>
            Turn alerts into cases you can <em>prove</em>.
          </>
        }
        description="Gather screenshots and records in one place, keep them safe from tampering and work the case as a team. AI can draft the takedown letter — a person always reviews and sends it."
        secondaryCta={{
          label: 'How evidence is kept safe',
          to: '/resources/evidence-chain-of-custody',
        }}
        highlights={[
          { label: 'Evidence', value: 'Fingerprinted' },
          { label: 'Teamwork', value: 'Shared cases' },
          { label: 'Drafts', value: 'Approved by people' },
        ]}
        visual={<EvidenceVaultCard />}
      />
      <Problem />
      <Section>
        <SectionHeading
          index="02"
          align="split"
          eyebrow="How it works"
          title={
            <>
              From first alert to a decision you can <em>stand behind</em>.
            </>
          }
          description="Four steps, the same every time, so nothing important depends on someone remembering to save a screenshot."
        />
        <div className="mt-16">
          <ProcessSteps steps={STEPS} />
        </div>
      </Section>
      <Fingerprints />
      <Workspace />
      <PeopleDecide />
      <Faq />
      <CtaBand
        eyebrow="Investigations"
        title={
          <>
            Build cases with evidence that <em>holds up</em>.
          </>
        }
        description="See how an alert becomes an investigation, with saved evidence and a reviewed draft at the end."
        secondary={{ label: 'See how it works', to: '/platform' }}
      />
    </>
  );
}
