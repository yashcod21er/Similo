import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { ResearchProof } from '@/components/marketing/ResearchProof';
import { Section } from '@/components/marketing/sections';
import { AppWindow } from '@/components/motion';
import { HorizontalScroll } from '@/components/motion/HorizontalScroll';
import { solutionItems, type NavItem } from '@/components/site/navigation';
import { Photo } from '@/components/ui/Photo';
import { Reveal } from '@/components/ui/Reveal';
import { CornerBrackets, FigCaption, MonoLabel } from '@/components/ui/specimen';
import {
  AppCompareExhibit,
  DomainSwapExhibit,
  EvidenceStampExhibit,
  JournalLoupeExhibit,
  PlatformStackExhibit,
} from '@/components/visuals/exhibits';
import { FaqBlock } from './platform-faq';
import { OrangeBand, PageHero, SectionHead, StepRows, type Step } from './solutions/page-kit';

/* ------------------------------------------------------------------ Data */

const STEPS: Step[] = [
  {
    title: 'Watch',
    text: 'Similo collects newly registered websites, app store listings and trademark filings.',
    hood: 'Scheduled collectors, de-duplication.',
  },
  {
    title: 'Check',
    text: 'Each new name, logo and page is compared with your brand: how it is spelled, how it sounds and how it looks.',
    hood: 'Name, image and document checks.',
  },
  {
    title: 'Explain',
    text: 'Anything suspicious gets a risk level and the reasons behind it, written so anyone can follow.',
    hood: 'Weighted signals, reason codes.',
  },
  {
    title: 'You decide',
    text: 'Your team reviews the evidence and chooses what to do. Nothing is sent without approval.',
    hood: 'Roles, audit log, reviewed drafts.',
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

/** The four modules, each with a different exhibit (sample data, made-up names). */
const MODULES: Record<string, { label: string; scene: ReactNode }> = {
  '/solutions/domain-intelligence': { label: 'Websites', scene: <DomainSwapExhibit /> },
  '/solutions/app-intelligence': { label: 'Apps', scene: <AppCompareExhibit /> },
  '/solutions/trademark-intelligence': { label: 'Trademarks', scene: <JournalLoupeExhibit /> },
  '/solutions/investigation-evidence': { label: 'Evidence', scene: <EvidenceStampExhibit /> },
};

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

/* ---------------------------------------------------------------- Pieces */

/** The real dashboard screenshot in a cropped window: the page's one product-UI scene. */
function DashboardFrame() {
  return (
    <figure className="mt-14 lg:mt-20">
      <Reveal>
        <div className="relative mx-auto max-w-5xl [mask-image:linear-gradient(to_bottom,black_62%,transparent)]">
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
                treatment="none"
                className="h-auto"
              />
            </AppWindow>
          </div>
        </div>
      </Reveal>
      <FigCaption as="figcaption" index="02" tone="dark" className="mx-auto mt-5 max-w-5xl">
        A real screenshot of the Similo dashboard, cropped. The organisation and brand are sample
        data.
      </FigCaption>
    </figure>
  );
}

/**
 * One module as a big sheet: its name and what it does on the left, its own exhibit on the
 * right. The sheet adapts to its own width, so the same markup is the sideways panel on large
 * screens and the stacked block on phones.
 */
function ModulePanel({ item, scene, number }: { item: NavItem; scene: ReactNode; number: string }) {
  return (
    <article className="h-full @container">
      <div className="relative h-full rounded-lg border border-line-strong bg-white p-6 @3xl:grid @3xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] @3xl:items-center @3xl:gap-12 @3xl:p-10">
        <CornerBrackets className="-inset-2" />
        <div className="pb-9 @3xl:pb-0">
          <MonoLabel>Module {number}</MonoLabel>
          <h3 className="mt-5 text-[clamp(2rem,1.4rem+1.8vw,3rem)] leading-[1] font-semibold tracking-[-0.045em] text-balance">
            {item.label}
          </h3>
          <p className="text-lead mt-5 text-pretty text-muted">{item.description}</p>
          <Link
            to={item.to}
            data-cursor="Open"
            className="group mt-8 inline-flex items-center gap-2 text-[15px] font-medium text-accent-ink"
          >
            Explore {item.label}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
            />
          </Link>
        </div>
        <div className="min-w-0">{scene}</div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ Page */

export function PlatformPage() {
  return (
    <>
      <PageHero
        label="The platform"
        title={
          <>
            One place to find, review and <em>act on copycats.</em>
          </>
        }
        description="Similo watches websites, apps and trademarks for copies of your brand, explains each one, and lets your team decide."
        secondary={{ label: 'How the AI works', to: '/technology' }}
        visual={<PlatformStackExhibit />}
      />

      <Section scaffold tone="white">
        <SectionHead
          label="How it works"
          title="Four steps, in plain words."
          description="The same simple loop runs for websites, apps and trademarks."
        />
        <div className="mt-14 lg:mt-20">
          <StepRows steps={STEPS} />
        </div>
      </Section>

      <Section scaffold tone="dark">
        <SectionHead
          tone="dark"
          label="The real product"
          title="Start by telling Similo what to protect."
          description="Add each brand with its other spellings, official websites, logos and registered trademarks. Everything is compared with this."
        />
        <DashboardFrame />
        <ul className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-x-8 gap-y-6 border-t border-cream/20 pt-8 sm:grid-cols-3">
          {SETUP_NOTES.map((note, index) => (
            <li key={note.title}>
              <MonoLabel tone="dark">0{index + 1}</MonoLabel>
              <p className="mt-2 font-semibold text-cream">{note.title}</p>
              <p className="mt-1 leading-relaxed text-cream/70">{note.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <HorizontalScroll
        labelledBy="platform-modules-title"
        intro={
          <SectionHead
            id="platform-modules-title"
            label="What’s inside"
            title="Four modules, one workflow."
            description="Each looks at a different place where copycats appear. All feed one alert list."
          />
        }
        panels={solutionItems.flatMap((item, index) => {
          const module = MODULES[item.to];
          if (!module) return [];
          return [
            {
              id: item.to,
              label: module.label,
              children: <ModulePanel item={item} scene={module.scene} number={`0${index + 1}`} />,
            },
          ];
        })}
      />

      <Section scaffold tone="white">
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
          <div>
            <SectionHead
              label="Principles"
              title="Built on trust, not just detection."
              description="Brand protection decisions can have legal consequences, so every result has to be checkable."
            />
            <Reveal delay={0.3}>
              <ol className="mt-10 divide-y divide-line-strong border-y border-line-strong">
                {PRINCIPLES.map((principle, index) => (
                  <li
                    key={principle.title}
                    className="grid grid-cols-[3rem_minmax(0,1fr)] gap-4 py-5"
                  >
                    <MonoLabel className="pt-1.5">0{index + 1}</MonoLabel>
                    <div>
                      <h3 className="text-[1.125rem] font-semibold tracking-[-0.02em]">
                        {principle.title}
                      </h3>
                      <p className="mt-1 leading-relaxed text-muted">{principle.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </div>
      </Section>

      <ResearchProof />

      <Section scaffold>
        <FaqBlock
          title="Questions people ask first."
          description="Still curious? The AI page goes into the technical detail."
          items={FAQ}
        />
      </Section>

      <OrangeBand
        label="Request a demo"
        title="See the whole workflow in one demo."
        description="From adding your brand to approving a takedown draft, we will walk you through each step."
        secondary={{ label: 'How the AI works', to: '/technology' }}
      />
    </>
  );
}
