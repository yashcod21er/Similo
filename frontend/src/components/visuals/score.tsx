import { AppWindow } from '@/components/motion';
import { cn } from '@/lib/cn';
import { Chip, DecisionBar, SceneFigure, Show } from './scene-kit';
import { useSceneStep, WINDOW_BODY } from './scene-hooks';
import { PRIORITY, SCORE_SIGNALS, contribution } from './score-data';

/* "How we score" as a scene. The sample signals, weights and sums live in score-data.ts. */

function fillColour(value: number) {
  if (value >= 75) return 'bg-accent';
  if (value >= 50) return 'bg-accent-soft';
  return 'bg-cream/45';
}

/** The four signals as a table: score, weight and what each adds to the priority. */
export function ScoreTable({ shownCount, showTotal }: { shownCount: number; showTotal: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 pb-1 text-[10.5px] font-medium text-cream/60">
        <span>Signal, scored 0 to 100</span>
        <span className="hidden @md:block">Score × weight = adds</span>
      </div>
      <ul className="divide-y divide-white/[0.06]">
        {SCORE_SIGNALS.map((signal, index) => {
          const shown = index < shownCount;
          return (
            <li key={signal.id} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] text-cream/90">{signal.label}</span>
                <span
                  className="font-mono text-[12px] tabular-nums text-cream transition-opacity duration-500 motion-reduce:transition-none"
                  style={{ opacity: shown ? 1 : 0 }}
                >
                  {signal.value}
                  <span className="hidden text-cream/60 @md:inline">
                    {' '}
                    × {signal.weight}% = {contribution(signal)}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn(
                    'h-full w-full rounded-full transition-transform duration-[900ms] ease-out motion-reduce:transition-none',
                    fillColour(signal.value),
                  )}
                  style={{ transform: `translateX(${shown ? signal.value - 100 : -100}%)` }}
                />
              </div>
              <p className="mt-1 text-[11.5px] leading-snug text-cream/60">{signal.plain}</p>
            </li>
          );
        })}
      </ul>
      <Show
        when={showTotal}
        className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[0.05] px-3 py-2.5 ring-1 ring-white/[0.08]"
      >
        <p className="text-[12px] text-cream/80">
          Priority{' '}
          <span className="font-mono text-cream">
            {SCORE_SIGNALS.map((signal) => contribution(signal)).join(' + ')} = {PRIORITY}
          </span>
        </p>
        <Chip level="high">High: 70 or more</Chip>
      </Show>
    </div>
  );
}

const STEP_COUNT = 9;

/** The How it works hero scene: why an alert was flagged, signal by signal. */
export function ScoreScene() {
  const { ref, step } = useSceneStep(STEP_COUNT, 1250);
  const shownCount = Math.min(step + 1, SCORE_SIGNALS.length);
  const stage = step >= 7 ? 2 : step >= 6 ? 1 : 0;
  return (
    <SceneFigure label="Illustrative example: an alert explained. Four separate signals (text similarity, visual similarity, meaning similarity and registration context) are each scored from 0 to 100, weighted and added into a priority, and then a person reviews it.">
      <AppWindow
        tone="dark"
        title="Why was this flagged?"
        url="app.similo.example/alerts/acrne-login.com"
      >
        <div ref={ref} className={cn(WINDOW_BODY, 'p-4 @lg:p-5')}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
            <p className="truncate font-mono text-[14px] font-medium text-cream">acrne-login.com</p>
            <Chip level={step >= 5 ? 'high' : 'neutral'}>
              {step >= 5 ? 'High priority' : 'Scoring'}
            </Chip>
          </div>
          <div className="mt-2">
            <ScoreTable shownCount={shownCount} showTotal={step >= 4} />
          </div>
          <div className="mt-3">
            <DecisionBar stage={stage} />
          </div>
        </div>
      </AppWindow>
    </SceneFigure>
  );
}
