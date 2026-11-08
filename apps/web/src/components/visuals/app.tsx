import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Check,
  FileText,
  Image as ImageIcon,
  ShieldAlert,
  Star,
  Type,
} from 'lucide-react';
import { motion } from 'motion/react';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { ProductWindow } from './primitives';

/* ------------------------------------------------------------ App icon */

/** The sample brand's app icon; the copy is subtly off (stroke, colour). */
export function AppIcon({
  variant,
  className,
}: {
  variant: 'official' | 'copy';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex size-14 shrink-0 items-center justify-center rounded-[18px] shadow-lg',
        variant === 'official'
          ? 'bg-gradient-to-br from-[#ff6b80] to-crimson shadow-crimson/30'
          : 'bg-gradient-to-br from-[#f2788a] to-[#c93a50] shadow-crimson/20',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[58%]" aria-hidden>
        <path
          d="M12 3 5 5.6v5.6c0 4.6 3 8.5 7 9.8 4-1.3 7-5.2 7-9.8V5.6L12 3Z"
          fill="none"
          stroke="white"
          strokeWidth={variant === 'official' ? 1.8 : 2.2}
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/* ---------------------------------------------------------- Hero alert */

function StoreListing({
  variant,
  name,
  publisher,
  rating,
}: {
  variant: 'official' | 'copy';
  name: string;
  publisher: string;
  rating: string;
}) {
  const official = variant === 'official';
  return (
    <div
      className={cn(
        'rounded-2xl p-4 ring-1',
        official ? 'bg-white/[0.04] ring-white/10' : 'bg-crimson/[0.12] ring-crimson/40',
      )}
    >
      <p className={cn('text-[11.5px]', official ? 'text-white/50' : 'text-coral')}>
        {official ? 'Your app' : 'Found in the store'}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <AppIcon variant={variant} className="size-12 rounded-2xl" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-white/55">
            {official ? (
              <BadgeCheck aria-hidden className="size-3 shrink-0 text-emerald-400" />
            ) : (
              <ShieldAlert aria-hidden className="size-3 shrink-0 text-coral" />
            )}
            <span className="truncate">{publisher}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-white/60">
            <Star aria-hidden className="size-3" /> {rating}
          </p>
        </div>
      </div>
    </div>
  );
}

const REASONS = [
  { icon: ImageIcon, text: 'Logo looks almost the same', note: 'small colour change' },
  { icon: Type, text: 'Name is yours plus “Pro”', note: 'easy to mistake' },
  { icon: Building2, text: 'Published by another company', note: 'not on your list' },
  { icon: FileText, text: 'Mentions your brand 4 times', note: 'in the description' },
];

/** App hero: your listing next to a copycat, and why it was flagged. */
export function AppAlertVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full bg-crimson/20 blur-[90px]"
      />
      <ProductWindow title="New alert · app store">
        <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-2 sm:p-6">
          <StoreListing
            variant="official"
            name="ACME Wallet"
            publisher="ACME Global Ltd"
            rating="4.6"
          />
          <StoreListing
            variant="copy"
            name="ACME Wallet Pro"
            publisher="Acme Apps Studio"
            rating="3.1"
          />
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
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-coral ring-1 ring-white/10">
                  <reason.icon aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-[14px] font-medium">{reason.text}</span>
                <span className="hidden text-[12px] text-white/60 sm:inline">{reason.note}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-crimson/20 px-2.5 py-1 text-[12.5px] font-semibold text-coral">
            <AlertTriangle aria-hidden className="size-3.5" />
            High risk · sent for review
          </span>
          <span className="font-mono text-[10.5px] text-white/60">
            image hash · embeddings · publisher check
          </span>
        </div>
      </ProductWindow>
    </div>
  );
}

/* ------------------------------------------------------ Bento visuals */

/** Two icons side by side: easy to confuse at thumbnail size. */
export function IconCompare() {
  return (
    <div className="flex items-center justify-center gap-6 rounded-2xl bg-paper px-4 py-6 ring-1 ring-line">
      <figure className="flex flex-col items-center gap-2">
        <AppIcon variant="official" />
        <figcaption className="text-[12px] text-muted">Yours</figcaption>
      </figure>
      <div className="flex flex-col items-center">
        <span className="text-[19px] font-semibold tracking-[-0.02em]">≈</span>
        <span className="text-[11.5px] text-muted">look alike</span>
      </div>
      <figure className="flex flex-col items-center gap-2">
        <AppIcon variant="copy" />
        <figcaption className="text-[12px] text-crimson-dark">Copy</figcaption>
      </figure>
    </div>
  );
}

