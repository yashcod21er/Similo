import { useRef } from 'react';
import { useInView, usePrefersReducedMotion } from '@/components/motion';
import { NumberRoll } from '@/components/scenes';
import { FigCaption, MonoLabel } from '@/components/ui/specimen';
import {
  PRIORITY,
  SCORE_SIGNALS,
  contribution,
  type ScoreSignal,
} from '@/components/visuals/score-data';
import { cn } from '@/lib/cn';

/*
 * The open "how we score" exhibit on the How it works page: four named signals, each scored
 * 0 to 100 and weighted, then added into a priority. Every number is a sample value, said once
 * in the FIG. caption. The numbers roll and the bars fill the first time the block scrolls
 * into view. It is a ledger of big numbers, not an app window.
 */

/** One colour per signal, so a segment of the priority bar matches its column. */
const SEGMENT: Record<string, { swatch: string; label: string }> = {
  text: { swatch: 'bg-accent', label: 'Text' },
  visual: { swatch: 'bg-accent-soft', label: 'Visual' },
  meaning: { swatch: 'bg-ink/70', label: 'Meaning' },
  context: { swatch: 'bg-line-strong', label: 'Context' },
};

function SignalColumn({
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
    <li className="flex flex-col bg-cream p-6 transition-colors duration-200 hover:bg-white lg:p-7">
      <p className="flex items-center gap-2">
        <span aria-hidden className={cn('size-2 shrink-0', swatch)} />
        <MonoLabel>{signal.label}</MonoLabel>
      </p>
      <p className="mt-6 flex items-baseline gap-2 text-ink">
        <NumberRoll
          value={signal.value}
          className="text-[clamp(4rem,2.4rem+4vw,5.75rem)] leading-[0.85] font-semibold tracking-[-0.06em]"
        />
        <MonoLabel>/ 100</MonoLabel>
      </p>
      <div className="mt-5 h-px bg-line-strong">
        <div
          className={cn(
            'h-[3px] w-full origin-left -translate-y-px transition-transform duration-[1100ms] ease-out motion-reduce:transition-none',
            swatch,
          )}
          style={{
            transform: `scaleX(${shown ? signal.value / 100 : 0.02})`,
            transitionDelay: `${index * 120}ms`,
          }}
        />
      </div>
      <p className="mt-5 text-[15px] leading-snug text-ink">{signal.plain}</p>
      <p className="mt-auto pt-5">
        <MonoLabel>
          Weight <span className="text-ink">{signal.weight}%</span>
        </MonoLabel>
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
        <p className="mb-5 flex items-center gap-2">
          <span aria-hidden className="size-1.5 bg-accent" />
          <MonoLabel>
            Exhibit · why <span className="text-ink normal-case">acrne-login.com</span> was flagged
          </MonoLabel>
        </p>
        <ol className="grid grid-cols-1 gap-px overflow-hidden border border-line-strong bg-line-strong sm:grid-cols-2 lg:grid-cols-4">
          {SCORE_SIGNALS.map((signal, index) => (
            <SignalColumn key={signal.id} signal={signal} shown={shown} index={index} />
          ))}
        </ol>

        <div className="mt-8 grid grid-cols-1 items-end gap-x-12 gap-y-6 lg:grid-cols-[auto_minmax(0,1fr)]">
          <p className="flex items-baseline gap-4">
            <span className="text-[clamp(4.5rem,2.5rem+5vw,7rem)] leading-[0.82] font-semibold tracking-[-0.065em] text-accent">
              <NumberRoll value={PRIORITY} />
            </span>
            <MonoLabel>Priority, out of 100</MonoLabel>
          </p>
          <div>
            <p className="font-mono text-[13px] text-ink">
              {SCORE_SIGNALS.map((signal) => contribution(signal)).join(' + ')} ={' '}
              <span className="font-semibold text-accent-ink">{PRIORITY}</span>
            </p>
            <div className="relative mt-3">
              <div
                className="flex h-3 overflow-hidden bg-cream-deep transition-transform duration-[1200ms] ease-out motion-reduce:transition-none"
                style={{ transform: shown ? 'none' : 'scaleX(0.02)', transformOrigin: 'left' }}
              >
                {SCORE_SIGNALS.map((signal) => (
                  <span
                    key={signal.id}
                    className={cn('h-full border-r border-cream', SEGMENT[signal.id]?.swatch)}
                    style={{ width: `${contribution(signal)}%` }}
                  />
                ))}
              </div>
              <span
                aria-hidden
                className="absolute -top-1.5 h-6 w-px bg-ink"
                style={{ left: '70%' }}
              />
            </div>
            <div className="relative mt-2 flex justify-between">
              <MonoLabel>0</MonoLabel>
              <span className="absolute -translate-x-1/2" style={{ left: '70%' }}>
                <MonoLabel>70 · high</MonoLabel>
              </span>
              <MonoLabel>100</MonoLabel>
            </div>
            <p className="mt-3 text-[13px] text-muted">
              Each score times its weight, added together.
            </p>
          </div>
        </div>
      </div>
      <FigCaption as="figcaption" index="02" className="mt-8 max-w-3xl leading-relaxed">
        Sample values in a sample workspace. A team can change the weights. The priority only
        decides what is looked at first; it is never a legal finding.
      </FigCaption>
    </figure>
  );
}
