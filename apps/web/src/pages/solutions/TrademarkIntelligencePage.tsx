import {
  AudioLines,
  BookOpenText,
  CalendarClock,
  Eye,
  FileSearch,
  Gavel,
  Layers3,
  ScanText,
  Shapes,
} from 'lucide-react';
import { AnimatePresence, motion, useScroll } from 'motion/react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { CtaBand, Section, SplitHero } from '@/components/marketing/sections';
import { Accordion } from '@/components/ui/Accordion';
import { ExampleTag, SectionHeading, Stage } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { AlertCard } from '@/components/visuals/AlertCard';
import {
  JournalPanel,
  LogoPanel,
  OppositionWindows,
  ProductClassPanel,
  SoundAlikePanel,
  TrademarkWatchCard,
} from '@/components/visuals/trademark';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';

/* ------------------------------------------------------- 01 The problem */

function Problem() {
  return (
    <Section tone="white">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20">
        <div>
          <SectionHeading
            index="01"
            eyebrow="The problem"
            title={
              <>
                A lookalike mark can slip through <em>quietly</em>.
              </>
            }
            description="Trademark offices publish every new application so that anyone who thinks it is too close to their own mark can object. The catch: the window is short, the journals are long, and many pages are scanned images."
          />
          <Reveal>
            <ul className="mt-9 space-y-4">
              {[
                'Miss the window, and a confusingly similar mark can be registered.',
                'Objecting later is usually slower, harder and more expensive.',
                'Reading every journal by hand takes hours each week.',
              ].map((point, index) => (
                <li key={point} className="flex gap-4">
                  <span className="mt-0.5 font-mono text-[13px] text-crimson-dark">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[1.0625rem] leading-relaxed text-ink/85">{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal className="relative">
          <div
            aria-hidden
            className="absolute inset-x-0 -inset-y-6 -z-10 rounded-[40px] sm:-inset-6 bg-gradient-to-br from-coral/20 via-transparent to-crimson/10 blur-2xl"
          />
          <AlertCard
            kind="trademark"
            name="ACMEE"
            facts={[
              'Sounds like your trademark “ACME”',
              'Filed for the same kind of products (class 9)',
              '18 days left to object',
            ]}
            level="high"
            className="relative z-10 sm:mr-16"
          />
          <OppositionWindows className="relative -mt-4 sm:ml-16" />
        </Reveal>
      </div>
    </Section>
  );
}

/* --------------------------------------------- 02 How it works (scroll) */

const WORKFLOW = [
  {
    icon: ScanText,
    title: 'Read every new journal',
    text: 'Each new issue of an official trademark journal is read automatically — scanned pages included — and every entry keeps its page number.',
    under: 'Under the hood: OCR with layout parsing',
  },
  {
    icon: FileSearch,
    title: 'Pull out the details',
    text: 'The mark, the applicant, the kinds of products and the key dates are turned into a tidy record that can be compared.',
    under: 'Under the hood: field extraction and normalisation',
  },
  {
    icon: Eye,
    title: 'Compare with your marks',
    text: 'New marks are checked against yours for spelling, sound, products and logo. Close ones are ranked by how little time is left.',
    under: 'Under the hood: edit distance · phonetic keys · Nice classes',
  },
  {
    icon: Gavel,
    title: 'Your team decides',
    text: 'A professional reviews each match before the deadline. AI can draft opposition notes for them to edit — nothing is filed for you.',
    under: 'Human approval required',
  },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });

  return (
    <Section>
      <div ref={ref} className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading
            index="02"
            eyebrow="How it works"
            title={
              <>
                From new filing to your decision in <em>four</em> steps.
              </>
            }
            description="Similo does the slow first pass, so your team spends its time on judgement instead of reading."
          />
          {/* Progress line fills as the reader scrolls through the steps. */}
          <div className="mt-10 hidden h-1 overflow-hidden rounded-full bg-line lg:block">
            <motion.div
              style={{ scaleX: scrollYProgress }}
              className="h-full origin-left bg-crimson"
            />
          </div>
        </div>
        <ol className="space-y-4">
          {WORKFLOW.map((step, index) => (
            <motion.li
              key={step.title}
              initial={{ opacity: 0.45, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-35% 0px -35% 0px' }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="flex gap-5 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-7"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-paper text-crimson-dark ring-1 ring-line">
                <step.icon aria-hidden className="size-[22px]" />
              </span>
              <div>
                <p className="font-mono text-[12px] font-medium text-crimson-dark">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="text-title mt-1 font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
                <p className="mt-4 font-mono text-[12px] text-muted">{step.under}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

/* ------------------------------------------------- 03 What we compare */

const SIGNALS = [
  {
    id: 'sound',
    icon: AudioLines,
    title: 'Looks or sounds alike',
    text: 'Names that are spelled differently but read or sound the same as yours.',
    panelTitle: 'Sound-alike check',
    under: 'Under the hood: phonetic keys (Double Metaphone) and edit distance, kept separate',
    panel: <SoundAlikePanel />,
  },
  {
    id: 'classes',
    icon: Layers3,
    title: 'Same kind of products',
    text: 'Marks are registered for kinds of goods and services, grouped into 45 classes. A similar name matters most when the products overlap.',
    panelTitle: 'Product classes 1–45',
    under: 'Under the hood: Nice Classification (45 classes)',
    panel: <ProductClassPanel />,
  },
  {
    id: 'logo',
    icon: Shapes,
    title: 'Similar logo',
    text: 'Logos in new applications compared with your registered logo marks.',
    panelTitle: 'Logo comparison',
    under: 'Under the hood: perceptual hashing, image embeddings, colour distance',
    panel: <LogoPanel />,
  },
  {
    id: 'journal',
    icon: BookOpenText,
    title: 'Read from the source',
    text: 'Every match links back to the exact journal page it came from, so anyone can check it.',
    panelTitle: 'From journal to shortlist',
    under: 'Under the hood: OCR with a confidence value per page',
    panel: <JournalPanel />,
  },
];

function WhatWeCompare() {
  const [active, setActive] = useState(0);
  const current = SIGNALS[active] ?? SIGNALS[0]!;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move between tabs, as the WAI-ARIA tabs pattern expects.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = {
      ArrowDown: 1,
      ArrowRight: 1,
      ArrowUp: -1,
      ArrowLeft: -1,
    };
    let next: number | undefined;
    if (event.key in keys) next = (active + keys[event.key]! + SIGNALS.length) % SIGNALS.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = SIGNALS.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Section tone="white">
      <SectionHeading
        index="03"
        align="split"
        eyebrow="What we compare"
        title={
          <>
            Four ways a mark can be <em>too close</em>.
          </>
        }
        description="Conflicts rarely come from exact copies. Similo checks four things separately and shows you each one, so you can see exactly why a mark was flagged."
      />
      <Reveal className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
        <div role="tablist" aria-label="What we compare" aria-orientation="vertical">
          {SIGNALS.map((signal, index) => {
            const selected = index === active;
            return (
              <button
                key={signal.id}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={`signal-tab-${signal.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="signal-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={onKeyDown}
                className={cn(
                  'relative mb-2 flex w-full gap-4 rounded-3xl p-5 text-left transition-colors',
                  selected ? 'bg-paper ring-1 ring-line' : 'hover:bg-paper/70',
                )}
              >
                <span
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 transition-colors',
                    selected
                      ? 'bg-crimson text-white ring-crimson'
                      : 'bg-white text-ink/70 ring-line',
                  )}
                >
                  <signal.icon aria-hidden className="size-5" />
                </span>
                <span>
                  <span className="block text-[1.0625rem] font-semibold tracking-[-0.015em]">
                    {signal.title}
                  </span>
                  <span className="mt-1 block leading-relaxed text-muted">{signal.text}</span>
                </span>
              </button>
            );
          })}
        </div>

        <Stage className="lg:self-start">
          <div
            id="signal-panel"
            role="tabpanel"
            aria-labelledby={`signal-tab-${current.id}`}
            className="relative p-6 sm:p-8"
          >
            <div
              aria-hidden
              className="absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-crimson/30 blur-3xl"
            />
            <div aria-hidden className="bg-dots-dark mask-radial absolute inset-0 -z-10" />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] font-semibold tracking-[-0.01em]">{current.panelTitle}</p>
              <ExampleTag />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="mt-7 min-h-[300px]"
              >
                {current.panel}
              </motion.div>
            </AnimatePresence>
            <p className="mt-6 border-t border-white/10 pt-4 font-mono text-[11.5px] text-white/60">
              {current.under}
            </p>
          </div>
        </Stage>
      </Reveal>
    </Section>
  );
}

/* -------------------------------------------------------- 04 Case view */

const CASE_FACTS = [
  ['Application', 'No. 6,0X1,234'],
  ['Published', 'Journal, week 32'],
  ['Office', 'India'],
  ['Classes', '9, 42, 45'],
];

const CASE_REASONS = [
  ['Spelling', '62% alike'],
  ['Sounds the same', 'Yes'],
  ['Same product classes', '2 of 3'],
];

function CaseView() {
  return (
    <Section>
      <SectionHeading
        index="04"
        align="center"
        eyebrow="What you see"
        title={
          <>
            Everything a reviewer needs, on <em>one</em> screen.
          </>
        }
        description="Each match links back to the exact journal page, so a reviewer can check what was read before deciding anything."
      />
      <Reveal className="mt-14">
        <div className="grid overflow-hidden rounded-[32px] bg-white shadow-lifted ring-1 ring-line lg:grid-cols-[1.55fr_1fr]">
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-crimson/10 px-2.5 py-1 text-[12.5px] font-semibold text-crimson-dark">
                High priority
              </span>
              <ExampleTag tone="light" />
            </div>
            <h3 className="text-headline mt-5 font-semibold">ACME-CLOUDX ENTERPRISE</h3>
            <p className="mt-2 text-muted">Applicant: Apex Cloud Technologies (example)</p>
            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-4">
              {CASE_FACTS.map(([label, value]) => (
                <div key={label} className="bg-paper p-4">
                  <dt className="text-[12.5px] text-muted">{label}</dt>
                  <dd className="mt-1 text-[15px] font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex items-start gap-4 rounded-2xl border border-dashed border-line-strong p-5">
              <ScanText aria-hidden className="mt-0.5 size-6 shrink-0 text-crimson-dark" />
              <p className="leading-relaxed text-muted">
                <span className="font-medium text-ink">Found on journal page 318.</span> The
                original page image is attached, so anyone can check that it was read correctly.
              </p>
            </div>
          </div>
          <div className="border-t border-line bg-paper p-6 sm:p-10 lg:border-t-0 lg:border-l">
            <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
              <CalendarClock aria-hidden className="size-4 text-crimson-dark" /> Time left to object
            </p>
            <p className="mt-3 text-6xl font-semibold tracking-[-0.05em] text-crimson-dark">
              18 <span className="text-xl font-medium tracking-normal text-muted">days</span>
            </p>
            <p className="mt-2 text-[13px] text-muted">
              Counted from the publication date using the office’s opposition period.
            </p>
            <dl className="mt-8 space-y-3">
              {CASE_REASONS.map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-line pb-3">
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 rounded-full bg-midnight px-5 py-3 text-center text-[14.5px] font-medium text-white">
              Draft opposition notes for legal review
            </p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------- 05 FAQ */

const FAQ = [
  {
    question: 'What is a trademark opposition?',
    answer:
      'When an office publishes a new trademark application, there is a fixed period in which anyone who thinks it conflicts with their own mark can formally object. That objection is an opposition. If nobody objects in time, the mark usually goes on to registration.',
  },
  {
    question: 'How long do I have to object?',
    answer:
      'It depends on the office. In India it is four months from publication in the Trade Marks Journal. At the EUIPO it is three months. At the USPTO it is 30 days, and you can ask for an extension. Similo tracks the date for you, but always confirm the exact deadline with your trademark attorney.',
  },
  {
    question: 'Which trademark offices do you watch?',
    answer:
      'Sources are added one office at a time, starting with official journals such as the Indian Trade Marks Journal, and only where their terms allow automated processing. Your workspace always lists exactly which sources are active.',
  },
  {
    question: 'Does Similo file the opposition for me?',
    answer:
      'No. It finds and ranks marks that may conflict with yours and can draft notes for your legal team. Deciding whether to oppose, and filing, stays with qualified professionals.',
  },
  {
    question: 'Is a match proof that someone copied my mark?',
    answer:
      'No. A match is a reason to look closer. Only a trademark office or court decides whether two marks actually conflict.',
  },
  {
    question: 'What if a scanned page is hard to read?',
    answer:
      'Every record keeps a confidence value and a link to the original page. Anything read with low confidence is flagged for a person to check.',
  },
];

function Faq() {
  return (
    <Section tone="white">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <SectionHeading
            index="05"
            eyebrow="Questions"
            title={
              <>
                Trademark watch, <em>answered</em>.
              </>
            }
            description="New to oppositions? Start here."
          />
          <Reveal>
            <Link
              to="/resources/trademark-watch-basics"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-[14.5px] font-medium ring-1 ring-line transition-colors hover:ring-ink/30"
            >
              <BookOpenText aria-hidden className="size-4 text-crimson-dark" />
              Read the trademark watch guide
            </Link>
          </Reveal>
        </div>
        <Reveal>
          <Accordion items={FAQ} />
        </Reveal>
      </div>
    </Section>
  );
}

export function TrademarkIntelligencePage() {
  return (
    <>
      <SplitHero
        eyebrow="Trademark Intelligence"
        title={
          <>
            Catch lookalike trademarks <em>in time</em> to object.
          </>
        }
        description="Every week, trademark offices publish new applications. If one is too close to yours, you only have a short window to object. Similo reads those journals for you and flags the ones worth a closer look."
        secondaryCta={{ label: 'Read the watch guide', to: '/resources/trademark-watch-basics' }}
        highlights={[
          { label: 'Reads', value: 'Official journals' },
          { label: 'Compares', value: 'Spelling, sound, products' },
          { label: 'Tracks', value: 'Deadlines to object' },
        ]}
        visual={<TrademarkWatchCard />}
      />
      <Problem />
      <HowItWorks />
      <WhatWeCompare />
      <CaseView />
      <Faq />
      <CtaBand
        eyebrow="Trademark watch"
        title={
          <>
            Never miss a deadline to <em>object</em>.
          </>
        }
        description="Tell us the marks and countries you care about, and we will show you how a watch would work for them."
        primary={{ label: 'Book a trademark briefing', to: '/contact' }}
        secondary={{ label: 'Read the watch guide', to: '/resources/trademark-watch-basics' }}
      />
    </>
  );
}
