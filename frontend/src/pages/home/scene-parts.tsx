import { cn } from '@/lib/cn';

/*
 * A small piece of the home page's product card (HowSection, step 2). It only moves with
 * transform and opacity, and every transition is switched off with reduced motion.
 */

const TRANSITION =
  'transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none';

/**
 * A named similarity signal: label, a bar that fills (scaleX) and its score out of 100.
 * Scores are always named — never one unlabelled number.
 */
export function SignalMeter({
  label,
  hint,
  value,
  on,
  delay = 0,
  tone = 'dark',
}: {
  label: string;
  hint?: string;
  value: number;
  on: boolean;
  delay?: number;
  tone?: 'dark' | 'light';
}) {
  const dark = tone === 'dark';
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
      <p className={cn('truncate text-[12.5px]', dark ? 'text-cream/80' : 'text-ink/80')}>
        <span className="font-medium">{label}</span>
        {hint && <span className={dark ? 'text-cream/65' : 'text-muted'}> · {hint}</span>}
      </p>
      <p
        style={on ? { transitionDelay: `${delay + 350}ms` } : undefined}
        className={cn(
          'font-mono text-[12px] tabular-nums',
          TRANSITION,
          dark ? 'text-cream' : 'text-ink',
          on ? 'opacity-100' : 'opacity-0',
        )}
      >
        {value}
        <span className={dark ? 'text-cream/65' : 'text-muted'}>/100</span>
      </p>
      <div
        className={cn(
          'col-span-2 h-1.5 overflow-hidden rounded-full',
          dark ? 'bg-cream/[0.08]' : 'bg-cream-deep',
        )}
      >
        <div
          style={{
            transform: `scaleX(${on ? value / 100 : 0})`,
            transitionDelay: on ? `${delay}ms` : '0ms',
          }}
          className="h-full origin-left rounded-full bg-linear-to-r from-accent to-accent-soft transition-transform duration-700 ease-out motion-reduce:transition-none"
        />
      </div>
    </div>
  );
}
