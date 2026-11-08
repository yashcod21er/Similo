import { FileText, ImageIcon, ShieldCheck, Type, UserRoundCheck, UsersRound } from 'lucide-react';
import { CtaBand, FeatureCard, Section, SplitHero } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import {
  AppComparePanel,
  AppRespondPanel,
  AppReviewPanel,
  AppScene,
  AppSearchPanel,
  StoreSearchLight,
} from '@/components/visuals/app';
import {
  CardGrid,
  FaqBlock,
  RuledList,
  SplitSection,
  StoryBand,
  Timeline,
  type StoryItem,
} from './page-kit';

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
    text: 'Similo aims to spot the listing early, and show your team why it isn’t yours.',
    ours: true,
  },
];

const COMPARE = [
  {
    icon: ImageIcon,
    title: 'A logo that looks like yours',
    text: 'We compare the pictures themselves, so a small change of colour or shape still shows up.',
    under: 'perceptual hashing, image embeddings',
  },
  {
    icon: Type,
    title: 'A name that sounds like yours',
    text: 'Your name with a word added, a letter changed or a similar meaning.',
    under: 'fuzzy matching, semantic text similarity',
  },
  {
    icon: UserRoundCheck,
    title: 'The wrong publisher',
    text: 'The listing looks like you, but the company behind it isn’t on your list.',
    under: 'publisher identity check',
  },
  {
    icon: FileText,
    title: 'Borrowed details',
    text: 'Descriptions, screenshots and categories that mirror your real app.',
    under: 'listing metadata, screenshot similarity',
  },
  {
    icon: UsersRound,
    title: 'Your partners stay off the list',
    text: 'Tell us your official apps and partners once. They are recognised and never alerted.',
    under: 'allow-list',
  },
  {
    icon: ShieldCheck,
    title: 'Evidence kept for the complaint',
    text: 'The listing page, icon, screenshots and publisher details are saved with the time they were captured.',
    under: 'timestamps, SHA-256 hashes',
  },
];

const STORY_ITEMS: StoryItem[] = [
  {
    label: 'Search',
    title: 'Your name, searched in the stores for you.',
    description:
      'We search approved app store sources for your brand, product names and common misspellings.',
    detail: 'Under the hood: approved sources only',
    visual: <AppSearchPanel />,
  },
  {
    label: 'Compare',
    title: 'Icon, name, publisher: each checked on its own.',
    description:
      'The name, logo, publisher and description are each checked against yours, separately.',
    detail: 'Under the hood: text and image similarity',
    visual: <AppComparePanel />,
  },
  {
    label: 'Review',
    title: 'Partners stay off the list. Copycats get confirmed.',
    description: 'Your team confirms a copycat, or marks a partner’s app as allowed, once.',
    detail: 'Under the hood: partner allow-list',
    visual: <AppReviewPanel />,
  },
  {
    label: 'Respond',
    title: 'The evidence is saved. The complaint is drafted.',
    description:
      'We keep the evidence and draft a complaint to the store. A person approves and sends it.',
    detail: 'Under the hood: human approval, audit log',
    visual: <AppRespondPanel />,
  },
];

const SOURCES = [
  {
    title: 'Apple App Store',
    text: 'Apple publishes an official search that returns app names, publishers and icons.',
  },
  {
    title: 'Google Play',
    text: 'There is no public search for other people’s apps (Google’s official tools only cover your own), so finding copycats there needs a licensed data provider.',
  },
  {
    title: 'Other app stores',
    text: 'Added one at a time, where each store’s rules allow, with their limits written down.',
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
      'No. Only the app store can remove a listing. Similo gathers the evidence and drafts the complaint so your team can review it and send it quickly.',
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
            Find the apps pretending to be <em className="text-accent-soft">yours.</em>
          </>
        }
        description="Similo looks through app store listings for apps that copy your name, logo or company details, and tells your official partners apart from impersonators."
        secondaryCta={{ label: 'Read the playbook', to: '/resources/rogue-mobile-apps' }}
        visual={<AppScene />}
      />

      <Section>
        <SplitSection
          text={
            <>
              <SectionHeading
                eyebrow="The problem"
                title="A fake app only has to look right once."
                description="People search the store for your name and tap the first thing that looks familiar. They rarely check who actually published it."
              />
              <Timeline items={STORY} />
              <p className="mt-8 leading-relaxed text-muted">
                A copycat can steal sign-ins, ask for card details, show unwanted ads or collect
                data from the phone, and the angry reviews are aimed at your brand.
              </p>
            </>
          }
          media={<StoreSearchLight />}
        />
      </Section>

      <StoryBand
        eyebrow="How it works"
        title={
          <>
            From a store listing to a <em>reviewed</em> complaint.
          </>
        }
        description="The same four steps for every app we find."
        items={STORY_ITEMS}
      />

      <Section tone="white">
        <SectionHeading
          eyebrow="What we compare"
          title="Copycats rarely copy everything."
          description="So Similo checks each part of a listing on its own, and keeps your own apps and partners out of the way."
        />
        <CardGrid className="mt-12">
          {COMPARE.map((item) => (
            <FeatureCard
              key={item.title}
              icon={<item.icon aria-hidden className="size-5" />}
              title={item.title}
              description={item.text}
            >
              <p className="text-[13px] text-muted">Under the hood: {item.under}</p>
            </FeatureCard>
          ))}
        </CardGrid>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Where we look"
            title="Honest about where app data comes from."
            description="App stores don’t all allow the same access. We only use official or licensed sources, and your workspace shows exactly which ones are switched on."
          />
          <RuledList items={SOURCES} />
        </div>
      </Section>

      <FaqBlock
        tone="white"
        title="Questions, answered."
        description="What people usually ask before they start watching the app stores."
        items={FAQ}
        link={{ label: 'Read: the rogue mobile apps playbook', to: '/resources/rogue-mobile-apps' }}
      />

      <CtaBand
        eyebrow="App review"
        title={
          <>
            Know which apps are using <em>your name.</em>
          </>
        }
        description="Tell us your official apps and the companies you publish under, and we’ll show you how copycats are found and reviewed."
        primary={{ label: 'Request an app review', to: '/contact' }}
        secondary={{ label: 'How the AI compares apps', to: '/technology' }}
      />
    </>
  );
}
