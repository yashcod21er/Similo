import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useRef, useState, type ReactNode } from 'react';
import { useInView, useMinWidth, usePrefersReducedMotion } from '@/components/motion/hooks';
import { StampSlam } from '@/components/scenes';
import { CornerBrackets, FigCaption, MonoLabel } from '@/components/ui/specimen';
import { cn } from '@/lib/cn';
import { Band, PlateLine } from './band';
import { SignalMeter } from './scene-parts';

/*
 * FIG. 05, "How it works": a pinned, scroll-scrubbed story on night (large screens). The page
 * holds still while you scroll through three steps; the step list on the left opens the
 * active step, the stage on the right changes to a different kind of picture per step (a
 * ticker of new names, the one product card on the page, an evidence sheet that gets stamped),
 * and three segmented bars at the foot fill as you go.
 *
 * Phones and reduced motion: a normal section, each step followed by its picture, nothing
 * pinned or scrubbed (reduced motion shows every picture in its finished state).
 */

/* ------------------------------------------------------------ Step 1: watch */

const FEED = [
  'sunnyfield-bakery.com',
  'parkview-dental.net',
  'acme-pay.com',
  'northgate-cycles.org',
  'riverbend-yoga.com',
  'blue-harbor.studio',
  'acrne-login.com',
  'maplestreet.coffee',
  'quillandink.shop',
  'acme.support',
  'greenfield-tools.com',
  'harbourlight.org',
  'stonebridge.legal',
  'acmee-wallet.app',
  'lumen-optics.net',
  'oak-and-pine.co',
];
const MATCH = new Set(['acme-pay.com', 'acrne-login.com', 'acme.support', 'acmee-wallet.app']);
const ROW_REM = 2.75;

