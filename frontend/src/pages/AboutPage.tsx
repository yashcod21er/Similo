import { Compass, Eye, Handshake, Megaphone, Scale, ShieldCheck, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { CtaBand, FeatureCard, Section, SplitHero } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { CardGrid, RuledList } from '@/pages/solutions/page-kit';
import { HERO_SIZES, PAGE_PHOTOS } from '@/pages/solutions/photos';

const PROBLEMS: { icon: LucideIcon; what: string; text: string; team: string }[] = [
  {
    icon: ShieldCheck,
    what: 'Fake websites',
    text: 'Lookalike domains copy your sign-in page and collect your customers’ passwords. A security problem.',
    team: 'Security team',
  },
  {
    icon: Megaphone,
    what: 'Copycat apps',
    text: 'Apps that borrow your name and logo confuse customers and damage your reputation. A customer-trust problem.',
    team: 'Brand and marketing',
  },
  {
    icon: Scale,
    what: 'Similar trademarks',
    text: 'A mark that is too close to yours can be registered if nobody objects in time. A legal problem.',
    team: 'Legal team',
  },
];

const APPROACH = [
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

const VALUES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Eye,
    title: 'Show the evidence',
    text: 'An alert without its reasons is just an alarm. We show the signals, sources and captures behind every result.',
  },
  {
    icon: Scale,
    title: 'Keep people accountable',
    text: 'Legal and enforcement decisions belong to qualified people. Our AI prepares; it does not decide.',
  },
  {
    icon: Compass,
    title: 'Be precise about coverage',
    text: 'We say exactly which sources we watch and what their limits are, rather than promising to see everything.',
  },
  {
    icon: Handshake,
    title: 'Respect the rules',
    text: 'We only collect data from sources whose terms allow it, and we never get around access restrictions.',
  },
];

const WONT = [
  'Send legal notices or takedown requests automatically',
  'Invent findings, evidence or results',
  'Show a data source as active before it really is',
  'Get around a provider’s terms or access limits',
];

export function AboutPage() {
  return (
    <>
      <SplitHero
        eyebrow="About Similo"
        title="We help organisations protect the identity they’ve built."
        description="A brand lives on websites, in app stores and in trademark registers. Similo watches all three in one place, and uses AI to help people understand what they are looking at, quickly and with evidence."
        secondaryCta={{ label: 'See the platform', to: '/platform' }}
        visual={<PhotoFrame {...PAGE_PHOTOS.about} priority sizes={HERO_SIZES} />}
      />

      <Section>
        <SectionHeading
          eyebrow="Why we exist"
          title="Copycats are spread out. So are the teams."
          description="Each kind of copycat lands on a different team’s desk, watched with different tools. The connections between them get lost, and so does time."
        />
        <CardGrid className="mt-12">
          {PROBLEMS.map((problem) => (
            <FeatureCard
              key={problem.what}
              icon={<problem.icon aria-hidden className="size-5" />}
              title={problem.what}
              description={problem.text}
            >
              <p className="text-[13px] text-muted">Usually watched by: {problem.team}</p>
            </FeatureCard>
          ))}
        </CardGrid>
        <p className="mt-8 max-w-2xl font-medium">
          Similo brings all three into one shared list, so each team sees the same case.
        </p>
      </Section>

      <Section tone="white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Our approach"
            title="One workflow, explained at every step."
            description="Every result comes with its reasons, and a person makes every decision that matters."
          />
          <RuledList items={APPROACH} />
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="What we value"
          title="Principles we build by."
          description="They decide what we build, and just as often what we don’t."
        />
        <CardGrid columns={2} className="mt-12">
          {VALUES.map((value) => (
            <FeatureCard
              key={value.title}
              icon={<value.icon aria-hidden className="size-5" />}
              title={value.title}
              description={value.text}
            />
          ))}
        </CardGrid>
      </Section>

      <Section tone="white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Our promises"
            title="What we will never do."
            description="Brand protection can lead to legal action, so trust matters more than features. These lines are built into how the product works."
          />
          <ul className="divide-y divide-line border-y border-line">
            {WONT.map((item) => (
              <li key={item} className="flex items-center gap-4 py-5">
                <X aria-hidden className="size-5 shrink-0 text-crimson" />
                <span className="text-[1.0625rem] leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <CtaBand
        eyebrow="Get in touch"
        title="Let’s talk about your brand."
        description="Tell us what you protect today and where you feel exposed. We’ll show you how Similo could help."
        primary={{ label: 'Contact us', to: '/contact' }}
        secondary={{ label: 'See the platform', to: '/platform' }}
      />
    </>
  );
}
