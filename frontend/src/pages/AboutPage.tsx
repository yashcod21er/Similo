import {
  Compass,
  Eye,
  Globe,
  Handshake,
  Megaphone,
  Scale,
  ShieldCheck,
  Smartphone,
  Stamp,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { CtaBand, FeatureCard, ProcessSteps, Section } from '@/components/marketing/sections';
import { ButtonLink } from '@/components/ui/Button';
import { Container, Eyebrow, SectionHeading } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { CardGrid } from '@/pages/solutions/page-kit';
import { PAGE_PHOTOS } from '@/pages/solutions/photos';

/** The three places a brand lives, as the product sees them. */
const WATCHED: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Globe, title: 'Websites', text: 'Newly registered names that use or resemble yours.' },
  { icon: Smartphone, title: 'App stores', text: 'Copycat apps that borrow your name or logo.' },
  {
    icon: Stamp,
    title: 'Trademark registers',
    text: 'New filings that come too close to your mark.',
  },
];

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
    description:
      'New websites, app stores and trademark journals, only from sources whose terms allow it.',
  },
  {
    title: 'Explain every result',
    description:
      'Focused AI checks compare each find with your brand and write down their reasons.',
  },
  {
    title: 'Let people decide',
    description: 'Legal, security and brand teams work from one list and approve every action.',
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
      <section className="relative isolate overflow-hidden bg-night text-cream">
        <SimilarityWave tone="dark" density="full" className="-z-10 opacity-70" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-r from-night via-night/85 to-night/10"
        />
        <Container className="pt-20 pb-16 sm:pt-24 lg:pt-32 lg:pb-24">
          <Eyebrow tone="dark">About Similo</Eyebrow>
          <h1 className="text-display mt-5 max-w-4xl font-semibold text-balance text-cream">
            We help organisations protect the identity they’ve{' '}
            <em className="text-accent-soft">built.</em>
          </h1>
          <p className="text-lead mt-6 max-w-2xl text-pretty text-cream/75">
            A brand lives on websites, in app stores and in trademark registers. Similo watches all
            three in one place, and uses AI to help people understand what they are looking at,
            quickly and with evidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/contact" size="lg">
              Request a demo
            </ButtonLink>
            <ButtonLink to="/platform" variant="outline-dark" size="lg">
              See the platform
            </ButtonLink>
          </div>

          <RevealGroup className="mt-16 grid grid-cols-1 gap-x-8 gap-y-8 border-t border-cream/15 pt-8 sm:grid-cols-3 lg:mt-24">
            {WATCHED.map((item) => (
              <RevealItem key={item.title}>
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream/[0.08] ring-1 ring-cream/10">
                    <item.icon aria-hidden className="size-5 text-accent-soft" />
                  </span>
                  <div>
                    <p className="font-semibold text-cream">{item.title}</p>
                    <p className="mt-1 text-[14.5px] leading-snug text-cream/70">{item.text}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <Section>
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Why we exist"
              title="Copycats are spread out. So are the teams."
              description="Each kind of copycat lands on a different team’s desk, watched with different tools. The connections between them get lost, and so does time."
            />
            <ul className="mt-10 divide-y divide-line border-y border-line">
              {PROBLEMS.map((problem) => (
                <li key={problem.what}>
                  <Reveal y={12} className="flex gap-4 py-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/[0.08] text-accent ring-1 ring-accent/15">
                      <problem.icon aria-hidden className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-[1.0625rem] font-semibold tracking-[-0.015em]">
                        {problem.what}
                      </h3>
                      <p className="mt-1.5 leading-relaxed text-muted">{problem.text}</p>
                      <p className="mt-2 text-[13px] text-muted">
                        Usually watched by: {problem.team}
                      </p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-xl text-[1.0625rem] font-medium">
              Similo brings all three into one shared list, so each team sees the same case.
            </p>
          </div>
          <Reveal className="min-w-0 lg:sticky lg:top-28">
            <PhotoFrame
              {...PAGE_PHOTOS.about}
              sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
            />
          </Reveal>
        </div>
      </Section>

      <Section tone="dark">
        <Reveal className="max-w-3xl">
          <Eyebrow tone="dark">Our approach</Eyebrow>
          <h2 className="text-statement serif-em mt-5 font-semibold text-balance text-cream">
            One workflow, explained at <em className="text-accent-soft">every step.</em>
          </h2>
          <p className="text-lead mt-5 max-w-xl text-pretty text-cream/75">
            Every result comes with its reasons, and a person makes every decision that matters.
          </p>
        </Reveal>
        <div className="mt-14 lg:mt-20">
          <ProcessSteps steps={APPROACH} tone="dark" />
        </div>
      </Section>

      <Section tone="white">
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

      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow="Our promises"
            title="What we will never do."
            description="Brand protection can lead to legal action, so trust matters more than features. These lines are built into how the product works."
          />
          <Reveal y={12}>
            <ul className="divide-y divide-line rounded-2xl bg-white px-6 shadow-card ring-1 ring-line">
              {WONT.map((item) => (
                <li key={item} className="flex items-center gap-4 py-5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <X aria-hidden className="size-4 text-accent-ink" />
                  </span>
                  <span className="text-[1.0625rem] leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      <CtaBand
        eyebrow="Get in touch"
        title={
          <>
            Let’s talk about <em className="text-accent-soft">your brand.</em>
          </>
        }
        description="Tell us what you protect today and where you feel exposed. We’ll show you how Similo could help."
        primary={{ label: 'Contact us', to: '/contact' }}
        secondary={{ label: 'See the platform', to: '/platform' }}
      />
    </>
  );
}
