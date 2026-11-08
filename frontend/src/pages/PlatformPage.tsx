import { ArrowRight, Check, Globe, Smartphone, Stamp } from 'lucide-react';
import { Link } from 'react-router';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { CtaBand, ProcessSteps, Section, SplitHero } from '@/components/marketing/sections';
import { solutionItems } from '@/components/site/navigation';
import { Eyebrow, ExampleTag, SectionHeading } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/cn';
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

const LIST_POINTS = [
  'The most urgent alerts are at the top',
  'Reasons are written in plain words',
  'Evidence and notes stay with each alert',
];

const QUEUE = [
  {
    icon: Globe,
    kind: 'Website',
    name: 'acme-login.com',
    why: 'Looks like your brand, has a login form',
    level: 'High risk',
    levelClass: 'bg-accent/10 text-accent-ink',
  },
  {
    icon: Smartphone,
    kind: 'App',
    name: 'Acme Pro',
    why: 'Uses a logo like yours, different publisher',
    level: 'Medium risk',
    levelClass: 'bg-amber-100 text-amber-800',
  },
  {
    icon: Stamp,
    kind: 'Trademark',
    name: 'ACMEE',
    why: 'Sounds like your mark, same product class',
    level: 'Needs review',
    levelClass: 'bg-cream-deep text-ink',
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

/* ---------------------------------------------------------------- Visual */

/** The page's one illustrative product visual: a light alert list with sample data. */
function AlertListExample() {
  return (
    <figure>
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-[15px] font-semibold">Alerts</p>
            <p className="text-[13px] text-muted">Sorted by risk, all sources</p>
          </div>
          <ExampleTag tone="light" />
        </div>
        <ul className="divide-y divide-line">
          {QUEUE.map((row) => (
            <li key={row.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
              <row.icon aria-hidden className="size-5 shrink-0 text-accent" />
              <div className="min-w-0 flex-1 basis-40">
                <p className="flex items-baseline gap-2">
                  <span className="truncate font-mono text-[15px] font-medium">{row.name}</span>
                  <span className="shrink-0 text-[13px] text-muted">{row.kind}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-muted">{row.why}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-md px-2.5 py-1 text-[12.5px] font-semibold',
                  row.levelClass,
                )}
              >
                {row.level}
              </span>
            </li>
          ))}
        </ul>
        <p className="border-t border-line bg-cream px-5 py-3 text-[13px] text-muted">
          Nothing is sent or taken down without a person’s approval.
        </p>
      </div>
      <figcaption className="mt-3 text-[13px] text-muted">
        Illustrative example with sample names. It shows how alerts from every source sit in one
        list.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ Page */

export function PlatformPage() {
  return (
    <>
      <SplitHero
        eyebrow="The platform"
        title="One place to find, review and act on copycats."
        description="Similo looks for websites, apps and trademarks that copy your brand, explains why each one looks risky, and gives your team one place to decide what to do."
        secondaryCta={{ label: 'How the AI works', to: '/technology' }}
        visual={
          <PhotoFrame
            src="/images/core/colleagues-laptop"
            alt="Two colleagues looking at a laptop together in an office"
            width={1600}
            height={1067}
            ratio="aspect-[3/2]"
            sizes="(min-width: 1280px) 600px, (min-width: 1024px) 45vw, 100vw"
            priority
          />
        }
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

      <Section tone="white">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Eyebrow>One list</Eyebrow>
            <h2 className="text-headline mt-3 font-semibold text-balance">
              Every alert in one place.
            </h2>
            <p className="text-lead mt-4 text-pretty text-muted">
              Website, app and trademark alerts land in the same list, sorted by risk. Each one says
              why it was flagged, so the right person can pick it up without starting from scratch.
            </p>
            <ul className="mt-8 space-y-3">
              {LIST_POINTS.map((item) => (
                <li key={item} className="flex items-center gap-3 font-medium">
                  <Check aria-hidden className="size-5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.05}>
            <AlertListExample />
          </Reveal>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="The real product"
          title="Start by telling Similo what to protect."
          description="Add each brand with its other spellings, official websites, logos and registered trademarks. This is what Similo compares everything against, so it never flags your own sites."
        />
        <Reveal className="mt-10">
          <PhotoFrame
            src="/images/product/dashboard-brand-overview"
            alt="The Similo dashboard showing a sample brand, Northwind Coffee, with its name, description and keywords, and tabs for domains, logos, trademarks and monitoring"
            width={1600}
            height={1000}
            ratio="aspect-[16/10]"
            sizes="(min-width: 1280px) 1200px, 100vw"
            caption="A real screenshot of the Similo dashboard. The organisation and brand are sample data."
          />
        </Reveal>
      </Section>

      <Section tone="white">
        <SectionHeading
          eyebrow="What’s inside"
          title="Four modules, one workflow."
          description="Each module looks at a different place where copycats appear. They all feed the same alert list and the same investigation workspace."
        />
        <Reveal className="mt-10">
          <ul className="divide-y divide-line border-y border-line">
            {solutionItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group grid grid-cols-1 gap-1 py-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center sm:gap-8"
                >
                  <span className="flex items-center gap-3 text-[1.0625rem] font-semibold">
                    <item.icon aria-hidden className="size-5 shrink-0 text-accent" />
                    {item.label}
                  </span>
                  <span className="text-muted sm:pl-0">{item.description}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[15px] font-medium text-accent-ink sm:mt-0">
                    Learn more
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section>
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
                <li key={principle.title} className="py-5">
                  <h3 className="font-semibold">{principle.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{principle.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <Section tone="white">
        <FaqBlock
          title="Questions people ask first."
          description="Still curious? The AI page goes into the technical detail."
          items={FAQ}
        />
      </Section>

      <CtaBand
        title="See the whole workflow in one demo."
        description="From adding your brand to approving a takedown draft, we will walk you through each step."
        secondary={{ label: 'How the AI works', to: '/technology' }}
      />
    </>
  );
}
