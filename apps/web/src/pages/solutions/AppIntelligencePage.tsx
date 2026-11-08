import { CircleAlert, CreditCard, KeyRound, ThumbsDown } from 'lucide-react';
import { CtaBand, ProcessSteps, Section, SplitHero } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { AlertCard } from '@/components/visuals/AlertCard';
import {
  AppAlertVisual,
  AppSourcesPanel,
  BorrowedDetails,
  IconCompare,
  NameCompare,
  PartnerAllowList,
  PublisherCheck,
} from '@/components/visuals/app';
import { FaqSection, KindCard, Story, Tile, UnderTheHood } from './domain-app-parts';

const STORY = [
  { when: 'Search', text: 'A customer searches the app store for your name.' },
  {
    when: 'Tap',
    text: '“ACME Wallet Pro” appears near the top, with a logo that looks just like yours.',
  },
  {
    when: 'Harm',
    text: 'They sign in or add a card. The bad reviews and support calls land on you.',
  },
  {
    when: 'Our job',
    text: 'Similo aims to spot the listing early — and show your team why it isn’t yours.',
    ours: true,
  },
];

const HARMS = [
  {
    icon: KeyRound,
    title: 'Stolen sign-ins',
    text: 'Fake sign-in screens collect the usernames and passwords people use with you.',
    example: 'a copy of your login screen',
  },
  {
    icon: CreditCard,
    title: 'Payment fraud',
    text: 'Copycats ask for card details or “fees” in your name.',
    example: '“Verify your card”',
  },
  {
    icon: CircleAlert,
    title: 'Unwanted software',
    text: 'Some copies are mainly there to show ads or collect data from the phone.',
    example: 'wants contacts + location',
  },
  {
    icon: ThumbsDown,
    title: 'Damaged reputation',
    text: 'Angry reviews and complaints are aimed at the brand people thought they trusted.',
    example: '★☆☆☆☆ “Took my money”',
  },
];

const STEPS = [
  {
    title: 'Search',
    description:
      'We search approved app store sources for your brand, product names and common misspellings.',
    detail: 'Approved sources only',
  },
  {
    title: 'Compare',
    description:
      'The name, logo, publisher and description are each checked against yours, separately.',
    detail: 'Text + image similarity',
  },
  {
    title: 'Review',
    description: 'Your team confirms a copycat — or marks a partner’s app as allowed, once.',
    detail: 'Partner allow-list',
  },
  {
    title: 'Respond',
    description:
      'We keep the evidence and draft a complaint to the store. A person approves and sends it.',
    detail: 'Human approval · audit log',
  },
];

const FAQ = [
  {
    question: 'Which app stores do you check?',
    answer:
      'It depends on which approved sources are connected to your workspace. Apple offers an official public search we can use directly. Google Play has no public search for other people’s apps, so it needs a licensed data provider. Other stores are added one by one where their rules allow. Your workspace always shows which sources are active.',
  },
  {
    question: 'Will my partners’ apps be flagged by mistake?',
    answer:
      'You list your own apps and approved partners once. Their listings are recognised and kept out of alerts, and your team can add exceptions at any time.',
  },
  {
    question: 'Can Similo remove an app from the store?',
    answer:
      'No — only the app store can remove a listing. Similo gathers the evidence and drafts the complaint so your team can review it and send it quickly.',
  },
  {
    question: 'How does it know a logo has been copied?',
    answer:
      'It compares the pictures themselves, not just file names, so small changes in colour, size or shape still show up as “looks almost the same”. A person always checks before anything is reported.',
  },
  {
    question: 'What do I need to get started?',
    answer:
      'A list of your official apps, the company names you publish under, and any partners who publish apps for you. That is enough to start comparing.',
  },
];

