import { AudioLines, CalendarClock, Check, FileText, Layers3, X } from 'lucide-react';
import { motion } from 'motion/react';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { ProductWindow } from './primitives';

/* All figures in these visuals are illustrative and carry an ExampleTag
   (through ProductWindow or the page's Stage header). */

function ClassChip({ value, overlap }: { value: number; overlap?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 font-mono text-[10.5px] ring-1',
        overlap
          ? 'bg-accent/20 text-accent-soft ring-accent/40'
          : 'bg-white/5 text-white/70 ring-white/10',
      )}
    >
      {value}
    </span>
  );
}

const REASONS = [
  { text: 'Sounds the same when spoken', detail: 'phonetic key AKM = AKM' },
  { text: 'Filed for the same kinds of products', detail: 'classes 9 and 42 overlap' },
  { text: 'Spelling is 62% alike', detail: 'normalised edit distance' },
];

/** Hero visual: your mark next to a newly published one, why it was flagged, and time left. */
export function TrademarkWatchCard() {
  const elapsed = 85; // % of a 4-month opposition window already used (example)
  return (
    <ProductWindow
      title="trademark watch · new filing"
      className="mx-auto w-full max-w-lg [contain:inline-size]"
    >
      <div className="border-b border-white/10 bg-accent/[0.08] px-5 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[12.5px] text-white/70">
              <CalendarClock aria-hidden className="size-4 text-accent-soft" />
              Time left to object
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
              18 <span className="text-base font-medium text-white/55">days</span>
            </p>
          </div>
          <p className="pb-1 text-right text-[11.5px] leading-snug text-white/50">
            Counted from the
            <br />
            journal publication date
          </p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent-soft to-accent"
            initial={{ width: 0 }}
            whileInView={{ width: `${elapsed}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.3, ease: EASE_OUT, delay: 0.3 }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/10">
        <div className="bg-night p-4 sm:p-5">
          <p className="text-[11.5px] text-white/50">Your trademark</p>
          <p className="mt-1.5 text-[15px] font-semibold tracking-[-0.01em]">ACME GLOBAL</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            <span className="mr-0.5 text-[10.5px] text-white/60">Classes</span>
            <ClassChip value={9} overlap />
            <ClassChip value={42} overlap />
          </div>
        </div>
        <div className="bg-night p-4 sm:p-5">
          <p className="text-[11.5px] text-accent-soft">New filing</p>
          <p className="mt-1.5 text-[15px] font-semibold tracking-[-0.01em]">ACME-CLOUDX</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            <span className="mr-0.5 text-[10.5px] text-white/60">Classes</span>
            <ClassChip value={9} overlap />
            <ClassChip value={35} />
            <ClassChip value={42} overlap />
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="text-[12.5px] font-medium text-white/80">Why it was flagged</p>
        <ul className="mt-3 space-y-2.5">
          {REASONS.map((reason, index) => (
            <motion.li
              key={reason.text}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.4 + index * 0.1 }}
              className="flex items-start gap-2.5"
            >
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent/25 text-accent-soft">
                <Check aria-hidden className="size-2.5" strokeWidth={3} />
              </span>
              <span className="text-[13px] leading-snug">
                {reason.text}
                <span className="block font-mono text-[10.5px] text-white/60">{reason.detail}</span>
              </span>
            </motion.li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <span className="rounded-full bg-accent/20 px-2.5 py-1 text-[12px] font-semibold text-accent-soft">
            High priority
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-white/65">
            <FileText aria-hidden className="size-3.5 text-accent-soft" />
            Draft notes for legal review
          </span>
        </div>
      </div>
    </ProductWindow>
  );
}

/* ---------------------------------------------- "What we compare" panels */

const SOUND_ROWS = [
  { mark: 'ACMEE', verdict: 'Sounds like your mark', match: true },
  { mark: 'AKMI', verdict: 'Sounds like your mark', match: true },
  { mark: 'ACKME', verdict: 'Sounds like your mark', match: true },
  { mark: 'ACORN', verdict: 'Sounds different', match: false },
];

export function SoundAlikePanel() {
  return (
    <div>
      <p className="text-[13px] text-white/60">
        Your mark: <span className="font-semibold text-white">ACME</span>
      </p>
      <ul className="mt-4 space-y-2">
        {SOUND_ROWS.map((row, index) => (
          <motion.li
            key={row.mark}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT, delay: index * 0.07 }}
            className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10"
          >
            <span className="font-mono text-[14px] font-medium">{row.mark}</span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-[12.5px]',
                row.match ? 'text-accent-soft' : 'text-white/50',
              )}
            >
              {row.match ? (
                <AudioLines aria-hidden className="size-3.5" />
              ) : (
                <X aria-hidden className="size-3.5" />
              )}
              {row.verdict}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function ProductClassPanel() {
  const yours = new Set([9, 35, 42]);
  const theirs = new Set([9, 42, 45]);
  return (
    <div>
      <div className="grid grid-cols-9 gap-1.5">
        {Array.from({ length: 45 }, (_, index) => index + 1).map((value) => {
          const mine = yours.has(value);
          const other = theirs.has(value);
          return (
            <span
              key={value}
              className={cn(
                'flex aspect-square items-center justify-center rounded-md font-mono text-[10.5px]',
                mine && other
                  ? 'bg-accent text-white shadow-[0_0_14px_rgb(217_47_72/0.6)]'
                  : mine
                    ? 'bg-white/15 text-white'
                    : other
                      ? 'bg-accent-soft/25 text-accent-soft'
                      : 'bg-white/[0.04] text-white/30',
              )}
            >
              {value}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-white/65">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-white/25" /> Your classes
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-accent-soft/50" /> Their classes
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-sm bg-accent" /> Both — worth a look
        </span>
      </div>
    </div>
  );
}

const LOGO_SIGNALS = [
  { label: 'Overall shape', value: 0.78 },
  { label: 'Visual details', value: 0.87 },
  { label: 'Colours', value: 0.31 },
];

export function LogoPanel() {
  return (
    <div className="space-y-5">
      {LOGO_SIGNALS.map((signal, index) => (
        <div key={signal.label}>
          <div className="flex justify-between text-[13px]">
            <span className="text-white/75">{signal.label}</span>
            <span className="font-mono">{Math.round(signal.value * 100)}% alike</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-accent-soft"
              initial={{ width: 0 }}
              animate={{ width: `${signal.value * 100}%` }}
              transition={{ duration: 1, ease: EASE_OUT, delay: index * 0.1 }}
            />
          </div>
        </div>
      ))}
      <p className="rounded-xl bg-white/[0.04] px-4 py-3 text-[12.5px] leading-relaxed text-white/60 ring-1 ring-white/10">
        A similar logo is a reason to look closer — never proof of infringement on its own.
      </p>
    </div>
  );
}

const JOURNAL_STEPS = [
  { label: 'New journal issue published', value: '412 pages' },
  { label: 'Every page read, scans included', value: 'page numbers kept' },
  { label: 'Applications found', value: '3,980' },
  { label: 'Close to your marks', value: '2 for review' },
];

export function JournalPanel() {
  return (
    <ol className="space-y-2.5">
      {JOURNAL_STEPS.map((step, index) => (
        <motion.li
          key={step.label}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4, ease: EASE_OUT }}
          className={cn(
            'flex items-center gap-3 rounded-xl px-4 py-3 ring-1',
            index === JOURNAL_STEPS.length - 1
              ? 'bg-accent/15 ring-accent/40'
              : 'bg-white/[0.04] ring-white/10',
          )}
        >
          <span className="font-mono text-[11px] text-accent-soft">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-[13px]">{step.label}</span>
          <span className="ml-auto text-right font-mono text-[11.5px] text-white/55">
            {step.value}
          </span>
        </motion.li>
      ))}
    </ol>
  );
}

/* -------------------------------------------------- Opposition deadlines */

const WINDOWS = [
  { office: 'India', body: 'Trade Marks Registry', days: 120, label: '4 months' },
  { office: 'European Union', body: 'EUIPO', days: 90, label: '3 months' },
  { office: 'United States', body: 'USPTO', days: 30, label: '30 days, can be extended' },
];

/**
 * Light card comparing how long each office gives you to object after a mark
 * is published. Facts, not examples, so no ExampleTag.
 */
export function OppositionWindows({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white p-6 ring-1 ring-line', className)}>
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
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent-soft to-accent"
                initial={{ width: 0 }}
                whileInView={{ width: `${(period.days / 120) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.15 * index }}
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
