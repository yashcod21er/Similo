import { CalendarClock, Layers3 } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { AppWindow } from '@/components/motion';
import { cn } from '@/lib/cn';
import { Chip, DecisionBar, PaneLabel, SceneFigure, Show, SignalBar } from './scene-kit';
import { useCountdown, usePanelShown, useSceneStep, WINDOW_BODY } from './scene-hooks';

/*
 * Trademark Intelligence scenes. Sample mark "ACME"; the filing, applicant, numbers and
 * dates are made up. Offices and periods in OppositionWindows are real, general facts.
 */

const WINDOW_DAYS = 120;
const DAYS_LEFT = 18;

/* ---------------------------------------------------------------- Deadline */

/** "18 days left to object": the number counts down while the window bar fills. */
export function DeadlineBanner({ active }: { active: boolean }) {
  const days = useCountdown(WINDOW_DAYS, DAYS_LEFT, active);
  const elapsed = ((WINDOW_DAYS - DAYS_LEFT) / WINDOW_DAYS) * 100;
  return (
    <div className="rounded-xl bg-accent/[0.1] p-3.5 ring-1 ring-accent/40">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11.5px] text-cream/75">
            <CalendarClock aria-hidden className="size-3.5 text-accent-soft" />
            Time left to object
          </p>
          <p className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.03em] text-cream">
            <span className="inline-block min-w-[2.2ch] tabular-nums">{days}</span>{' '}
            <span className="text-[14px] font-medium text-cream/65">days</span>
          </p>
        </div>
        <p className="pb-0.5 text-right text-[11px] leading-snug text-cream/60">
          Counted from the
          <br />
          journal publication date
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full w-full rounded-full bg-linear-to-r from-accent-soft to-accent transition-transform duration-[1400ms] ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${active ? elapsed - 100 : -100}%)` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Journal page */

/** A scanned journal page drawn in shapes, with one entry highlighted. */
export function JournalPage({ found, className }: { found: boolean; className?: string }) {
  return (
    <div className={cn('rounded-lg bg-cream p-3 text-ink', className)}>
      <p className="flex items-center justify-between gap-2 border-b border-ink/15 pb-2 text-[10px] font-medium text-muted">
        <span>Trade Marks Journal · issue 2041</span>
        <span className="font-mono">page 188</span>
      </p>
      <div aria-hidden className="mt-2.5 space-y-1.5">
        <div className="h-1.5 w-[88%] rounded bg-ink/15" />
        <div className="h-1.5 w-[62%] rounded bg-ink/15" />
      </div>
      <div className="relative mt-3 overflow-hidden rounded px-2 py-1.5">
        <span
          aria-hidden
          className="absolute inset-0 origin-left rounded bg-accent/20 ring-1 ring-accent/50 transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{ transform: found ? 'scaleX(1)' : 'scaleX(0)' }}
        />
        <p className="relative text-[12px] leading-snug font-semibold">ACMEE</p>
        <p className="relative text-[10px] leading-snug text-ink/75">
          Class 9 · Acmee Ventures Pvt Ltd · No. 5918472
        </p>
      </div>
      <div aria-hidden className="mt-3 space-y-1.5">
        <div className="h-1.5 w-[75%] rounded bg-ink/15" />
        <div className="h-1.5 w-[92%] rounded bg-ink/15" />
        <div className="h-1.5 w-[48%] rounded bg-ink/15" />
      </div>
    </div>
  );
}

/** Your registered mark. */
export function YourMarkCard({ shown }: { shown: boolean }) {
  return (
    <Show when={shown} y={10}>
      <div className="rounded-lg bg-white/[0.035] p-3 ring-1 ring-white/[0.07]">
        <p className="text-[10.5px] font-medium text-cream/60">Your registered mark</p>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent-soft to-accent text-[15px] font-bold text-white"
          >
            A
          </span>
          <div>
            <p className="text-[15px] leading-none font-semibold tracking-[0.04em] text-cream">
              ACME
            </p>
            <p className="mt-1 text-[10.5px] text-cream/60">No. 1234567 · registered</p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-cream/60">
          Classes
          <Chip level="medium">9</Chip>
          <Chip level="neutral">42</Chip>
        </p>
      </div>
    </Show>
  );
}

/* ----------------------------------------------------------------- Signals */

/** Sounds alike, looks alike, same class: three separate named results. */
export function TrademarkSignals({ shownCount }: { shownCount: number }) {
  return (
    <div className="space-y-3">
      <SignalBar
        label="Sounds alike"
        value={92}
        shown={shownCount >= 1}
        note="Same phonetic key: AKM = AKM"
      />
      <SignalBar
        label="Looks alike"
        value={83}
        shown={shownCount >= 2}
        delay={120}
        note="Spelling differs by one added letter"
      />
      <Show when={shownCount >= 3} y={5}>
        <div className="flex items-center justify-between gap-3 text-[12.5px]">
          <span className="text-cream/85">Same product class</span>
          <Chip level="high">Class 9 overlaps</Chip>
        </div>
      </Show>
    </div>
  );
}

/** The 45 Nice classes, with the overlap lit. */
export function ClassGrid({ shown }: { shown: boolean }) {
  const yours = new Set([9, 42]);
  const theirs = new Set([9, 35]);
  return (
    <div>
      <div className="grid grid-cols-9 gap-1">
        {Array.from({ length: 45 }, (_, index) => index + 1).map((value) => {
          const mine = yours.has(value);
          const other = theirs.has(value);
          return (
            <span
              key={value}
              className={cn(
                'flex aspect-square items-center justify-center rounded font-mono text-[9.5px] transition-colors duration-500 motion-reduce:transition-none',
                shown && mine && other
                  ? 'bg-accent font-semibold text-white'
                  : shown && mine
                    ? 'bg-cream/25 text-cream'
                    : shown && other
                      ? 'bg-accent-soft/30 text-cream'
                      : 'bg-white/[0.045] text-cream/60',
              )}
            >
              {value}
            </span>
          );
        })}
      </div>
      <p className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[10.5px] text-cream/65">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-sm bg-cream/25" /> Your classes
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-sm bg-accent-soft/50" /> Their classes
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-sm bg-accent" /> Both
        </span>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- Hero scene */

const STEP_COUNT = 10;

/** The Trademark page's hero scene. */
export function TrademarkScene({
  tone = 'dark',
  index,
}: {
  /** The band the scene sits on (sets the caption colour; the window stays dark). */
  tone?: 'light' | 'dark';
  index?: string;
} = {}) {
  const { ref, step } = useSceneStep(STEP_COUNT, 1150);
  const signals = step >= 3 ? Math.min(step - 2, 3) : 0;
  const stage = step >= 8 ? 2 : step >= 7 ? 1 : 0;
  return (
    <SceneFigure
      tone={tone}
      {...(index ? { index } : {})}
      label="Illustrative example: a new entry in a trademark journal compared with your registered mark, with separate sounds-alike and looks-alike scores and a same-class check, and an opposition deadline counting down."
    >
      <AppWindow tone="dark" title="Trademark watch" url="app.similo.example/trademarks">
        <div ref={ref} className={cn(WINDOW_BODY, 'space-y-4 p-4 @lg:p-5')}>
          <Show when={step >= 2} y={6}>
            <DeadlineBanner active={step >= 2} />
          </Show>
          <div className="grid grid-cols-1 gap-3 @lg:grid-cols-[1.25fr_1fr]">
            <div>
              <PaneLabel>New in the journal</PaneLabel>
              <Show when={step >= 0} y={8} className="mt-2.5">
                <JournalPage found={step >= 1} />
              </Show>
            </div>
            <div>
              <PaneLabel>Compared with</PaneLabel>
              <div className="mt-2.5">
                <YourMarkCard shown={step >= 2} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 @lg:grid-cols-[1.15fr_1fr]">
            <div>
              <PaneLabel>Signals</PaneLabel>
              <div className="mt-2.5">
                <TrademarkSignals shownCount={signals} />
              </div>
            </div>
            <div className="@lg:pt-6">
              <DecisionBar
                stage={stage}
                approvedLabel="Opposition notes approved"
                approvedNote="Approved by the legal reviewer. Your attorney decides whether to file."
              />
            </div>
          </div>
        </div>
      </AppWindow>
    </SceneFigure>
  );
}

/* ----------------------------------------------------------- Story panels */

function StoryWindow({
  title,
  url,
  children,
}: {
  title: string;
  url: string;
  children: ReactNode;
}) {
  return (
    <AppWindow tone="dark" title={title} url={url}>
      <div className={cn(WINDOW_BODY, 'p-4 @lg:p-5')}>{children}</div>
    </AppWindow>
  );
}

/** Step 1: a scanned journal page being read. */
export function TmReadPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: a scanned page of a trademark journal, read automatically, with one new application picked out and its page number kept.">
      <div ref={ref}>
        <StoryWindow title="Journal reader" url="app.similo.example/trademarks/journals/2041">
          <div className="grid grid-cols-1 items-center gap-4 @lg:grid-cols-[1.2fr_1fr]">
            <JournalPage found={shown} />
            <ul className="space-y-2 text-[12px] text-cream/80">
              {[
                'Scanned pages are read automatically',
                'Every entry keeps its page number',
                'Hard-to-read entries are flagged for a person',
              ].map((line, index) => (
                <Show
                  key={line}
                  as="li"
                  when={shown}
                  delay={250 + index * 120}
                  y={6}
                  className="flex gap-2"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent-soft"
                  />
                  {line}
                </Show>
              ))}
            </ul>
          </div>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 2: the entry turned into a tidy record. */
export function TmRecordPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  const rows: [string, string][] = [
    ['Mark', 'ACMEE'],
    ['Applicant', 'Acmee Ventures Pvt Ltd'],
    ['Product class', '9'],
    ['Application no.', '5918472'],
    ['Source', 'Journal 2041, page 188'],
  ];
  return (
    <SceneFigure label="Illustrative example: a journal entry turned into a tidy record with the mark, applicant, product class and source page.">
      <div ref={ref}>
        <StoryWindow title="Record" url="app.similo.example/trademarks/5918472">
          <PaneLabel aside={<Chip level="neutral">Read from the journal</Chip>}>
            Filing record
          </PaneLabel>
          <dl className="mt-2 divide-y divide-white/[0.06]">
            {rows.map(([label, value], index) => (
              <Show
                key={label}
                when={shown}
                delay={index * 110}
                y={5}
                className="flex items-baseline justify-between gap-4 py-2 text-[12.5px]"
              >
                <dt className="text-cream/60">{label}</dt>
                <dd
                  className={cn(
                    'font-medium',
                    index === 0 ? 'font-mono text-cream' : 'text-cream/90',
                  )}
                >
                  {value}
                </dd>
              </Show>
            ))}
          </dl>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 3: compared with your marks, in separate ways. */
export function TmComparePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: the new mark compared with your mark for sound and spelling, with the overlapping product class highlighted among the 45 classes.">
      <div ref={ref}>
        <StoryWindow title="Compare" url="app.similo.example/trademarks/5918472/compare">
          <div className="grid grid-cols-2 gap-2 text-center font-semibold tracking-[0.04em]">
            <p className="rounded-lg bg-white/[0.035] py-2 text-[15px] text-cream ring-1 ring-white/[0.07]">
              ACME
            </p>
            <p className="rounded-lg bg-accent/[0.12] py-2 text-[15px] text-cream ring-1 ring-accent/50">
              ACME<span className="text-accent-soft">E</span>
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-5 @lg:grid-cols-[1.1fr_1fr]">
            <TrademarkSignals shownCount={shown ? 3 : 0} />
            <ClassGrid shown={shown} />
          </div>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 4: the clock, and a person decides. */
export function TmDecidePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: an opposition deadline counting down, with draft opposition notes waiting for a legal reviewer to approve.">
      <div ref={ref}>
        <StoryWindow title="Decide" url="app.similo.example/trademarks/5918472/decide">
          <DeadlineBanner active={shown} />
          <div className="mt-4">
            <DecisionBar
              stage={shown ? 2 : 1}
              approvedLabel="Opposition notes approved"
              approvedNote="Approved by the legal reviewer. Your attorney decides whether to file."
            />
          </div>
          <p className="mt-3 text-[11.5px] leading-snug text-cream/60">
            Similo can draft notes for your legal team. It never files anything.
          </p>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/* ------------------------------------------------------ Opposition periods */

const WINDOWS = [
  { office: 'India', body: 'Trade Marks Registry', days: 120, label: '4 months' },
  { office: 'European Union', body: 'EUIPO', days: 90, label: '3 months' },
  { office: 'United States', body: 'USPTO', days: 30, label: '30 days, can be extended' },
];

/** Light card: how long each office gives you to object. General facts, not sample data. */
export function OppositionWindows({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <div
      ref={ref}
      className={cn('rounded-2xl bg-white p-6 shadow-card ring-1 ring-line', className)}
    >
      <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
        <Layers3 aria-hidden className="size-4 text-accent-ink" />
        How long you have to object after publication
      </p>
      <ul className="mt-5 space-y-4">
        {WINDOWS.map((period, index) => (
          <li key={period.office}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold tracking-[-0.01em]">
                {period.office}{' '}
                <span className="text-[13px] font-normal text-muted">· {period.body}</span>
              </span>
              <span className="shrink-0 font-mono text-[12.5px] text-ink">{period.label}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-deep">
              <div
                className="h-full w-full rounded-full bg-linear-to-r from-accent-soft to-accent transition-transform duration-[1100ms] ease-out motion-reduce:transition-none"
                style={{
                  transform: `translateX(${shown ? (period.days / 120) * 100 - 100 : -100}%)`,
                  transitionDelay: `${index * 150}ms`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[12.5px] leading-relaxed text-muted">
        Periods as set by each office’s rules. Always confirm the exact deadline with your trademark
        attorney.
      </p>
    </div>
  );
}