/** New registrations stream past a scan line; the ones that resemble Acme are flagged. */
function WatchVisual({ progress }: { progress: MotionValue<number> | null }) {
  const still = useMotionValue(0);
  const y = useTransform(progress ?? still, [0, 1], ['0rem', `-${ROW_REM * 6}rem`]);
  return (
    <div className="relative h-full overflow-hidden rounded-xl bg-night-raised ring-1 ring-cream/10">
      <div className="flex items-center justify-between border-b border-cream/10 px-5 py-3">
        <MonoLabel tone="dark">Newly registered · today</MonoLabel>
        <MonoLabel tone="dark">Watching acme.com</MonoLabel>
      </div>
      <div className="relative h-[calc(100%-2.75rem)] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]">
        <motion.ul style={progress ? { y } : undefined} className="px-5 pt-6">
          {FEED.map((host) => {
            const match = MATCH.has(host);
            return (
              <li
                key={host}
                style={{ height: `${ROW_REM}rem` }}
                className="flex items-center justify-between gap-4 border-b border-dashed border-cream/[0.08]"
              >
                <span
                  className={cn(
                    'truncate font-mono text-[14px]',
                    match ? 'text-cream' : 'text-cream/60',
                  )}
                >
                  {host}
                </span>
                {match ? (
                  <span className="shrink-0 rounded-full bg-accent px-2.5 py-0.5 font-mono text-[11px] text-white">
                    Looks like acme.com
                  </span>
                ) : (
                  <span className="shrink-0 font-mono text-[11px] text-cream/60">no match</span>
                )}
              </li>
            );
          })}
        </motion.ul>
        {/* The scan line, with a small arrowhead at each end */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-accent-soft/70 before:absolute before:top-1/2 before:left-0 before:-translate-y-1/2 before:border-y-[5px] before:border-l-[7px] before:border-y-transparent before:border-l-accent-soft before:content-[''] after:absolute after:top-1/2 after:right-0 after:-translate-y-1/2 after:border-y-[5px] after:border-r-[7px] after:border-y-transparent after:border-r-accent-soft after:content-['']"
        />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Step 2: explain */

/** The one product card on the page: an alert with its three named scores and reasons. */
function ExplainVisual({ on }: { on: boolean }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 text-ink shadow-window-dark sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <MonoLabel>
              <span className="text-accent-ink">New look-alike website</span>
            </MonoLabel>
            <p className="mt-1.5 truncate font-mono text-[17px] font-medium">acrne-login.com</p>
          </div>
          <span className="shrink-0 rounded-full bg-cream-deep px-2.5 py-1 text-[11.5px] font-medium">
            Needs review
          </span>
        </div>
        <div className="mt-5 space-y-3.5">
          <SignalMeter tone="light" label="Name" hint="look-alike letters" value={92} on={on} />
          <SignalMeter
            tone="light"
            label="Look"
            hint="logo and layout"
            value={84}
            on={on}
            delay={150}
          />
          <SignalMeter
            tone="light"
            label="Page"
            hint="words and forms"
            value={88}
            on={on}
            delay={300}
          />
        </div>
        <ul className="mt-5 space-y-2 border-t border-line pt-4 text-[13.5px] leading-snug">
          {[
            '“rn” in place of “m”, plus the word “login”',
            'Same layout and logo as your sign-in page',
            'Asks for a card number on a 2-day-old site',
          ].map((reason) => (
            <li key={reason} className="flex gap-2.5">
              <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent" />
              {reason}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- Step 3: decide */

/** An evidence sheet, stamped when your reviewer approves it. */
function DecideVisual({ stamp }: { stamp: boolean }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative w-full max-w-lg -rotate-1 bg-cream p-6 text-ink shadow-window-dark sm:p-8">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/15 pb-3">
          <MonoLabel>Evidence · case 0142</MonoLabel>
          <MonoLabel>acrne-login.com</MonoLabel>
        </div>
        <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2.5 text-[13.5px]">
          <dt className="text-muted">Screenshot</dt>
          <dd>Captured 14:02 UTC</dd>
          <dt className="text-muted">Registration</dt>
          <dd>Record saved, 2 days old</dd>
          <dt className="text-muted">Page code</dt>
          <dd>Forms and links saved</dd>
          <dt className="text-muted">Reviewer</dt>
          <dd>Your security lead</dd>
        </dl>
        <div className="mt-5 space-y-1.5 border-t border-dashed border-ink/20 pt-4" aria-hidden>
          <span className="block h-1.5 w-11/12 rounded-full bg-ink/10" />
          <span className="block h-1.5 w-4/5 rounded-full bg-ink/10" />
          <span className="block h-1.5 w-2/3 rounded-full bg-ink/10" />
        </div>
        <p className="mt-3 max-w-[55%] text-[12.5px] text-muted">
          Takedown draft: ready to edit, not sent.
        </p>
        <div className="absolute -right-3 -bottom-7 sm:-right-8">
          {stamp && <StampSlam text="Approved" detail="by a person" />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Steps */

interface Step {
  n: string;
  label: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    n: '01',
    label: 'Watch',
    title: 'Every new name, every day.',
    body: 'Similo checks newly registered websites, new app listings and trademark filings for anything that resembles your brand.',
  },
  {
    n: '02',
    label: 'Explain',
    title: 'Every alert shows its reasons.',
    body: 'Three named scores, for the name, the look and the page, and the reasons in plain words anyone can check.',
  },
  {
    n: '03',
    label: 'Decide',
    title: 'A person makes the call.',
    body: 'Your reviewer sees the evidence and decides. Takedown requests are drafted for you and never sent on their own.',
  },
];

function StepText({ step, active, pinned }: { step: Step; active: boolean; pinned: boolean }) {
  return (
    <div
      className={cn(
        'border-t pt-4 transition-[border-color] duration-500 motion-reduce:transition-none',
        pinned && !active ? 'border-cream/10' : 'border-accent-soft/70',
      )}
    >
      <p className="flex items-center gap-3">
        <MonoLabel tone="dark">
          <span className="text-accent-soft">{step.n}</span>
        </MonoLabel>
        <MonoLabel tone="dark">{step.label}</MonoLabel>
      </p>
      <h3
        className={cn(
          'mt-3 text-[1.625rem] leading-[1.1] font-semibold tracking-[-0.035em] text-cream transition-opacity duration-500 motion-reduce:transition-none sm:text-[2rem]',
          pinned && !active && 'opacity-45',
        )}
      >
        {step.title}
      </h3>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none',
          !pinned || active ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <p className="min-h-0 overflow-hidden">
          <span className="block max-w-sm pt-3 text-[1rem] leading-relaxed text-cream/70">
            {step.body}
          </span>
        </p>
      </div>
    </div>
  );
}

function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <CornerBrackets tone="dark" className="-inset-3" />
    </div>
  );
}

/** Segmented progress: one bar per step, filling with the scroll. */
function Segment({
  fill,
  step,
  active,
}: {
  fill: MotionValue<number>;
  step: Step;
  active: boolean;
}) {
  return (
    <div className="flex-1">
      <div className="h-[3px] overflow-hidden rounded-full bg-cream/15">
        <motion.span
          style={{ scaleX: fill }}
          className="block h-full origin-left rounded-full bg-accent-soft"
        />
      </div>
      <p className="mt-2.5 flex gap-2">
        <MonoLabel tone="dark">
          <span className={active ? 'text-accent-soft' : undefined}>{step.n}</span>
        </MonoLabel>
        <MonoLabel tone="dark">
          <span className={active ? 'text-cream' : undefined}>{step.label}</span>
        </MonoLabel>
      </p>
    </div>
  );
}

/** The section title; a size smaller while pinned, so the whole stage fits a laptop screen. */
function Headline({ compact = false }: { compact?: boolean }) {
  return (
    <h2
      id="how-title"
      className={cn(
        'leading-[1] font-semibold tracking-[-0.045em] text-balance text-cream',
        compact
          ? 'text-[clamp(2rem,0.5rem+2.6vw,3.25rem)]'
          : 'text-[clamp(2.25rem,1rem+3.6vw,4.25rem)]',
      )}
    >
      Three steps. One person decides.
    </h2>
  );
}

/** The pinned, scrubbed version for large screens. */
function PinnedStory() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setActive(Math.min(STEPS.length - 1, Math.max(0, Math.floor(value * STEPS.length))));
  });
  const fill0 = useTransform(scrollYProgress, [0, 1 / 3], [0, 1]);
  const fill1 = useTransform(scrollYProgress, [1 / 3, 2 / 3], [0, 1]);
  const fill2 = useTransform(scrollYProgress, [2 / 3, 1], [0, 1]);
  const watch = useTransform(scrollYProgress, [0, 1 / 3], [0, 1]);
  const fills = [fill0, fill1, fill2];

  const visuals = [
    <WatchVisual key="watch" progress={watch} />,
    <ExplainVisual key="explain" on={active >= 1} />,
    <DecideVisual key="decide" stamp={active === 2} />,
  ];

  return (
    <div ref={ref} className="relative h-[360vh]" data-shot-steps="3">
      <div className="sticky top-0 flex h-svh flex-col justify-center pt-20 pb-10">
        <PlateLine tone="night" index="05" title="How it works" note="Scroll to advance" />
        <div className="mt-10 grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-16">
          <div className="flex flex-col justify-between">
            <Headline compact />
            <ol className="mt-8 space-y-5">
              {STEPS.map((step, index) => (
                <li key={step.n} aria-current={index === active ? 'step' : undefined}>
                  <StepText step={step} active={index === active} pinned />
                </li>
              ))}
            </ol>
          </div>
          <Stage className="min-h-0">
            <span
              aria-hidden
              className="pointer-events-none absolute -top-2 -left-1 font-mono text-[9rem] leading-none font-medium tracking-[-0.06em] text-cream/[0.05]"
            >
              {STEPS[active]!.n}
            </span>
            {visuals.map((visual, index) => (
              <div
                key={index}
                aria-hidden={index !== active}
                className={cn(
                  'absolute inset-0 transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(.16,1,.3,1)]',
                  index === active
                    ? 'scale-100 opacity-100 blur-0'
                    : 'pointer-events-none scale-[0.97] opacity-0 blur-[6px]',
                )}
              >
                {visual}
              </div>
            ))}
          </Stage>
        </div>
        <div className="mt-10 flex items-end gap-6">
          {STEPS.map((step, index) => (
            <Segment key={step.n} step={step} fill={fills[index]!} active={index === active} />
          ))}
          <FigCaption index="05" tone="dark" className="shrink-0 pb-0.5 pl-6">
            Sample alert
          </FigCaption>
        </div>
      </div>
    </div>
  );
}

/** One step with its picture under it (phones, tablets and reduced motion). */
function FlowStep({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const seen = useInView(ref, { rootMargin: '0px 0px -20% 0px', once: true });
  const on = reduced || seen;
  return (
    <li className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
      <StepText step={step} active pinned={false} />
      <div ref={ref} className="mt-8 lg:mt-0">
        <Stage className={index === 0 ? 'h-[22rem]' : undefined}>
          {index === 0 && <WatchVisual progress={null} />}
          {index === 1 && <ExplainVisual on={on} />}
          {index === 2 && (
            <div className="pb-6">
              <DecideVisual stamp={on} />
            </div>
          )}
        </Stage>
      </div>
    </li>
  );
}

/** Night band: Watch → Explain → Decide. */
export function HowSection() {
  const desktop = useMinWidth(1024);
  const reduced = usePrefersReducedMotion();
  const pinned = desktop && !reduced;

  return (
    <Band tone="night" labelledBy="how-title" className={pinned ? undefined : 'py-20 sm:py-24'}>
      {pinned ? (
        <PinnedStory />
      ) : (
        <>
          <PlateLine tone="night" index="05" title="How it works" />
          <div className="mt-12">
            <Headline />
          </div>
          <ol className="mt-12 space-y-16">
            {STEPS.map((step, index) => (
              <FlowStep key={step.n} step={step} index={index} />
            ))}
          </ol>
          <FigCaption index="05" tone="dark" className="mt-12">
            Sample alert
          </FigCaption>
        </>
      )}
    </Band>
  );
}
