import { ArrowRight, Eye, ListChecks, Lock, UserCheck, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { ResearchProof } from '@/components/marketing/ResearchProof';
import { CtaBand, ProcessSteps, Section, SplitHero } from '@/components/marketing/sections';
import { AppWindow } from '@/components/motion';
import { solutionItems } from '@/components/site/navigation';
import { Eyebrow, SectionHeading } from '@/components/ui/layout';
import { Photo } from '@/components/ui/Photo';
import { Reveal } from '@/components/ui/Reveal';
import { ModuleThumb, type ModuleKind } from '@/components/visuals/modules';
import { PlatformScene } from '@/components/visuals/platform';
import { FaqBlock } from './platform-faq';

/* ------------------------------------------------------------------ Data */

const STEPS = [
  {
    title: 'Watch',
    description:
      'Similo collects newly registered websites, app store listings and trademark filings.',
    detail: 'Under the hood: scheduled collectors, de-duplication',
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
    detail: 'Under the hood: weighted signals, reason codes',
  },
  {
    title: 'You decide',
    description:
      'Your team reviews the evidence and chooses what to do. Nothing is sent without approval.',
    detail: 'Under the hood: roles, audit log, reviewed drafts',
  },
];

const SETUP_NOTES = [
  { title: 'Other spellings', text: 'Keywords and nicknames to watch for, such as common typos.' },
  { title: 'Your own websites and logos', text: 'So Similo never flags what is really yours.' },
  {
    title: 'Registered trademarks',
    text: 'The marks and product classes a lookalike is compared with.',
  },
];

const MODULE_KIND: Record<string, ModuleKind> = {
  '/solutions/domain-intelligence': 'domain',
  '/solutions/app-intelligence': 'app',
  '/solutions/trademark-intelligence': 'trademark',
  '/solutions/investigation-evidence': 'investigation',
};

const PRINCIPLES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Eye,
    title: 'Every alert explains itself',
    text: 'Risk levels are broken into named reasons you can read and check. No black boxes.',
  },
  {
    icon: UserCheck,
    title: 'People make the decisions',
    text: 'The AI sorts and drafts. Your analysts and legal reviewers decide and approve.',
  },
  {
    icon: ListChecks,
    title: 'Honest about what we see',
    text: 'Each source and its limits are written down. Sources that are not set up are never shown as active.',
  },
  {
    icon: Lock,
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

/* ---------------------------------------------------------------- Pieces */

/** The real dashboard screenshot in a cropped window, with two layers behind it for depth. */
function DashboardFrame() {
  return (
    <figure className="mt-14 lg:mt-20">
      <Reveal>
        <div className="relative mx-auto max-w-5xl [mask-image:linear-gradient(to_bottom,black_62%,transparent)]">
          <div className="relative pt-9">
            <div
              aria-hidden
              className="absolute inset-x-14 top-0 h-24 rounded-t-2xl bg-cream/[0.05] ring-1 ring-cream/10"
            />
            <div
              aria-hidden
              className="absolute inset-x-7 top-4 h-24 rounded-t-2xl bg-cream/[0.08] ring-1 ring-cream/[0.12]"
            />
            <div className="relative max-h-[31rem] overflow-hidden rounded-t-2xl shadow-[0_-24px_80px_-24px_rgb(0_0_0/0.7)]">
              <AppWindow
                tone="light"
                title="Brands"
                url="app.similo.example/brands/northwind-coffee"
                className="rounded-b-none"
              >
                <Photo
                  src="/images/product/dashboard-brand-overview"
                  alt="The Similo dashboard showing a sample brand, Northwind Coffee, with its name, description and keywords, and tabs for domains, logos, trademarks and monitoring"
                  width={1600}
                  height={1000}
                  sizes="(min-width: 1280px) 1024px, 100vw"
                  className="h-auto"
                />
              </AppWindow>
            </div>
          </div>
        </div>
      </Reveal>
      <figcaption className="mx-auto mt-4 max-w-5xl text-[13px] text-cream/65">
        A real screenshot of the Similo dashboard, cropped. The organisation and brand are sample
        data.
      </figcaption>
    </figure>
  );
}

function ModuleCard({ item }: { item: (typeof solutionItems)[number] }) {
  const kind = MODULE_KIND[item.to];
  return (
    <Link
      to={item.to}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line transition-shadow duration-200 hover:shadow-window"
    >
      {kind && (
        <div className="bg-night p-5 pt-6">
          <ModuleThumb kind={kind} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        <span className="flex items-center gap-3 text-[1.0625rem] font-semibold">
          <item.icon aria-hidden className="size-5 shrink-0 text-accent" />
          {item.label}
        </span>
        <span className="mt-2 leading-relaxed text-muted">{item.description}</span>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] font-medium text-accent-ink">
          Learn more
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ Page */

export function PlatformPage() {
  return (
    <>
      <SplitHero
        eyebrow="The platform"
        title={
          <>
            One place to find, review and <em className="text-accent-soft">act on copycats.</em>
          </>
        }
        description="Similo looks for websites, apps and trademarks that copy your brand, explains why each one looks risky, and gives your team one place to decide what to do."
        secondaryCta={{ label: 'How the AI works', to: '/technology' }}
        visual={<PlatformScene />}
      />

      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, in plain words."
          description="The same simple loop runs for websites, apps and trademarks."
        />
        <div className="mt-12">
          <ProcessSteps steps={STEPS} />
        </div>
      </Section>

      <Section tone="dark">
        <Reveal className="max-w-3xl">
          <Eyebrow tone="dark">The real product</Eyebrow>
          <h2 className="text-statement serif-em mt-5 font-semibold text-balance text-cream">
            Start by telling Similo what to <em>protect.</em>
          </h2>
          <p className="text-lead mt-5 max-w-2xl text-pretty text-cream/75">
            Add each brand with its other spellings, official websites, logos and registered
            trademarks. This is what Similo compares everything against, so it never flags your own
            sites.
          </p>
        </Reveal>
        <DashboardFrame />
        <ul className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-x-8 gap-y-6 border-t border-cream/15 pt-8 sm:grid-cols-3">
          {SETUP_NOTES.map((note, index) => (
            <li key={note.title}>
              <p className="font-mono text-[12.5px] text-accent-soft">0{index + 1}</p>
              <p className="mt-2 font-semibold text-cream">{note.title}</p>
              <p className="mt-1 leading-relaxed text-cream/70">{note.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="What’s inside"
          title="Four modules, one workflow."
          description="Each module looks at a different place where copycats appear. They all feed the same alert list and the same investigation workspace."
        />
        <Reveal className="mt-12">
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
            {solutionItems.map((item) => (
              <li key={item.to}>
                <ModuleCard item={item} />
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section tone="white">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <PhotoFrame
              src="/images/core/documents-table"
              alt="Hands pointing at printed documents on a table during a review"
              width={1600}
              height={1067}
              ratio="aspect-[3/2]"
            />
          </Reveal>
          <Reveal delay={0.05}>
            <Eyebrow>Principles</Eyebrow>
            <h2 className="text-headline mt-3 font-semibold text-balance">
              Built on trust, not just detection.
            </h2>
            <p className="text-lead mt-4 text-pretty text-muted">
              Brand protection decisions can have legal consequences, so every result has to be
              checkable.
            </p>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {PRINCIPLES.map((principle) => (
                <li key={principle.title} className="flex gap-4 py-5">
                  <principle.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
                  <div>
                    <h3 className="font-semibold">{principle.title}</h3>
                    <p className="mt-1 leading-relaxed text-muted">{principle.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <ResearchProof />

      <Section>
        <FaqBlock
          title="Questions people ask first."
          description="Still curious? The AI page goes into the technical detail."
          items={FAQ}
        />
      </Section>

      <CtaBand
        title={
          <>
            See the whole workflow <em>in one demo.</em>
          </>
        }
        description="From adding your brand to approving a takedown draft, we will walk you through each step."
        secondary={{ label: 'How the AI works', to: '/technology' }}
      />
    </>
  );
}
