import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { Section } from '@/components/marketing/sections';
import { Reveal } from '@/components/ui/Reveal';
import { AppScene } from '@/components/visuals/app';
import { AppCompareExhibit } from '@/components/visuals/exhibits';
import {
  FaqBlock,
  OrangeBand,
  PageHero,
  RuledList,
  SectionHead,
  SpecimenGrid,
  StepsWithScene,
  Timeline,
  type SpecimenData,
  type Step,
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

const COMPARE: SpecimenData[] = [
  {
    title: 'A logo that looks like yours',
    text: 'We compare the pictures themselves, so a small change of colour or shape still shows up.',
    hood: 'Perceptual hashing, image embeddings.',
  },
  {
    title: 'A name that sounds like yours',
    text: 'Your name with a word added, a letter changed or a similar meaning.',
    hood: 'Fuzzy matching, semantic text similarity.',
  },
  {
    title: 'The wrong publisher',
    text: 'The listing looks like you, but the company behind it isn’t on your list.',
    hood: 'Publisher identity check.',
  },
  {
    title: 'Borrowed details',
    text: 'Descriptions, screenshots and categories that mirror your real app.',
    hood: 'Listing metadata, screenshot similarity.',
  },
  {
    title: 'Your partners stay off the list',
    text: 'Tell us your official apps and partners once. They are recognised and never alerted.',
    hood: 'Allow-list.',
  },
  {
    title: 'Evidence kept for the complaint',
    text: 'The listing page, icon, screenshots and publisher details are saved with the time they were captured.',
    hood: 'Timestamps, SHA-256 hashes.',
  },
];

const STEPS: Step[] = [
  {
    title: 'Search the stores for your name.',
    text: 'We search approved app store sources for your brand, product names and common misspellings.',
    hood: 'Approved sources only.',
  },
  {
    title: 'Compare icon, name and publisher, each on its own.',
    text: 'The name, logo, publisher and description are each checked against yours, separately.',
    hood: 'Text and image similarity.',
  },
  {
    title: 'Review: partners stay off, copycats get confirmed.',
    text: 'Your team confirms a copycat, or marks a partner’s app as allowed, once.',
    hood: 'Partner allow-list.',
  },
  {
    title: 'Respond with saved evidence and a drafted complaint.',
    text: 'We keep the evidence and draft a complaint to the store. A person approves and sends it.',
    hood: 'Human approval, audit log.',
  },
];

const SOURCES = [
  {
    title: 'Apple App Store',
    tag: 'Official search',
    text: 'Apple publishes an official search that returns app names, publishers and icons.',
  },
  {
    title: 'Google Play',
    tag: 'Licensed provider',
    text: 'There is no public search for other people’s apps (Google’s official tools only cover your own), so finding copycats there needs a licensed data provider.',
  },
  {
    title: 'Other app stores',
    tag: 'One at a time',
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
      <PageHero
        label="Case 02 · Apps"
        title={
          <>
            Find the apps pretending to be <em>yours.</em>
          </>
        }
        description="Similo looks through app store listings for apps that copy your name, logo or company details, and tells your partners apart from impersonators."
        secondary={{ label: 'Read the playbook', to: '/resources/rogue-mobile-apps' }}
        visual={<AppCompareExhibit />}
      />

      <Section scaffold tone="white">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <SectionHead
              label="The problem"
              title="A fake app only has to look right once."
              description="People search the store for your name and tap the first thing that looks familiar. They rarely check who published it."
            />
            <Reveal delay={0.1}>
              <Timeline items={STORY} />
              <p className="mt-8 max-w-lg leading-relaxed text-muted">
                A copycat can steal sign-ins, ask for card details, show unwanted ads or collect
                data from the phone, and the angry reviews are aimed at your brand.
              </p>
            </Reveal>
          </div>
          <Reveal className="min-w-0">
            <PhotoFrame
              src="/images/pages/cover-apps"
              alt="A person holding a smartphone at a café table, with an iced coffee beside it"
              width={1600}
              height={1067}
              ratio="aspect-[4/5]"
              sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
            />
          </Reveal>
        </div>
      </Section>

      <Section scaffold tone="dark">
        <SectionHead
          tone="dark"
          label="How it works"
          title="From a store listing to a reviewed complaint."
          description="The same four steps for every app we find."
        />
        <div className="mt-14 lg:mt-20">
          <StepsWithScene tone="dark" steps={STEPS} scene={<AppScene tone="dark" index="02" />} />
        </div>
      </Section>

      <Section scaffold>
        <SectionHead
          label="What we compare"
          title="Copycats rarely copy everything."
          description="So Similo checks each part of a listing on its own, and keeps your own apps and partners out of the way."
        />
        <div className="mt-14 lg:mt-20">
          <SpecimenGrid items={COMPARE} columns={3} />
        </div>
      </Section>

      <Section scaffold tone="white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <SectionHead
            label="Where we look"
            title="Honest about where app data comes from."
            description="App stores don’t all allow the same access. We use only official or licensed sources, and your workspace shows which ones are on."
          />
          <Reveal y={12}>
            <RuledList items={SOURCES} />
          </Reveal>
        </div>
      </Section>

      <FaqBlock
        tone="light"
        title="Questions, answered."
        description="What people usually ask before they start watching the app stores."
        items={FAQ}
        link={{ label: 'Read: the rogue mobile apps playbook', to: '/resources/rogue-mobile-apps' }}
      />

      <OrangeBand
        label="App review"
        title="Know which apps are using your name."
        description="Tell us your official apps and the companies you publish under, and we’ll show you how copycats are found and reviewed."
        primary={{ label: 'Request an app review', to: '/contact' }}
        secondary={{ label: 'How the AI compares apps', to: '/technology' }}
      />
    </>
  );
}
