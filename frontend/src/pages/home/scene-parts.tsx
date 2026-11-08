import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/*
 * Small pieces shared by the home page's product scenes. They only move with opacity and
 * transform, and every transition is switched off with reduced motion (the scenes then
 * show their finished state, see useLoop).
 */

const TRANSITION =
  'transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none';

/** Fades and lifts its children in when `on` turns true. Keeps its space either way. */
export function Appear({
  on,
  delay = 0,
  className,
  children,
  as: Tag = 'div',
}: {
  on: boolean;
  delay?: number;
  className?: string;
  children: ReactNode;
  as?: 'div' | 'li' | 'span' | 'p';
}) {
  const style: CSSProperties | undefined =
    on && delay ? { transitionDelay: `${delay}ms` } : undefined;
  return (
    <Tag
      style={style}
      className={cn(
        TRANSITION,
        on ? 'translate-y-0 opacity-100' : 'translate-y-1.5 opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

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

/**
 * A tiny drawing of a sign-in page, used to show visual similarity: the original and the
 * copy are drawn from the same parts, with small differences in the copy.
 */
export function MiniSignIn({
  copy = false,
  tone = 'dark',
  className,
}: {
  copy?: boolean;
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const dark = tone === 'dark';
  const line = dark ? 'bg-cream/20' : 'bg-ink/15';
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-md p-2.5',
        dark ? 'bg-[#f3ece1]' : 'bg-white ring-1 ring-line',
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <span className={cn('size-2 rounded-[3px] bg-accent', copy && 'translate-x-px')} />
        <span className={cn('h-1 w-6 rounded-full', dark ? 'bg-ink/50' : 'bg-ink/50')} />
      </div>
      <div className="mx-auto mt-2 w-[72%]">
        <span className={cn('mx-auto block h-1.5 w-1/2 rounded-full', dark ? 'bg-ink/60' : line)} />
        <span className="mt-1.5 block h-2.5 rounded-sm bg-ink/10 ring-1 ring-ink/10" />
        <span className="mt-1 block h-2.5 rounded-sm bg-ink/10 ring-1 ring-ink/10" />
        <span
          className={cn('mt-1.5 block h-2.5 rounded-sm', copy ? 'bg-[#cf5a12]' : 'bg-accent')}
        />
      </div>
    </div>
  );
}

/** Small status chip used in the scenes. */
export function StatusChip({
  tone,
  children,
  className,
}: {
  tone: 'high' | 'medium' | 'low' | 'review' | 'approved';
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1',
        tone === 'high' && 'bg-accent/15 text-accent-soft ring-accent/30',
        tone === 'medium' && 'bg-cream/[0.07] text-cream/80 ring-cream/15',
        tone === 'low' && 'bg-transparent text-cream/65 ring-cream/10',
        tone === 'review' && 'bg-cream/[0.07] text-cream ring-cream/20',
        tone === 'approved' && 'bg-accent-soft text-night ring-accent-soft',
        className,
      )}
    >
      {children}
    </span>
  );
}
