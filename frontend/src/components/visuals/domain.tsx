import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  Check,
  Fingerprint,
  KeyRound,
  Lock,
  Mail,
  Type,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ExampleTag } from '@/components/ui/layout';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { ProductWindow } from './primitives';

/* -------------------------------------------------------------- Shared bits */

/** Browser-style address bar, light-on-dark. */
function AddressBar({
  label,
  children,
  official = false,
}: {
  label: string;
  children: ReactNode;
  official?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-3.5 py-3 ring-1',
        official ? 'bg-white/[0.04] ring-white/10' : 'bg-accent/[0.12] ring-accent/40',
      )}
    >
      <span className="w-16 shrink-0 text-[11.5px] text-white/50">{label}</span>
      <span className="flex min-w-0 flex-1 items-center gap-2 font-mono text-[14px] sm:text-[15px]">
        <Lock aria-hidden className="size-3.5 shrink-0 text-white/60" />
        <span className="truncate">{children}</span>
      </span>
      {official ? (
        <BadgeCheck aria-hidden className="size-4 shrink-0 text-emerald-400" />
      ) : (
        <AlertTriangle aria-hidden className="size-4 shrink-0 text-accent-soft" />
      )}
    </div>
  );
}

const REASONS = [
  { icon: Type, text: 'Looks like your name', note: 'r + n ≈ m' },
  { icon: CalendarClock, text: 'Registered 2 days ago', note: 'brand new' },
  { icon: Mail, text: 'Set up to send email', note: 'can send fake invoices' },
  { icon: KeyRound, text: 'Has a sign-in page like yours', note: 'asks for passwords' },
];

/* ------------------------------------------------------------- Hero alert */

/** Domain hero: what a visitor sees in the address bar, and why Similo flags it. */
export function DomainAlertVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <ProductWindow title="New alert · website">
        <div className="p-5 sm:p-6">
          <p className="text-[12.5px] text-white/55">What people see in their address bar</p>
          <div className="mt-3 space-y-2">
            <AddressBar label="Your site" official>
              acme.com
            </AddressBar>
            <AddressBar label="Found">
              ac
              <motion.span
                className="rounded bg-accent px-0.5 text-white"
                initial={{ opacity: 0.4 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                rn
              </motion.span>
              e-login.com
            </AddressBar>
          </div>
        </div>

        <div className="border-t border-white/10 p-5 sm:p-6">
          <p className="text-[12.5px] text-white/55">Why it looks risky</p>
          <ul className="mt-3.5 space-y-3">
            {REASONS.map((reason, index) => (
              <motion.li
                key={reason.text}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.5 + index * 0.12 }}
                className="flex items-center gap-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-accent-soft ring-1 ring-white/10">
                  <reason.icon aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-[14px] font-medium">{reason.text}</span>
                <span className="hidden text-[12px] text-white/60 sm:inline">{reason.note}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-1 text-[12.5px] font-semibold text-accent-soft">
            <AlertTriangle aria-hidden className="size-3.5" />
            High risk · sent for review
          </span>
          <span className="font-mono text-[10.5px] text-white/60">
            homoglyph · RDAP · MX · page capture
          </span>
        </div>
      </ProductWindow>
    </div>
  );
}

/* -------------------------------------------------------- Page comparison */

function MockLoginPage({ url, suspicious }: { url: string; suspicious?: boolean }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-white text-ink',
        suspicious
          ? 'border-accent/50 shadow-[0_12px_40px_-12px_rgb(217_47_72/0.35)]'
          : 'border-line shadow-soft',
      )}
    >
      <div className="flex items-center gap-2 border-b border-line bg-cream px-3 py-2">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-mono text-[10.5px] text-muted ring-1 ring-line">
          <Lock aria-hidden className="size-3 shrink-0" />
          <span className="truncate">{url}</span>
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-night text-xs font-semibold text-white">
            A
          </span>
          <span className="text-sm font-semibold">ACME</span>
        </div>
        <p className="mt-4 text-[13px] font-semibold">Sign in to your account</p>
        <div className="mt-3 space-y-2">
          <div className="h-8 rounded-lg border border-line bg-cream" />
          <div className="h-8 rounded-lg border border-line bg-cream" />
          <div
            className={cn(
              'flex h-8 items-center justify-center rounded-lg text-[11px] font-medium text-white',
              suspicious ? 'bg-accent' : 'bg-night',
            )}
          >
            Sign in
          </div>
        </div>
      </div>
    </div>
  );
}

