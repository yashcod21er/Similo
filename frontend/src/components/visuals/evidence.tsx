import {
  Check,
  FileCode2,
  FileImage,
  Fingerprint,
  Globe,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { ProductWindow } from './primitives';

const EVIDENCE = [
  {
    icon: FileImage,
    name: 'Screenshot of the fake sign-in page',
    file: 'page-capture.png',
    hash: '9f2c…a71e',
  },
  {
    icon: Globe,
    name: 'Who registered the website',
    file: 'registration-record.json',
    hash: '41bd…0c93',
  },
  { icon: FileCode2, name: 'Copy of the page code', file: 'page-source.html', hash: 'e07a…5b2d' },
];

const TIMELINE = [
  { who: 'Analyst', text: 'The sign-in form sends passwords to another server. Escalating.' },
  { who: 'Legal reviewer', text: 'Takedown letter approved with two edits.' },
];

/** Hero visual: one case with fingerprinted evidence and a shared timeline. */
export function EvidenceVaultCard() {
  return (
    <ProductWindow
      title="case · lookalike website campaign"
      className="mx-auto w-full max-w-lg [contain:inline-size]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-[15px] font-semibold tracking-[-0.01em]">Fake sign-in pages</p>
          <p className="mt-1 text-[12px] text-white/50">3 alerts linked · Owner: analyst</p>
        </div>
        <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-1 text-[11.5px] font-semibold text-accent-soft">
          High priority
        </span>
      </div>
      <div className="p-5">
        <p className="text-[12.5px] font-medium text-white/80">Saved evidence</p>
        <ul className="mt-3 space-y-2">
          {EVIDENCE.map((item, index) => (
            <motion.li
              key={item.file}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.2 + index * 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-accent-soft">
                <item.icon aria-hidden className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px]">{item.name}</p>
                <p className="truncate font-mono text-[10.5px] text-white/60">{item.file}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 font-mono text-[10.5px] text-emerald-300">
                <Fingerprint aria-hidden className="size-3" /> {item.hash}
              </span>
            </motion.li>
          ))}
        </ul>
        <p className="mt-5 text-[12.5px] font-medium text-white/80">Timeline</p>
        <ul className="mt-3 space-y-2.5 border-l border-white/10 pl-4">
          {TIMELINE.map((note) => (
            <li key={note.text} className="relative text-[12.5px] leading-snug">
              <span
                aria-hidden
                className="absolute top-1.5 -left-[19px] size-1.5 rounded-full bg-accent-soft"
              />
              <span className="text-white/60">{note.who} · </span>
              <span className="text-white/85">{note.text}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-400/10 px-3 py-2.5 text-[12.5px] text-emerald-200 ring-1 ring-emerald-400/25">
          <ShieldCheck aria-hidden className="size-4 shrink-0" />
          All 3 files still match their original fingerprints
        </div>
      </div>
    </ProductWindow>
  );
}

/* ------------------------------------------------------ Fingerprint demo */

const SAMPLE = 'Screenshot of acme-login.com, saved 8 Nov 2026 at 09:42';

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Web Crypto only exists in secure contexts (https or localhost). */
const canHash = typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';

function useSha256(text: string) {
  const [hash, setHash] = useState<string | null>(null);
  useEffect(() => {
    if (!canHash) return;
    let cancelled = false;
    void sha256(text).then((value) => {
      if (!cancelled) setHash(value);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);
  return hash;
}

/**
 * Interactive explainer: edit the "evidence" and watch its SHA-256 fingerprint
 * change completely. The hash really is computed in the browser.
 */
export function FingerprintDemo({ className }: { className?: string }) {
  const [text, setText] = useState(SAMPLE);
  const original = useSha256(SAMPLE);
  const current = useSha256(text);
  const inputId = useId();
  const matches = text === SAMPLE;

  return (
    <div className={cn('rounded-2xl bg-white p-6 ring-1 ring-line sm:p-7', className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-[15px] font-semibold tracking-[-0.01em]">
          Try it: change one character
        </label>
        <button
          type="button"
          onClick={() => setText(SAMPLE)}
          disabled={matches}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-muted ring-1 ring-line transition-colors hover:text-ink disabled:opacity-40"
        >
          <RotateCcw aria-hidden className="size-3.5" /> Reset
        </button>
      </div>
      <textarea
        id={inputId}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={2}
        spellCheck={false}
        className="mt-4 w-full resize-none rounded-2xl bg-cream px-4 py-3 font-mono text-[14px] leading-relaxed ring-1 ring-line-strong outline-none focus:ring-2 focus:ring-accent"
      />

      {canHash ? (
        <dl className="mt-5 space-y-4">
          <div>
            <dt className="text-[12.5px] text-muted">Fingerprint when it was saved</dt>
            <dd className="mt-1.5 font-mono text-[12px] leading-relaxed break-all text-ink/60">
              {original ?? '…'}
            </dd>
          </div>
          <div>
            <dt className="text-[12.5px] text-muted">Fingerprint now</dt>
            <dd className="mt-1.5 font-mono text-[12px] leading-relaxed break-all">
              {current
                ? Array.from(current, (char, index) => (
                    <span
                      key={index}
                      className={char === original?.[index] ? 'text-ink' : 'text-accent-ink'}
                    >
                      {char}
                    </span>
                  ))
                : '…'}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="mt-5 rounded-xl bg-cream p-4 text-sm text-muted">
          Your browser only allows this calculation on secure (https) pages.
        </p>
      )}

      <p
        aria-live="polite"
        className={cn(
          'mt-5 flex items-center gap-2 rounded-xl px-3.5 py-3 text-[14px] font-medium',
          matches ? 'bg-emerald-50 text-emerald-800' : 'bg-accent/10 text-accent-ink',
        )}
      >
        {matches ? (
          <>
            <Check aria-hidden className="size-4 shrink-0" /> Matches the original — nothing has
            changed.
          </>
        ) : (
          <>
            <X aria-hidden className="size-4 shrink-0" /> Doesn’t match — this copy has been
            changed.
          </>
        )}
      </p>
      <p className="mt-4 font-mono text-[12px] text-muted">
        Under the hood: SHA-256, calculated in your browser. Nothing you type is sent anywhere.
      </p>
    </div>
  );
}
