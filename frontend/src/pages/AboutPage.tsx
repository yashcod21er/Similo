import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { Section } from '@/components/marketing/sections';
import { StampSlam } from '@/components/scenes';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { CornerBrackets, MonoLabel } from '@/components/ui/specimen';
import { PAGE_PHOTOS } from '@/pages/solutions/photos';
import {
  OrangeBand,
  PageHero,
  RuledList,
  SectionHead,
  SpecimenGrid,
  StepRows,
  type SpecimenData,
  type Step,
} from './solutions/page-kit';

/** The three places a brand lives, as the product sees them. */
const WATCHED = [
  { title: 'Websites', text: 'Newly registered names that use or resemble yours.' },
  { title: 'App stores', text: 'Copycat apps that borrow your name or logo.' },
  { title: 'Trademark registers', text: 'New filings that come too close to your mark.' },
];

const PROBLEMS = [
  {
    title: 'Fake websites',
    tag: 'Security team',
    text: 'Lookalike domains copy your sign-in page and collect your customers’ passwords. A security problem.',
  },
  {
    title: 'Copycat apps',
    tag: 'Brand and marketing',
    text: 'Apps that borrow your name and logo confuse customers and damage your reputation. A customer-trust problem.',
  },
  {
    title: 'Similar trademarks',
    tag: 'Legal team',
    text: 'A mark that is too close to yours can be registered if nobody objects in time. A legal problem.',
  },
];

const APPROACH: Step[] = [
  {
    title: 'Look in the right places',
    text: 'New websites, app stores and trademark journals, only from sources whose terms allow it.',
  },
  {
    title: 'Explain every result',
    text: 'Focused AI checks compare each find with your brand and write down their reasons.',
  },
  {
    title: 'Let people decide',
    text: 'Legal, security and brand teams work from one list and approve every action.',
  },
];

const VALUES: SpecimenData[] = [
  {
    title: 'Show the evidence',
    text: 'An alert without its reasons is just an alarm. We show the signals, sources and captures behind every result.',
  },
  {
    title: 'Keep people accountable',
    text: 'Legal and enforcement decisions belong to qualified people. Our AI prepares; it does not decide.',
  },
  {
    title: 'Be precise about coverage',
    text: 'We say exactly which sources we watch and what their limits are, rather than promising to see everything.',
  },
  {
    title: 'Respect the rules',
    text: 'We only collect data from sources whose terms allow it, and we never get around access restrictions.',
  },
];

const WONT = [
  {
    title: 'Send legal notices or takedown requests automatically',
    text: 'A person always sends.',
  },
  { title: 'Invent findings, evidence or results', text: 'Every alert has its source.' },
  {
    title: 'Show a data source as active before it really is',
    text: 'Your workspace lists what is on.',
  },
  { title: 'Get around a provider’s terms or access limits', text: 'No workarounds.' },
];

export function AboutPage() {
  return (
    <>
      <PageHero
        label="About Similo"
        title={
          <>
            We help organisations protect the identity they’ve <em>built.</em>
          </>
        }
        description="A brand lives on websites, in app stores and in trademark registers. Similo watches all three in one place, and helps people understand what they are looking at, with evidence."
        secondary={{ label: 'See the platform', to: '/platform' }}
        visual={
          <div className="relative">
            <PhotoFrame
              {...PAGE_PHOTOS.about}
              ratio="aspect-[4/3]"
              priority
              sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
            />
            <CornerBrackets className="-inset-3" />
          </div>
        }
      />

      <div className="border-y border-line-strong bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealGroup className="grid grid-cols-1 divide-y divide-line-strong sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {WATCHED.map((item, index) => (
              <RevealItem key={item.title}>
                <div className="py-7 sm:px-8 sm:first:pl-0 sm:last:pr-0">
                  <MonoLabel>Watched · 0{index + 1}</MonoLabel>
                  <p className="mt-3 text-[1.25rem] font-semibold tracking-[-0.025em]">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-[15px] leading-snug text-muted">{item.text}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>

      <Section scaffold tone="white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <SectionHead
              label="Why we exist"
              title="Copycats are spread out. So are the teams."
              description="Each kind of copycat lands on a different team’s desk, watched with different tools. The connections between them get lost, and so does time."
            />
            <Reveal delay={0.2}>
              <p className="mt-10 max-w-md text-[1.375rem] leading-snug font-semibold tracking-[-0.03em] text-balance">
                Similo brings all three into one shared list, so each team sees the same case.
              </p>
            </Reveal>
          </div>
          <Reveal y={12} className="min-w-0">
            <RuledList items={PROBLEMS} />
          </Reveal>
        </div>
      </Section>

      <Section scaffold tone="dark">
        <SectionHead
          tone="dark"
          label="Our approach"
          title="One workflow, explained at every step."
          description="Every result comes with its reasons, and a person makes every decision that matters."
        />
        <div className="mt-14 lg:mt-20">
          <StepRows steps={APPROACH} tone="dark" />
        </div>
      </Section>

      <Section scaffold>
        <SectionHead
          label="What we value"
          title="Principles we build by."
          description="They decide what we build, and just as often what we don’t."
        />
        <div className="mt-14 lg:mt-20">
          <SpecimenGrid items={VALUES} columns={2} />
        </div>
      </Section>

      <Section scaffold tone="white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <SectionHead
              label="Our promises"
              title="What we will never do."
              description="Brand protection can lead to legal action, so trust matters more than features. These lines are built into how the product works."
            />
            <div className="mt-12">
              <StampSlam text="Never" detail="Built into the product" />
            </div>
          </div>
          <Reveal y={12} className="min-w-0">
            <RuledList items={WONT.map((item) => ({ ...item, tag: 'Never' }))} />
          </Reveal>
        </div>
      </Section>

      <OrangeBand
        label="Get in touch"
        title="Let’s talk about your brand."
        description="Tell us what you protect today and where you feel exposed. We’ll show you how Similo could help."
        primary={{ label: 'Contact us', to: '/contact' }}
        secondary={{ label: 'See the platform', to: '/platform' }}
      />
    </>
  );
}
