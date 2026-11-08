import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  Globe,
  Lock,
  type LucideIcon,
  Megaphone,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Stamp,
  UserCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import {
  CtaBand,
  FeatureCard,
  ProcessSteps,
  Section,
  SplitHero,
} from '@/components/marketing/sections';
import { solutionItems } from '@/components/site/navigation';
import { Eyebrow, ExampleTag, SectionHeading, Stage } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { ProductWindow } from '@/components/visuals/primitives';
import { cn } from '@/lib/cn';
import { FaqBlock } from './platform-faq';

/* ------------------------------------------------------------ Hero visual */

const FLOW: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Eye, title: 'Watch', text: 'New names collected every day' },
  { icon: Search, title: 'Check', text: 'Compared with your brand' },
  { icon: ShieldAlert, title: 'Explain', text: 'Risk level and the reasons why' },
  { icon: UserCheck, title: 'You decide', text: 'Approve, dismiss or investigate' },
];

/** How one alert travels through the platform, from sources to a human decision. */
function PlatformFlow() {
  const reduceMotion = useReducedMotion();
  return (
    <ProductWindow title="how an alert is made" className="mx-auto w-full max-w-md">
      <div className="p-5">
        <p className="font-mono text-[10.5px] tracking-[0.08em] text-white/60 uppercase">
          Where we look
        </p>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {[
            { icon: Globe, label: 'Websites' },
            { icon: Smartphone, label: 'Apps' },
            { icon: Stamp, label: 'Trademarks' },
          ].map((source) => (
            <div
              key={source.label}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.03] py-3 ring-1 ring-white/10"
            >
              <source.icon aria-hidden className="size-4 text-coral" />
              <span className="text-[12px] text-white/75">{source.label}</span>
            </div>
          ))}
        </div>
        <ol className="mt-1">
          {FLOW.map((step, index) => {
            const last = index === FLOW.length - 1;
            return (
              <li key={step.title} className="relative pt-5">
                {/* Connector with a travelling signal dot (still when motion is reduced). */}
                <span
                  aria-hidden
                  className="absolute top-0 left-[27px] h-5 w-px overflow-hidden bg-white/15"
                >
                  {!reduceMotion && (
                    <motion.span
                      className="absolute left-0 h-2 w-px bg-coral"
                      animate={{ y: [-8, 20] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: index * 0.3,
                      }}
                    />
                  )}
                </span>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-xl p-3 ring-1',
                    last ? 'bg-crimson/15 ring-crimson/40' : 'bg-white/[0.02] ring-white/10',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-[30px] items-center justify-center rounded-lg',
                      last ? 'bg-crimson text-white' : 'bg-white/10 text-coral',
                    )}
                  >
                    <step.icon aria-hidden className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-medium">{step.title}</p>
                    <p className="text-[12px] text-white/55">{step.text}</p>
                  </div>
                  <span className="font-mono text-[10.5px] text-white/60">0{index + 1}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </ProductWindow>
  );
}

/* --------------------------------------------------------- Findings queue */

const QUEUE = [
  {
    icon: Globe,
    kind: 'Website',
    name: 'acme-login.com',
    why: 'Looks like your brand · has a login form',
    level: 'High risk',
    levelClass: 'bg-crimson/20 text-coral',
  },
  {
    icon: Smartphone,
    kind: 'App',
    name: 'Acme Pro',
    why: 'Uses a logo like yours · different publisher',
    level: 'Medium risk',
    levelClass: 'bg-amber-400/15 text-amber-300',
  },
  {
    icon: Stamp,
    kind: 'Trademark',
    name: 'ACMEE',
    why: 'Sounds like your mark · same product class',
    level: 'Needs review',
    levelClass: 'bg-white/10 text-white/80',
  },
];

/** One list for every kind of alert, sorted by risk, each with its reasons. */
function FindingsQueue() {
  return (
    <Stage>
      <div aria-hidden className="bg-dots-dark absolute inset-0 -z-10 opacity-50" />
      <div
        aria-hidden
        className="absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-crimson/30 blur-[90px]"
      />
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[15px] font-semibold">Alerts</p>
          <p className="text-[12.5px] text-white/50">Sorted by risk · all sources</p>
        </div>
        <ExampleTag />
      </div>
      <RevealGroup className="divide-y divide-white/[0.07]">
        {QUEUE.map((row) => (
          <RevealItem key={row.name}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:flex-nowrap sm:px-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-coral ring-1 ring-white/10">
                <row.icon aria-hidden className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1 basis-[calc(100%-56px)] sm:basis-auto">
                <p className="flex items-baseline gap-2">
                  <span className="truncate font-mono text-[15px] font-medium">{row.name}</span>
                  <span className="shrink-0 text-[12px] text-white/60">{row.kind}</span>
                </p>
                <p className="mt-0.5 truncate text-[13px] text-white/60">{row.why}</p>
              </div>
              <span
                className={cn(
                  'ml-14 shrink-0 rounded-full sm:ml-0 px-2.5 py-1 text-[12px] font-semibold',
                  row.levelClass,
                )}
              >
                {row.level}
              </span>
            </div>
          </RevealItem>
        ))}
      </RevealGroup>
      <div className="flex items-center gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-3.5 text-[12.5px] text-white/55 sm:px-6">
        <Lock aria-hidden className="size-3.5 text-coral" />
        Nothing is sent or taken down without a person’s approval.
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ Data */

const STEPS = [
  {
    title: 'Watch',
    description:
      'Every day we collect newly registered websites, app store listings and trademark filings.',
    detail: 'Under the hood: scheduled collectors · de-duplication',
  },
  {
    title: 'Check',
    description:
      'Each new name, logo and page is compared with your brand: how it is spelled, how it sounds and how it looks.',
    detail: 'Under the hood: name, image and document checks',
  },
  {
    title: 'Explain',
    description:
      'Anything suspicious gets a risk level and the reasons behind it, written so anyone can follow.',
    detail: 'Under the hood: weighted signals · reason codes',
  },
  {
    title: 'You decide',
    description:
      'Your team reviews the evidence and chooses what to do. Nothing is sent without approval.',
    detail: 'Under the hood: roles · audit log · reviewed drafts',
  },
];

const TEAMS: { icon: LucideIcon; team: string; title: string; text: string }[] = [
  {
    icon: Scale,
    team: 'Legal',
    title: 'Object in time',
    text: 'See new trademark filings that come close to yours, with the journal page and the deadline to object.',
  },
  {
    icon: ShieldCheck,
    team: 'Security',
    title: 'Stop fake sign-in pages',
    text: 'Spot lookalike websites with login forms early, and keep a record of what each page showed.',
  },
  {
    icon: Megaphone,
    team: 'Brand & marketing',
    title: 'Protect customer trust',
    text: 'Find copycat apps and listings that use your name or logo and confuse your customers.',
  },
  {
    icon: BriefcaseBusiness,
    team: 'Leadership',
    title: 'Know where you stand',
    text: 'Clear reports on what was found, what is being handled and what has been resolved.',
  },
];

const PRINCIPLES = [
  {
    title: 'Every alert explains itself',
    text: 'Risk levels are broken into named reasons you can read and check. No black boxes.',
  },
  {
    title: 'People make the decisions',
    text: 'The AI sorts and drafts. Your analysts and legal reviewers decide and approve.',
  },
  {
    title: 'Honest about what we see',
    text: 'Each source and its limits are written down. Sources that are not set up are never shown as active.',
  },
  {
    title: 'Your data stays yours',
    text: 'Every search and every AI answer is limited to your organisation and checked against your role.',
  },
];

const FAQ = [
  {
    question: 'Does Similo take action by itself?',
    answer:
      'No. It finds and explains possible copycats and can prepare draft takedown requests, but a person on your team always reviews the evidence and approves what happens next. Nothing is sent automatically.',
  },
  {
    question: 'Where does it look?',
    answer:
      'Newly registered domains and their registration records, app store listings and official trademark journals. Each source has documented limits, and sources that need approval from a provider are only switched on once that approval is in place.',
  },
  {
    question: 'Is the risk level a legal decision?',
    answer:
      'No. It is a way to sort work so the most urgent alerts are seen first. Whether something actually infringes your rights is a decision for qualified people.',
  },
  {
    question: 'Can different teams see different things?',
    answer:
      'Yes. Roles and permissions decide who can view alerts, work on investigations and approve actions, and every action is recorded in an audit log.',
  },
  {
    question: 'Is our information kept separate from other companies?',
    answer:
      'Yes. Every query and every AI answer is limited to your organisation’s own records, and this is enforced by the server rather than by what the screen shows.',
  },
];

/* ------------------------------------------------------------------ Page */

export function PlatformPage() {
  return (
    <>
      <SplitHero
        eyebrow="The platform"
        title={
          <>
            One place to <em>watch</em>, check and act.
          </>
        }
        description="Similo looks for websites, apps and trademarks that copy your brand, explains why each one looks risky, and gives your team one place to decide what to do."
        secondaryCta={{ label: 'The AI, explained', to: '/technology' }}
        highlights={[
          { label: 'Watches', value: 'Sites · apps · marks' },
          { label: 'Explains', value: 'Every alert' },
          { label: 'Decides', value: 'Your team' },
        ]}
        visual={<PlatformFlow />}
      />

      <Section tone="white">
        <SectionHeading
          index="01"
          eyebrow="How it works"
          title={
            <>
              Four steps, in <em>plain</em> words.
            </>
          }
          description="The same simple loop runs for websites, apps and trademarks."
        />
        <div className="mt-16">
          <ProcessSteps steps={STEPS} />
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
          <Reveal>
            <Eyebrow index="02">One list</Eyebrow>
            <h2 className="text-headline mt-5 font-semibold text-balance">
              Every alert, in <em>one</em> place.
            </h2>
            <p className="text-lead mt-5 text-pretty text-muted">
              Website, app and trademark alerts land in the same list, sorted by risk. Each one says
              why it was flagged, so the right person can pick it up without starting from scratch.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'The most urgent alerts are at the top',
                'Reasons are written in plain words',
                'Evidence and notes stay with each alert',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 font-medium">
                  <CheckCircle2 aria-hidden className="size-5 shrink-0 text-crimson-dark" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <FindingsQueue />
          </Reveal>
        </div>
      </Section>

      <Section tone="white">
        <SectionHeading
          index="03"
          align="split"
          eyebrow="What’s inside"
          title={
            <>
              Four modules, <em>one</em> workflow.
            </>
          }
          description="Each module looks at a different place where copycats appear. They all feed the same alert list and the same investigation workspace."
        />
        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {solutionItems.map((item) => (
            <RevealItem key={item.to}>
              <Link to={item.to} className="group/link block h-full rounded-3xl">
                <FeatureCard
                  icon={<item.icon className="size-5" />}
                  title={item.label}
                  description={item.description}
                >
                  <span className="flex h-full items-end gap-1 text-[15px] font-medium text-crimson-dark">
                    Learn more
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover/link:translate-x-0.5"
                    />
                  </span>
                </FeatureCard>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section>
        <SectionHeading
          index="04"
          align="split"
          eyebrow="Who uses it"
          title={
            <>
              Built for the teams that <em>share</em> the problem.
            </>
          }
          description="Copycats are a legal, security and marketing problem at the same time. Everyone works from the same evidence, each with the view they need."
        />
        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEAMS.map((team) => (
            <RevealItem key={team.team}>
              <SpotlightCard className="flex h-full flex-col p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] tracking-[0.08em] text-muted uppercase">
                    {team.team}
                  </span>
                  <team.icon aria-hidden className="size-5 text-crimson-dark" />
                </div>
                <h3 className="text-title mt-10 font-semibold">{team.title}</h3>
                <p className="mt-2.5 leading-relaxed text-muted">{team.text}</p>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section tone="white">
        <SectionHeading
          index="05"
          eyebrow="Principles"
          title={
            <>
              Built on <em>trust</em>, not just detection.
            </>
          }
          description="Brand protection decisions can have legal consequences, so every result has to be checkable."
        />
        <RevealGroup className="mt-14 grid gap-x-12 sm:grid-cols-2">
          {PRINCIPLES.map((principle, index) => (
            <RevealItem key={principle.title}>
              <div className="flex gap-6 border-t border-line py-8">
                <span className="font-mono text-[13px] font-medium text-crimson-dark">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-title font-semibold">{principle.title}</h3>
                  <p className="mt-2.5 max-w-md leading-relaxed text-muted">{principle.text}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section>
        <FaqBlock
          index="06"
          title={
            <>
              Questions people <em>ask</em> first.
            </>
          }
          description="Still curious? The AI page goes into the technical detail."
          items={FAQ}
        />
      </Section>

      <CtaBand
        title={
          <>
            See the whole workflow in <em>one</em> demo.
          </>
        }
        description="From adding your brand to approving a takedown draft — we’ll walk you through each step."
        secondary={{ label: 'The AI, explained', to: '/technology' }}
      />
    </>
  );
}