const PAGE_FINDINGS = [
  { label: 'Looks like your page', value: '94% alike', alert: false },
  { label: 'Uses your wording', value: '88% the same', alert: false },
  { label: 'Where passwords go', value: 'Another site', alert: true },
];

/** Official sign-in page next to a suspected copy, with plain findings. */
export function PageCompareVisual() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-emerald-700">
            <Check aria-hidden className="size-3.5" /> Your real page
          </p>
          <MockLoginPage url="portal.acme.com/login" />
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-accent-ink">
            <AlertTriangle aria-hidden className="size-3.5" /> The copy we found
          </p>
          <MockLoginPage url="acrne-login.com/secure" suspicious />
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {PAGE_FINDINGS.map((finding, index) => (
          <motion.div
            key={finding.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.2 + index * 0.1 }}
            className={cn(
              'rounded-xl px-4 py-3 ring-1',
              finding.alert ? 'bg-accent/[0.06] ring-accent/25' : 'bg-cream ring-line',
            )}
          >
            <dt className="text-[12.5px] text-muted">{finding.label}</dt>
            <dd
              className={cn(
                'mt-0.5 text-[17px] font-semibold tracking-[-0.02em]',
                finding.alert && 'text-accent-ink',
              )}
            >
              {finding.value}
            </dd>
          </motion.div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------ Registration facts */

const REGISTRATION = [
  { label: 'Registered', value: '2 days ago' },
  { label: 'Owner', value: 'Hidden by a privacy service' },
  { label: 'Registered through', value: 'Example Registrar, Inc.' },
];

/** Who registered a name and when, in plain words. */
export function RegistrationFacts() {
  return (
    <dl className="divide-y divide-line rounded-2xl bg-cream ring-1 ring-line">
      {REGISTRATION.map((fact) => (
        <div key={fact.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-[13px] text-muted">{fact.label}</dt>
          <dd className="truncate text-right text-[14px] font-medium">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------------------------------------------------- Setup timeline */

const SETUP = [
  { when: 'Day 0', event: 'Name registered', alert: false },
  { when: 'Day 0', event: 'Security certificate issued', alert: false },
  { when: 'Day 1', event: 'Email switched on', alert: false },
  { when: 'Day 2', event: 'Sign-in form appears', alert: true },
];

/** How a lookalike name gets ready for use, step by step. */
export function SetupTimeline() {
  return (
    <ol className="relative space-y-3.5 pl-5">
      <span aria-hidden className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-line" />
      {SETUP.map((step, index) => (
        <motion.li
          key={step.event}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: EASE_OUT, delay: index * 0.1 }}
          className="relative flex items-baseline justify-between gap-3"
        >
          <span
            aria-hidden
            className={cn(
              'absolute top-1.5 -left-5 size-[11px] rounded-full ring-4 ring-white',
              step.alert ? 'bg-accent' : 'bg-line-strong',
            )}
          />
          <span className={cn('text-[14px] font-medium', step.alert && 'text-accent-ink')}>
            {step.event}
          </span>
          <span className="shrink-0 font-mono text-[11.5px] text-muted">{step.when}</span>
        </motion.li>
      ))}
    </ol>
  );
}

/* ------------------------------------------------------------ Proof + dismiss */

/** A saved capture with its fingerprint. */
export function EvidenceChip() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3 ring-1 ring-line">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-accent-ink ring-1 ring-line">
        <Fingerprint aria-hidden className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium">page-capture.png · 11:16</p>
        <p className="truncate font-mono text-[11px] text-muted">fingerprint 9f2c4e1b…a71e</p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 ring-1 ring-emerald-200">
        <Check aria-hidden className="size-3" /> Unchanged
      </span>
    </div>
  );
}

/** A finding dismissed with a reason, so it does not come back. */
export function DismissedChip() {
  return (
    <div className="rounded-2xl bg-cream px-4 py-3 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate font-mono text-[13px] text-muted line-through decoration-line-strong">
          acme-recipes.blog
        </p>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11.5px] font-medium text-muted ring-1 ring-line">
          <X aria-hidden className="size-3" /> Dismissed
        </span>
      </div>
      <p className="mt-1.5 text-[13px] text-ink/80">
        “Unrelated cooking blog.” — won’t return unless it changes
      </p>
    </div>
  );
}

/** Light-surface heading row for a bento tile that holds sample data. */
export function SampleHeader({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <p className="text-[13px] font-medium text-muted">{children}</p>
      <ExampleTag tone="light" />
    </div>
  );
}
