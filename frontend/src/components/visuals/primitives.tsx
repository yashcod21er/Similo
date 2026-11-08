import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ExampleTag } from '@/components/ui/layout';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';

/** Dark "product window" frame used by every product preview on the site. */
export function ProductWindow({
  title,
  children,
  className,
  action,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-midnight text-white ring-1 ring-ink/10',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="size-2 shrink-0 rounded-full bg-crimson" />
          <p className="truncate font-mono text-[12px] text-white/70">{title}</p>
        </div>
        {action ?? <ExampleTag />}
      </div>
      {children}
    </div>
  );
}

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

const RISK_STYLES: Record<RiskLevel, { bar: string; text: string; label: string }> = {
  critical: { bar: 'bg-crimson', text: 'text-crimson-dark', label: 'Critical' },
  high: { bar: 'bg-coral', text: 'text-coral', label: 'High' },
  medium: { bar: 'bg-amber-400', text: 'text-amber-300', label: 'Medium' },
  low: { bar: 'bg-emerald-400', text: 'text-emerald-300', label: 'Low' },
};

/** Animated horizontal score bar (0–100) that fills when scrolled into view. */
export function ScoreBar({
  value,
  level,
  className,
  delay = 0,
}: {
  value: number;
  level: RiskLevel;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={cn('h-1.5 overflow-hidden rounded-full bg-white/10', className)}>
      <motion.div
        className={cn('h-full rounded-full', RISK_STYLES[level].bar)}
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: EASE_OUT, delay }}
      />
    </div>
  );
}

export function RiskPill({ level, score }: { level: RiskLevel; score?: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 font-mono text-[10.5px] font-medium ring-1 ring-white/10',
        RISK_STYLES[level].text,
      )}
    >
      {score !== undefined && <span>{score}</span>}
      {RISK_STYLES[level].label}
    </span>
  );
}

/** "label ........ value" row used in signal lists. */
export function SignalRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-[12.5px]">
      <span className="text-white/55">{label}</span>
      <span className={cn('font-mono text-right', emphasis ? 'text-coral' : 'text-white/90')}>
        {value}
      </span>
    </div>
  );
}

export function ReasonCode({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-crimson/40 bg-crimson/10 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-coral">
      {children}
    </span>
  );
}

/** Small light-theme code-ish panel used inside feature cards. */
export function MiniPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-paper p-3.5 font-mono text-[11px] leading-relaxed text-ink/80',
        className,
      )}
    >
      {children}
    </div>
  );
}