export function AppIntelligencePage() {
  return (
    <>
      <SplitHero
        eyebrow="App Intelligence"
        title={
          <>
            Find the apps <em>pretending</em> to be yours.
          </>
        }
        description="Similo looks through app store listings for apps that copy your name, logo or company details — and tells your official partners apart from impersonators."
        secondaryCta={{ label: 'Read the playbook', to: '/resources/rogue-mobile-apps' }}
        highlights={[
          { label: 'Compares', value: 'Name, logo, publisher' },
          { label: 'Partners', value: 'Recognised, not flagged' },
          { label: 'You get', value: 'Plain-language alerts' },
        ]}
        visual={<AppAlertVisual />}
      />

      {/* 01 — The problem */}
      <Section>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <SectionHeading
              index="01"
              eyebrow="The problem"
              title={
                <>
                  A fake app only has to look right <em>once</em>.
                </>
              }
              description="People search the store for your name and tap the first thing that looks familiar. They rarely check who actually published it."
            />
            <Story steps={STORY} />
          </div>
          <Reveal className="relative">
            <div
              aria-hidden
              className="absolute inset-x-6 top-10 bottom-0 -z-10 rounded-full bg-coral/30 blur-[80px]"
            />
            <p className="mb-4 text-[13px] font-medium text-muted">What your team sees</p>
            <AlertCard
              kind="app"
              name="ACME Wallet Pro"
              facts={[
                'Uses a logo like yours',
                'Published by a different company',
                'Name includes your brand',
              ]}
              level="high"
            />
            <UnderTheHood className="mt-5">
              image similarity · name match · publisher check
            </UnderTheHood>
          </Reveal>
        </div>

        <Reveal className="mt-24 flex items-end justify-between gap-6">
          <h3 className="text-title font-semibold">What a copycat app can do</h3>
          <p className="hidden text-[14px] text-muted sm:block">And why it lands on you.</p>
        </Reveal>
        <RevealGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HARMS.map((harm) => (
            <RevealItem key={harm.title}>
              <KindCard
                icon={<harm.icon aria-hidden className="size-5" />}
                title={harm.title}
                text={harm.text}
                example={harm.example}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* 02 — How it works */}
      <Section tone="white">
        <SectionHeading
          index="02"
          eyebrow="How it works"
          align="split"
          title={
            <>
              From a store listing to a <em>reviewed</em> complaint.
            </>
          }
          description="The same four steps for every app we find. Each part of a listing is checked on its own, so even a partial copy stands out."
        />
        <div className="mt-16">
          <ProcessSteps steps={STEPS} />
        </div>
      </Section>

      {/* 03 — What we compare */}
      <Section>
        <SectionHeading
          index="03"
          eyebrow="What we compare"
          align="split"
          title={
            <>
              Copycats rarely copy <em>everything</em>.
            </>
          }
          description="So Similo checks each part of a listing separately — and keeps your own apps and partners out of the way."
        />
        <RevealGroup className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-6">
          <RevealItem className="lg:col-span-3">
            <Tile
              title="A logo that looks like yours"
              description="We compare the pictures themselves, so a small change of colour or shape still shows up."
              underHood="perceptual hashing · image embeddings"
            >
              <IconCompare />
            </Tile>
          </RevealItem>
          <RevealItem className="lg:col-span-3">
            <Tile
              title="A name that sounds like yours"
              description="Your name with a word added, a letter changed or a similar meaning."
              underHood="fuzzy matching · semantic text similarity"
            >
              <NameCompare />
            </Tile>
          </RevealItem>
          <RevealItem className="lg:col-span-2">
            <Tile
              title="The wrong publisher"
              description="The listing looks like you, but the company behind it isn’t on your list."
              underHood="publisher identity check"
            >
              <PublisherCheck />
            </Tile>
          </RevealItem>
          <RevealItem className="lg:col-span-2">
            <Tile
              title="Borrowed details"
              description="Descriptions, screenshots and categories that mirror your real app."
              underHood="listing metadata · screenshot similarity"
            >
              <BorrowedDetails />
            </Tile>
          </RevealItem>
          <RevealItem className="lg:col-span-2">
            <Tile
              title="Your partners stay off the list"
              description="Tell us your official apps and partners once. They’re recognised, never alerted."
              underHood="allow-list"
            >
              <PartnerAllowList />
            </Tile>
          </RevealItem>
        </RevealGroup>
      </Section>

      {/* 04 — Where the data comes from */}
      <Section tone="white">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
          <div>
            <SectionHeading
              index="04"
              eyebrow="Where we look"
              title={
                <>
                  Honest about <em>where</em> app data comes from.
                </>
              }
              description="App stores don’t all allow the same access. We only use official or licensed sources, and your workspace shows exactly which ones are switched on."
            />
            <Reveal>
              <ul className="mt-10 space-y-5">
                <li>
                  <p className="font-semibold">Apple App Store</p>
                  <p className="mt-1 leading-relaxed text-muted">
                    Apple publishes an official search that returns app names, publishers and icons.
                  </p>
                </li>
                <li>
                  <p className="font-semibold">Google Play</p>
                  <p className="mt-1 leading-relaxed text-muted">
                    There is no public search for other people’s apps — Google’s official tools only
                    cover your own — so finding copycats there needs a licensed data provider.
                  </p>
                </li>
                <li>
                  <p className="font-semibold">Other app stores</p>
                  <p className="mt-1 leading-relaxed text-muted">
                    Added one at a time, where each store’s rules allow, with their limits written
                    down.
                  </p>
                </li>
              </ul>
            </Reveal>
          </div>
          <Reveal>
            <AppSourcesPanel />
          </Reveal>
        </div>
      </Section>

      {/* 05 — Questions */}
      <FaqSection
        index="05"
        tone="light"
        title={
          <>
            Questions, <em>answered</em>.
          </>
        }
        description="What people usually ask before they start watching the app stores."
        items={FAQ}
        link={{ label: 'Read: the rogue mobile apps playbook', to: '/resources/rogue-mobile-apps' }}
      />

      <CtaBand
        eyebrow="App review"
        title={
          <>
            Know which apps are <em>using</em> your name.
          </>
        }
        description="Tell us your official apps and the companies you publish under, and we’ll show you how copycats are found and reviewed."
        primary={{ label: 'Request an app review', to: '/contact' }}
        secondary={{ label: 'How the AI compares apps', to: '/technology' }}
      />
    </>
  );
}
