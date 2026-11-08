import {
  ArrowDown,
  Compass,
  Eye,
  Handshake,
  type LucideIcon,
  Megaphone,
  Scale,
  ShieldCheck,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CtaBand, Section } from '@/components/marketing/sections';
import { Container, Eyebrow, SectionHeading, Stage } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { EASE_OUT } from '@/lib/motion';

const PROBLEMS: { icon: LucideIcon; what: string; kind: string; text: string; team: string }[] = [
  {
    icon: ShieldCheck,
    what: 'Fake websites',
    kind: 'A security problem',
    text: 'Lookalike domains copy your sign-in page and collect your customers’ passwords.',
    team: 'Security team',
  },
  {
    icon: Megaphone,
    what: 'Copycat apps',
    kind: 'A customer-trust problem',
    text: 'Apps that borrow your name and logo confuse customers and damage your reputation.',
    team: 'Brand & marketing',
  },
  {
    icon: Scale,
    what: 'Similar trademarks',
    kind: 'A legal problem',
    text: 'A mark that is too close to yours can be registered if nobody objects in time.',
    team: 'Legal team',
  },
];

const APPROACH = [
  {
    title: 'Look in the right places',
    text: 'New websites, app stores and trademark journals — only from sources whose terms allow it.',
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
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="bg-dots mask-radial absolute inset-0 -z-10 opacity-70" />
        <div
          aria-hidden
          className="absolute -top-56 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-coral/25 blur-[130px]"
        />
        <Container className="pt-16 pb-20 text-center sm:pt-24 lg:pt-28 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
            className="mx-auto flex max-w-4xl flex-col items-center"
          >
            <Eyebrow>About Similo</Eyebrow>
            <h1 className="text-headline mt-6 font-semibold text-balance lg:text-[4.4rem]">
              We help organisations protect the <em>identity</em> they’ve built.
            </h1>
            <p className="text-lead mt-7 max-w-2xl text-pretty text-muted">
              A brand lives on websites, in app stores and in trademark registers. Similo watches
              all three in one place, and uses AI to help people understand what they are looking at
              — quickly, and with evidence.
            </p>
            <a
              href="#why"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[14px] font-medium text-ink shadow-soft ring-1 ring-line transition-colors hover:bg-paper"
            >
              Why we exist
              <ArrowDown aria-hidden className="size-4" />
            </a>
          </motion.div>
        </Container>
      </section>

      <Section id="why" tone="white">
        <SectionHeading
          index="01"
          align="split"
          eyebrow="Why we exist"
          title={
            <>
              Copycats are spread out. So are the <em>teams</em>.
            </>
          }
          description="Each kind of copycat lands on a different team’s desk, watched with different tools. The connections between them get lost — and so does time."
        />
        <RevealGroup className="mt-14 grid gap-5 lg:grid-cols-3">
          {PROBLEMS.map((problem) => (
            <RevealItem key={problem.what}>
              <SpotlightCard className="flex h-full flex-col p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-crimson/10 px-2.5 py-1 text-[12.5px] font-semibold text-crimson-dark">
                    {problem.kind}
                  </span>
                  <problem.icon aria-hidden className="size-5 text-crimson-dark" />
                </div>
                <h3 className="text-title mt-8 font-semibold">{problem.what}</h3>
                <p className="mt-2.5 flex-1 leading-relaxed text-muted">{problem.text}</p>
                <p className="mt-8 border-t border-line pt-4 font-mono text-[12px] text-muted">
                  Usually watched by: {problem.team}
                </p>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
        <Reveal className="mt-10 flex justify-center">
          <p className="inline-flex items-center gap-2.5 rounded-full bg-midnight px-5 py-2.5 text-[14.5px] font-medium text-white shadow-lifted">
            <span aria-hidden className="size-2 rounded-full bg-crimson" />
            Similo brings all three into one shared list
          </p>
        </Reveal>
      </Section>

      <Section>
        <SectionHeading
          index="02"
          eyebrow="Our approach"
          title={
            <>
              One workflow, <em>explained</em> at every step.
            </>
          }
        />
        <RevealGroup className="mt-14 grid gap-x-8 gap-y-10 md:grid-cols-3">
          {APPROACH.map((step, index) => (
            <RevealItem key={step.title}>
              <div className="border-t-2 border-crimson pt-6">
                <p className="font-mono text-[13px] font-medium text-crimson-dark">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="text-title mt-3 font-semibold">{step.title}</h3>
                <p className="mt-2.5 leading-relaxed text-muted">{step.text}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <Section tone="white">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              index="03"
              eyebrow="What we value"
              title={
                <>
                  Principles we <em>build</em> by.
                </>
              }
              description="They decide what we build, and just as often what we don’t."
            />
          </div>
          <RevealGroup>
            {VALUES.map((value) => (
              <RevealItem key={value.title}>
                <div className="flex gap-5 border-t border-line py-8 first:border-t-0 first:pt-0">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-paper text-crimson-dark ring-1 ring-line">
                    <value.icon aria-hidden className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-title font-semibold">{value.title}</h3>
                    <p className="mt-2 max-w-xl leading-relaxed text-muted">{value.text}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <SectionHeading
            index="04"
            eyebrow="Our promises"
            title={
              <>
                What we will <em>never</em> do.
              </>
            }
            description="Brand protection can lead to legal action, so trust matters more than features. These lines are built into how the product works."
          />
          <Reveal delay={0.1}>
            <Stage>
              <div aria-hidden className="bg-dots-dark absolute inset-0 -z-10 opacity-50" />
              <div
                aria-hidden
                className="absolute -bottom-24 -left-16 -z-10 size-72 rounded-full bg-crimson/30 blur-[90px]"
              />
              <ul className="divide-y divide-white/[0.08] p-2 sm:p-3">
                {WONT.map((item) => (
                  <li key={item} className="flex items-center gap-4 px-4 py-5 sm:px-5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-crimson/20 text-coral ring-1 ring-crimson/40">
                      <X aria-hidden className="size-4" />
                    </span>
                    <span className="text-[1.0625rem] leading-snug text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
            </Stage>
          </Reveal>
        </div>
      </Section>

      <CtaBand
        eyebrow="Get in touch"
        title={
          <>
            Let’s talk about <em>your</em> brand.
          </>
        }
        description="Tell us what you protect today and where you feel exposed. We’ll show you how Similo could help."
        primary={{ label: 'Contact us', to: '/contact' }}
        secondary={{ label: 'See the platform', to: '/platform' }}
      />
    </>
  );
}
