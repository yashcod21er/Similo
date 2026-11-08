import { Check, FileImage, FileText, Globe, Smartphone, Stamp, UserCheck } from 'lucide-react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Section } from '@/components/marketing/sections';
import { ExampleTag, SectionHeading, Stage } from '@/components/ui/layout';
import { AlertCard } from '@/components/visuals/AlertCard';
import { cn } from '@/lib/cn';
import { EASE_OUT } from '@/lib/motion';

const STEP_SECONDS = 6;

/* ------------------------------------------------------------- Visuals */

function VisualFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[12px] tracking-[0.08em] text-white/55 uppercase">{label}</p>
        <ExampleTag />
      </div>
      <div className="flex flex-1 items-center justify-center py-6">{children}</div>
    </div>
  );
}

const FEED = [
  { icon: Globe, kind: 'New website registered', name: 'acme-login.com' },
  { icon: Smartphone, kind: 'New app listed', name: 'Acme Pro' },
  { icon: Stamp, kind: 'Trademark journal published', name: 'Journal 2214 · 412 pages' },
  { icon: Globe, kind: 'New website registered', name: 'acme-help.net' },
];

function WatchVisual() {
  return (
    <VisualFrame label="What Similo sees">
      <ul className="w-full max-w-md space-y-2.5">
        {FEED.map((item, index) => (
          <motion.li
            key={item.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.1 + index * 0.18 }}
            className="flex items-center gap-3.5 rounded-2xl bg-white/[0.05] p-3.5 ring-1 ring-white/10"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-coral">
              <item.icon aria-hidden className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] text-white/55">{item.kind}</span>
              <span className="block truncate font-mono text-[15px] text-white">{item.name}</span>
            </span>
          </motion.li>
        ))}
      </ul>
    </VisualFrame>
  );
}