/** Your app name next to the copycat's, with the added word highlighted. */
export function NameCompare() {
  return (
    <div className="space-y-2">
      <p className="flex items-center justify-between rounded-xl bg-paper px-4 py-3 ring-1 ring-line">
        <span className="text-[15px] font-medium">ACME Wallet</span>
        <span className="text-[12px] text-muted">Your app</span>
      </p>
      <p className="flex items-center justify-between rounded-xl bg-crimson/[0.05] px-4 py-3 ring-1 ring-crimson/25">
        <span className="text-[15px] font-medium">
          ACME Wallet <mark className="rounded bg-crimson/15 px-1 text-crimson-dark">Pro</mark>
        </span>
        <span className="text-[12px] text-crimson-dark">Found</span>
      </p>
    </div>
  );
}

const PARTNERS = [
  { name: 'ACME Wallet', publisher: 'ACME Global Ltd', tag: 'Your app' },
  { name: 'ACME Rewards', publisher: 'Partner Co.', tag: 'Approved partner' },
];

/** Allow-list: official apps and partners are recognised, not alerted. */
export function PartnerAllowList() {
  return (
    <ul className="divide-y divide-line rounded-2xl bg-paper ring-1 ring-line">
      {PARTNERS.map((partner) => (
        <li key={partner.name} className="flex items-center gap-3 px-4 py-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <Check aria-hidden className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium">{partner.name}</span>
            <span className="block truncate text-[12px] text-muted">{partner.publisher}</span>
          </span>
          <span className="shrink-0 text-[12px] text-muted">{partner.tag}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------- Sources panel */

const SOURCES = [
  {
    name: 'Apple App Store',
    how: 'Apple’s official public search',
    status: 'Public API',
    tone: 'ok',
  },
  {
    name: 'Google Play',
    how: 'Needs a licensed data provider',
    status: 'Not connected',
    tone: 'off',
  },
  {
    name: 'Other app stores',
    how: 'Added one by one, where rules allow',
    status: 'Not connected',
    tone: 'off',
  },
] as const;

/** How a workspace shows its app sources: approval-only ones are never shown as active. */
export function AppSourcesPanel() {
  return (
    <ProductWindow title="Workspace · app sources">
      <ul className="divide-y divide-white/10">
        {SOURCES.map((source) => (
          <li key={source.name} className="flex items-center gap-4 px-5 py-4 sm:px-6">
            <span
              aria-hidden
              className={cn(
                'size-2 shrink-0 rounded-full',
                source.tone === 'ok' ? 'bg-emerald-400' : 'bg-white/25',
              )}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-medium">{source.name}</span>
              <span className="block text-[12.5px] text-white/55">{source.how}</span>
            </span>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 font-mono text-[10.5px] tracking-wide uppercase',
                source.tone === 'ok'
                  ? 'bg-emerald-400/15 text-emerald-300'
                  : 'bg-white/[0.06] text-white/55 ring-1 ring-white/10',
              )}
            >
              {source.status}
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-white/10 bg-white/[0.02] px-5 py-3.5 text-[12.5px] text-white/50 sm:px-6">
        Sources that need approval stay “not connected” until access is granted.
      </p>
    </ProductWindow>
  );
}

/** The listing's publisher checked against the companies you publish under. */
export function PublisherCheck() {
  return (
    <div className="space-y-2">
      <p className="flex items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3 ring-1 ring-line">
        <span className="min-w-0">
          <span className="block text-[12px] text-muted">Your publishers</span>
          <span className="block truncate text-[14px] font-medium">ACME Global Ltd</span>
        </span>
        <BadgeCheck aria-hidden className="size-4 shrink-0 text-emerald-600" />
      </p>
      <p className="flex items-center justify-between gap-3 rounded-xl bg-crimson/[0.05] px-4 py-3 ring-1 ring-crimson/25">
        <span className="min-w-0">
          <span className="block text-[12px] text-crimson-dark">This listing</span>
          <span className="block truncate text-[14px] font-medium">Acme Apps Studio</span>
        </span>
        <ShieldAlert aria-hidden className="size-4 shrink-0 text-crimson-dark" />
      </p>
    </div>
  );
}

const BORROWED = [
  { label: 'Category', value: 'Finance — same as yours' },
  { label: 'Screenshots', value: '3 of 5 look like yours' },
  { label: 'Description', value: 'Names your brand 4 times' },
];

/** Parts of a listing that mirror the real app. */
export function BorrowedDetails() {
  return (
    <dl className="divide-y divide-line rounded-2xl bg-paper ring-1 ring-line">
      {BORROWED.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt className="text-[13px] text-muted">{row.label}</dt>
          <dd className="text-right text-[13.5px] font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
