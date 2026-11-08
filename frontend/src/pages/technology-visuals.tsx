import { useRef } from 'react';
import { CountUp, useInView, usePrefersReducedMotion } from '@/components/motion';
import { ExampleTag } from '@/components/ui/layout';
import {
  PRIORITY,
  SCORE_SIGNALS,
  contribution,
  type ScoreSignal,
} from '@/components/visuals/score-data';
import { cn } from '@/lib/cn';

/*
 * The open "how we score" explanation on the How it works page: four named signals, each
 * scored 0 to 100 and weighted, then added into a priority. Every number is a sample value.
 * The bars fill, and the numbers count up, the first time the block scrolls into view.
 */

/**
 * One colour per signal, so a segment of the priority bar can be matched to its card.
 * `swatch` is for the light cards, `onDark` for the dark priority bar (ink would vanish there).
 */
const SEGMENT: Record<string, { swatch: string; onDark: string; label: string }> = {
  text: { swatch: 'bg-accent', onDark: 'bg-accent', label: 'Text' },
  visual: { swatch: 'bg-accent-soft', onDark: 'bg-accent-soft', label: 'Visual' },
  meaning: { swatch: 'bg-ink/70', onDark: 'bg-cream', label: 'Meaning' },
  context: { swatch: 'bg-line-strong', onDark: 'bg-cream/45', label: 'Context' },
};

function SignalCard({
  signal,
  shown,
  index,
}: {
  signal: ScoreSignal;
  shown: boolean;
  index: number;
}) {
  const swatch = SEGMENT[signal.id]?.swatch ?? 'bg-accent';
  return (
    <li className="flex flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-line">
      <p className="flex items-center gap-2 text-[13px] font-medium text-muted">
        <span aria-hidden className={cn('size-2.5 rounded-sm', swatch)} />
        {signal.label}
      </p>
      <p className="mt-4 flex items-baseline gap-1.5">
        <CountUp
          value={signal.value}
          className="text-[3.25rem] leading-none font-semibold tracking-[-0.04em] text-ink"
        />
        <span className="text-[14px] text-muted">out of 100</span>
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-cream-deep">
        <div
          className={cn(
            'h-full w-full rounded-full transition-transform duration-[1100ms] ease-out motion-reduce:transition-none',
            swatch,
          )}
          style={{
            transform: `translateX(${shown ? signal.value - 100 : -100}%)`,
            transitionDelay: `${index * 120}ms`,
          }}
        />
      </div>
      <p className="mt-4 text-[14.5px] leading-snug text-ink">{signal.plain}</p>
      <p className="mt-auto pt-4 text-[13px] text-muted">
        Weight in the priority: <span className="font-medium text-ink">{signal.weight}%</span>
      </p>
    </li>
  );
}

/** The four signals, the weights, and how they add up. */
export function HowWeScore() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { once: true, rootMargin: '0px 0px -12% 0px' });
  const shown = reduced || inView;
  return (
    <figure>
      <div ref={ref}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[13px] font-medium text-muted">
            Why <span className="font-mono text-ink">acrne-login.com</span> was flagged
          </p>
          <ExampleTag tone="light" />
        </div>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SCORE_SIGNALS.map((signal, index) => (
            <SignalCard key={signal.id} signal={signal} shown={shown} index={index} />
          ))}
        </ol>

        <div className="mt-4 rounded-2xl bg-night p-5 text-cream shadow-window ring-1 ring-ink/10 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="text-[13px] font-medium text-cream/70">
              Each score times its weight, added together
            </p>
            <p className="font-mono text-[15px] text-cream">
              {SCORE_SIGNALS.map((signal) => contribution(signal)).join(' + ')} ={' '}
              <span className="font-semibold text-accent-soft">{PRIORITY}</span>
            </p>
          </div>

          <div className="relative mt-5">
            <div
              className="flex h-3 overflow-hidden rounded-full bg-cream/10 transition-transform duration-[1200ms] ease-out motion-reduce:transition-none"
              style={{ transform: shown ? 'none' : 'scaleX(0.02)', transformOrigin: 'left' }}
            >
              {SCORE_SIGNALS.map((signal) => (
                <span
                  key={signal.id}
                  className={cn('h-full border-r border-night', SEGMENT[signal.id]?.onDark)}
                  style={{ width: `${contribution(signal)}%` }}
                />
              ))}
            </div>
            <span
              aria-hidden
              className="absolute -top-1.5 h-6 w-px bg-cream/70"
              style={{ left: '70%' }}
            />
          </div>
          <div className="relative mt-2 flex justify-between text-[11.5px] text-cream/65">
            <span>0</span>
            <span className="absolute -translate-x-1/2" style={{ left: '70%' }}>
              70: high
            </span>
            <span>100</span>
          </div>

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[12.5px] text-cream/75">
            {SCORE_SIGNALS.map((signal) => (
              <li key={signal.id} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn('size-2.5 rounded-sm', SEGMENT[signal.id]?.onDark)}
                />
                {SEGMENT[signal.id]?.label} adds {contribution(signal)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="mt-4 max-w-3xl text-[13px] leading-relaxed text-muted">
        Illustrative example with sample values. The weights belong to a sample workspace and a team
        can change them. The priority only decides what your team looks at first. It is never a
        legal finding, and a person makes every decision.
      </figcaption>
    </figure>
  );
}