function CheckVisual() {
  const rows = [
    { label: 'Spelling', value: 'Very close', width: '88%' },
    { label: 'Sound', value: 'The same', width: '100%' },
    { label: 'Logo', value: 'Similar', width: '72%' },
  ];
  return (
    <VisualFrame label="Compared with your brand">
      <div className="w-full max-w-md">
        <div className="grid grid-cols-[90px_1fr] items-baseline gap-y-2 font-mono">
          <span className="text-[12px] text-white/50 uppercase">Yours</span>
          <span className="text-4xl tracking-[-0.02em] text-white sm:text-5xl">acme</span>
          <span className="text-[12px] text-white/50 uppercase">Found</span>
          <span className="text-4xl tracking-[-0.02em] text-white sm:text-5xl">
            ac<mark className="rounded bg-crimson/30 px-0.5 text-coral">rn</mark>e
          </span>
        </div>
        <p className="mt-3 pl-[90px] text-sm text-coral">“rn” looks like “m”</p>
        <div className="mt-8 space-y-4">
          {rows.map((row, index) => (
            <div key={row.label}>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/60">{row.label}</span>
                <span className="font-medium text-white">{row.value}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-coral to-crimson"
                  initial={{ width: 0 }}
                  animate={{ width: row.width }}
                  transition={{ duration: 1, ease: EASE_OUT, delay: 0.2 + index * 0.15 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </VisualFrame>
  );
}

function ExplainVisual() {
  return (
    <VisualFrame label="The alert your team gets">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="w-full max-w-sm"
      >
        <AlertCard
          tone="dark"
          example={false}
          kind="website"
          name="acme-login.com"
          facts={[
            'Uses your brand name with “login”',
            'Registered 2 days ago',
            'Has a password form like yours',
          ]}
          level="high"
        />
      </motion.div>
    </VisualFrame>
  );
}

function DecideVisual() {
  const evidence = [
    { icon: FileImage, label: 'Screenshot of the page' },
    { icon: FileText, label: 'Registration record' },
    { icon: Check, label: 'Fingerprint saved — can’t be changed later' },
  ];
  return (
    <VisualFrame label="Your team decides">
      <div className="w-full max-w-md rounded-2xl bg-white/[0.05] p-5 ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate font-mono text-[16px] text-white">acme-login.com</p>
          <span className="rounded-full bg-crimson/20 px-2.5 py-1 text-[12px] font-semibold text-coral">
            High risk
          </span>
        </div>
        <ul className="mt-4 space-y-2">
          {evidence.map((item) => (
            <li key={item.label} className="flex items-center gap-2.5 text-[14px] text-white/75">
              <item.icon aria-hidden className="size-4 text-coral" />
              {item.label}
            </li>
          ))}
        </ul>
        <div aria-hidden className="mt-5 grid grid-cols-2 gap-2">
          <span className="flex h-10 items-center justify-center rounded-full bg-crimson text-[13.5px] font-medium text-white">
            Draft takedown request
          </span>
          <span className="flex h-10 items-center justify-center rounded-full bg-white/[0.07] text-[13.5px] font-medium text-white ring-1 ring-white/15">
            Mark as safe
          </span>
        </div>
        <p className="mt-4 flex items-center gap-2 text-[13px] text-white/55">
          <UserCheck aria-hidden className="size-4 shrink-0" />
          Nothing is sent until someone on your team approves it.
        </p>
      </div>
    </VisualFrame>
  );
}

/* --------------------------------------------------------------- Steps */

const STEPS = [
  {
    title: 'Watch',
    text: 'Similo keeps an eye on newly registered websites, new app store listings and official trademark journals.',
    visual: <WatchVisual />,
  },
  {
    title: 'Check',
    text: 'Each new name, logo and page is compared with your brand — how it is spelled, how it sounds and how it looks.',
    visual: <CheckVisual />,
  },
  {
    title: 'Explain',
    text: 'Anything suspicious gets a risk level and the reasons behind it, written so anyone on your team can follow.',
    visual: <ExplainVisual />,
  },
  {
    title: 'You decide',
    text: 'Your team reviews the evidence and chooses what to do. Nothing is sent or taken down without a person approving it.',
    visual: <DecideVisual />,
  },
];

/**
 * 02 — How it works: a vertical tab list that advances on its own while it is
 * on screen. Hovering or focusing it pauses; with reduced motion it never
 * advances by itself. Arrow keys move between steps.
 */
export function HowItWorks() {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inView = useInView(rootRef, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const autoplay = inView && !paused && !reduceMotion;

  const select = (index: number) => {
    const next = (index + STEPS.length) % STEPS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      select(active + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      select(active - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      select(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      select(STEPS.length - 1);
    }
  };

  const current = STEPS[active]!;

  return (
    <Section tone="white">
      <SectionHeading
        align="split"
        index="02"
        eyebrow="How it works"
        title={
          <>
            Four steps. You stay in <em className="text-crimson">control</em>.
          </>
        }
        description="Similo does the watching and the comparing. Your team makes the decisions."
      />

      <div
        ref={rootRef}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
        className="mt-14 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10"
      >
        <div role="tablist" aria-orientation="vertical" aria-label="How Similo works">
          {STEPS.map((step, index) => {
            const selected = index === active;
            return (
              <button
                key={step.title}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                role="tab"
                id={`${baseId}-tab-${index}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                onKeyDown={onKeyDown}
                className={cn(
                  'group relative block w-full border-t border-line py-6 text-left transition-colors first:border-t-0 first:pt-0 lg:first:pt-6 lg:first:border-t',
                )}
              >
                <span className="flex items-baseline gap-4">
                  <span
                    className={cn(
                      'font-mono text-[13px] font-medium transition-colors',
                      selected ? 'text-crimson-dark' : 'text-muted',
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span
                      className={cn(
                        'text-title block font-semibold transition-colors',
                        selected ? 'text-ink' : 'text-ink/65 group-hover:text-ink/85',
                      )}
                    >
                      {step.title}
                    </span>
                    <span
                      className={cn(
                        'mt-2 block max-w-md leading-relaxed transition-colors',
                        'text-muted',
                      )}
                    >
                      {step.text}
                    </span>
                  </span>
                </span>
                {/* Progress: fills while this step is showing, then moves on. */}
                {selected && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -top-px block h-0.5 overflow-hidden bg-transparent"
                  >
                    <motion.span
                      key={`${active}-${autoplay}`}
                      className="block h-full origin-left bg-crimson"
                      initial={{ scaleX: autoplay ? 0 : 1 }}
                      animate={{ scaleX: 1 }}
                      transition={
                        autoplay ? { duration: STEP_SECONDS, ease: 'linear' } : { duration: 0 }
                      }
                      onAnimationComplete={() => {
                        if (autoplay) setActive((value) => (value + 1) % STEPS.length);
                      }}
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${active}`}>
          <Stage className="h-full">
            <div
              aria-hidden
              className="bg-dots-dark mask-radial absolute inset-0 -z-10 opacity-60"
            />
            <div
              aria-hidden
              className="absolute -right-24 -bottom-24 -z-10 size-80 rounded-full bg-crimson/35 blur-[100px]"
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="min-h-[440px] sm:min-h-[480px]"
              >
                {current.visual}
              </motion.div>
            </AnimatePresence>
          </Stage>
        </div>
      </div>
    </Section>
  );
}
