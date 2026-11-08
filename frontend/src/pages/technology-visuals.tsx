import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ProductWindow, ReasonCode } from '@/components/visuals/primitives';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';

/*
 * Product mock-ups for the "AI, explained" page. All values are illustrative
 * (each window carries the "Illustrative example" tag from ProductWindow).
 */

function Row({
  label,
  value,
  note,
  emphasis,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="font-mono text-[12px] text-white/80">{label}</p>
        {note && <p className="mt-0.5 text-[12px] text-white/60">{note}</p>}
      </div>
      <span
        className={cn(
          'shrink-0 font-mono text-[12.5px]',
          emphasis ? 'text-coral' : 'text-white/90',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Footnote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-lg bg-crimson/10 px-3 py-2 font-mono text-[11.5px] text-coral ring-1 ring-crimson/30">
      {children}
    </p>
  );
}

/* ---------------------------------------------------------- Score (hero) */

const SCORE_PARTS = [
  { plain: 'Uses “rn” to look like “m”', code: 'HOMOGLYPH', points: 30 },
  { plain: 'Name is very close to yours', code: 'FUZZY_NAME', points: 20 },
  { plain: 'Page asks for a password', code: 'CREDENTIAL_FORM', points: 18 },
  { plain: 'Registered less than a week ago', code: 'NEW_REGISTRATION', points: 14 },
  { plain: 'Set up to send email', code: 'MX_CONFIGURED', points: 9 },
];

/** A risk score broken into the reasons that make it up. */
export function ScoreBreakdown() {
  const total = SCORE_PARTS.reduce((sum, part) => sum + part.points, 0);
  return (
    <ProductWindow title="why it was flagged" className="mx-auto w-full max-w-md">
      <div className="p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-[10.5px] tracking-[0.08em] text-white/60 uppercase">
              Priority
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight text-coral">{total}</span>
              <span className="rounded-full bg-crimson/20 px-2 py-0.5 text-[12px] font-semibold text-coral">
                High
              </span>
            </p>
          </div>
          <p className="text-right font-mono text-[11px] text-white/60">
            rules v1
            <br />
            weights editable
          </p>
        </div>
        {/* Stacked bar: each segment is one reason's contribution. */}
        <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-white/10">
          {SCORE_PARTS.map((part, index) => (
            <motion.span
              key={part.code}
              className={cn('h-full', index % 2 === 0 ? 'bg-crimson' : 'bg-coral')}
              initial={{ width: 0 }}
              whileInView={{ width: `${part.points}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.3 + index * 0.12 }}
            />
          ))}
        </div>
        <ul className="mt-4 divide-y divide-white/[0.06]">
          {SCORE_PARTS.map((part) => (
            <li key={part.code} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-[13px] text-white/85">{part.plain}</p>
                <p className="font-mono text-[10.5px] text-white/60">{part.code}</p>
              </div>
              <span className="font-mono text-[13px] text-white/90">+{part.points}</span>
            </li>
          ))}
        </ul>
      </div>
    </ProductWindow>
  );
}

/* ---------------------------------------------------------------- Names */

function Marked({ parts }: { parts: [string, string, string] }) {
  return (
    <span className="font-mono">
      {parts[0]}
      <mark className="rounded bg-crimson/30 px-0.5 text-coral">{parts[1]}</mark>
      {parts[2]}
    </span>
  );
}

export function NameCheckVisual() {
  return (
    <ProductWindow title="name check" className="w-full">
      <div className="p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-white/[0.04] p-3.5 ring-1 ring-white/10">
            <p className="text-[11.5px] text-white/60">Your brand</p>
            <p className="mt-1 font-mono text-[17px]">acme.com</p>
          </div>
          <div className="rounded-xl bg-crimson/10 p-3.5 ring-1 ring-crimson/30">
            <p className="text-[11.5px] text-white/60">Found</p>
            <p className="mt-1 text-[17px]">
              <Marked parts={['ac', 'rn', 'e-login.com']} />
            </p>
          </div>
        </div>
        <div className="mt-4 divide-y divide-white/[0.06]">
          <Row label="lookalike_characters" note="“rn” reads as “m”" value="rn → m" emphasis />
          <Row label="fuzzy_ratio" note="How close the spelling is" value="0.91" />
          <Row label="phonetic_match" note="Sounds the same when read aloud" value="yes" />
          <Row label="semantic_cosine" note="How close the meaning is" value="0.42" />
        </div>
        <Footnote>Each measure is stored separately — never averaged blindly.</Footnote>
      </div>
    </ProductWindow>
  );
}

/* --------------------------------------------------------------- Images */

function ShieldGlyph({ variant }: { variant: 'yours' | 'found' }) {
  const found = variant === 'found';
  return (
    <svg viewBox="0 0 64 64" aria-hidden className="size-16">
      <rect width="64" height="64" rx="16" fill={found ? '#252C40' : '#0B1020'} />
      <path
        d={
          found
            ? 'M32 13 18 18.5v11.3c0 9.2 6 17 14 19.7 8-2.7 14-10.5 14-19.7V18.5L32 13Z'
            : 'M32 12 18 17.2v11.2c0 9.2 6 17 14 19.6 8-2.6 14-10.4 14-19.6V17.2L32 12Z'
        }
        fill="none"
        stroke={found ? '#E98A91' : '#D92F48'}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d={
          found
            ? 'M32 22v19c4.2-2 7-6.2 7-11.2v-4.6L32 22Z'
            : 'M32 21v19c4.4-2 7.2-6.4 7.2-11.6v-4.8L32 21Z'
        }
        fill="#E98A91"
      />
    </svg>
  );
}

export function ImageCheckVisual() {
  return (
    <ProductWindow title="logo & icon check" className="w-full">
      <div className="p-5">
        <div className="flex items-center justify-center gap-6 rounded-xl bg-white/[0.03] py-6 ring-1 ring-white/10">
          <figure className="flex flex-col items-center gap-2">
            <ShieldGlyph variant="yours" />
            <figcaption className="text-[11.5px] text-white/50">Your logo</figcaption>
          </figure>
          <span className="font-mono text-[12px] text-coral">vs</span>
          <figure className="flex flex-col items-center gap-2">
            <ShieldGlyph variant="found" />
            <figcaption className="text-[11.5px] text-white/50">App store icon</figcaption>
          </figure>
        </div>
        <div className="mt-4 divide-y divide-white/[0.06]">
          <Row label="normalised" note="Same size, crop and colours first" value="yes" />
          <Row label="phash_distance" note="Lower means a closer copy" value="6 / 64" emphasis />
          <Row label="embedding_cosine" note="How alike the style looks" value="0.87" />
        </div>
        <Footnote>A signal for review — not proof of copying.</Footnote>
      </div>
    </ProductWindow>
  );
}

/* ------------------------------------------------------------ Documents */

export function DocumentCheckVisual() {
  return (
    <ProductWindow title="journal · page 318" className="w-full">
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_1.1fr]">
        {/* A scanned journal page, abstracted into lines. */}
        <div aria-hidden className="rounded-lg bg-paper p-4 shadow-inner">
          {[90, 70, 84, 60].map((width, index) => (
            <span
              key={`a${index}`}
              className="mt-2 block h-1.5 rounded-full bg-ink/15 first:mt-0"
              style={{ width: `${width}%` }}
            />
          ))}
          <span className="mt-3 block rounded-md bg-crimson/15 p-1.5 ring-2 ring-crimson">
            <span className="block font-mono text-[10px] font-semibold text-crimson-dark">
              ACMEE · cl. 9, 42
            </span>
          </span>
          {[76, 88, 54, 80, 66].map((width, index) => (
            <span
              key={`b${index}`}
              className="mt-2 block h-1.5 rounded-full bg-ink/15"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
        <div className="divide-y divide-white/[0.06]">
          <Row label="mark" value="ACMEE" emphasis />
          <Row label="classes" note="Kinds of goods and services" value="9 · 42" />
          <Row label="page" value="318" />
          <Row label="ocr_confidence" note="How sure the reading is" value="0.97" />
        </div>
      </div>
    </ProductWindow>
  );
}

/* ---------------------------------------------------- Registration data */

export function RegistrationVisual() {
  return (
    <ProductWindow title="registration data" className="w-full">
      <div className="p-5">
        <div className="divide-y divide-white/[0.06]">
          <Row
            label="created"
            note="Very new domains are a warning sign"
            value="2 days ago"
            emphasis
          />
          <Row
            label="mx_records"
            note="It is set up to send and receive email"
            value="configured"
            emphasis
          />
          <Row
            label="certificate"
            note="Padlock issued, so the page looks safe"
            value="issued 1 day ago"
          />
          <Row label="registrant" note="Hidden for privacy — normal on its own" value="redacted" />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <ReasonCode>NEW_REGISTRATION</ReasonCode>
          <ReasonCode>MX_CONFIGURED</ReasonCode>
        </div>
      </div>
    </ProductWindow>
  );
}

/* ---------------------------------------------------------------- Rules */

const WEIGHTS = [
  { signal: 'Lookalike characters', weight: 30 },
  { signal: 'Name similarity', weight: 20 },
  { signal: 'Login form on the page', weight: 18 },
  { signal: 'New registration', weight: 14 },
  { signal: 'Email set up', weight: 9 },
];

export function WeightsVisual() {
  return (
    <ProductWindow title="scoring rules · v1" className="w-full">
      <div className="p-5">
        <ul className="space-y-3.5">
          {WEIGHTS.map((item, index) => (
            <li key={item.signal}>
              <div className="flex justify-between text-[13px]">
                <span className="text-white/80">{item.signal}</span>
                <span className="font-mono text-white/90">{item.weight}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-crimson"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(item.weight / 30) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: EASE_OUT, delay: index * 0.08 }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 border-t border-white/10 pt-4 text-[12.5px] leading-relaxed text-white/55">
          Admins can tune the weights. Every change creates a new rules version, and each alert
          records which version scored it.
        </p>
      </div>
    </ProductWindow>
  );
}
