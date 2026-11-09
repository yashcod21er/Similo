import {
  Check,
  FileText,
  Fingerprint,
  Globe,
  ImageIcon,
  NotebookPen,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AppWindow } from '@/components/motion';
import { cn } from '@/lib/cn';
import { Chip, MiniPage, PaneLabel, SceneFigure, Show } from './scene-kit';
import { usePanelShown, useSceneStep, WINDOW_BODY } from './scene-hooks';

/*
 * Investigation & Evidence scenes. Sample case "Fake sign-in pages"; every name, time and
 * fingerprint is made up. The fingerprint demo at the end is real: it hashes in the browser.
 */

/* ---------------------------------------------------------------- Timeline */

interface CaseEvent {
  id: string;
  time: string;
  icon: LucideIcon;
  title: string;
  detail: ReactNode;
}

const EVENTS: CaseEvent[] = [
  {
    id: 'capture',
    time: '09:42',
    icon: ImageIcon,
    title: 'Page captured',
    detail: 'acrne-login.com, full page',
  },
  {
    id: 'hash',
    time: '09:42',
    icon: Fingerprint,
    title: 'Fingerprint recorded',
    detail: <span className="font-mono">SHA-256 9f2c…a71e</span>,
  },
  {
    id: 'rdap',
    time: '09:51',
    icon: Globe,
    title: 'Registration record saved',
    detail: 'RDAP: registered 2 days ago',
  },
  {
    id: 'note',
    time: '10:07',
    icon: NotebookPen,
    title: 'Analyst note',
    detail: 'The sign-in form sends passwords to another server.',
  },
  {
    id: 'draft',
    time: '10:20',
    icon: FileText,
    title: 'Draft takedown letter prepared',
    detail: 'Written from the saved evidence, for human review',
  },
  {
    id: 'approved',
    time: '10:48',
    icon: UserCheck,
    title: 'Approved by Legal reviewer',
    detail: 'Two edits made. Ready for a person to send.',
  },
];

/** The first `count` events of a case, joined by a line. */
export function CaseTimeline({ count, className }: { count: number; className?: string }) {
  return (
    <ol className={cn('relative space-y-3.5', className)}>
      <span aria-hidden className="absolute top-3 bottom-3 left-[13px] w-px bg-white/[0.1]" />
      {EVENTS.map((event, index) => {
        const done = index < count;
        const latest = index === count - 1;
        return (
          <Show key={event.id} as="li" when={done} y={8} className="relative flex gap-3">
            <span
              className={cn(
                'relative z-10 flex size-[27px] shrink-0 items-center justify-center rounded-full ring-1 transition-colors duration-500 motion-reduce:transition-none',
                latest
                  ? 'bg-accent text-white ring-accent'
                  : 'bg-[#26231f] text-accent-soft ring-white/[0.12]',
              )}
            >
              <event.icon aria-hidden className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-px">
              <p className="flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] font-medium text-cream">{event.title}</span>
                <span className="font-mono text-[10.5px] text-cream/60">{event.time}</span>
              </p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-cream/65">{event.detail}</p>
            </div>
          </Show>
        );
      })}
    </ol>
  );
}

/* ----------------------------------------------------------- Draft letter */

/** The takedown letter draft, drawn as a paper sheet. `approved` adds the reviewer's stamp. */
export function DraftLetter({ shown, approved }: { shown: boolean; approved: boolean }) {
  return (
    <Show when={shown} y={12}>
      <div className="rounded-lg bg-cream p-3.5 text-ink shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold">Takedown request</p>
          <Chip tone="light" level={approved ? 'ok' : 'review'}>
            {approved ? (
              <>
                <Check aria-hidden className="size-3" /> Approved
              </>
            ) : (
              'Draft · for human review'
            )}
          </Chip>
        </div>
        <p className="mt-2 text-[10.5px] leading-snug text-muted">
          To: Example Registrar, Inc. · Abuse team
        </p>
        <div aria-hidden className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-ink/15" />
          <div className="h-1.5 w-[94%] rounded bg-ink/15" />
          <div className="h-1.5 w-[97%] rounded bg-ink/15" />
          <div className="h-1.5 w-[60%] rounded bg-ink/15" />
        </div>
        <p className="mt-3 text-[10.5px] font-medium text-muted">Attached evidence</p>
        <ul className="mt-1 space-y-0.5 font-mono text-[10.5px] text-ink/80">
          <li>page-capture.png · 9f2c…a71e</li>
          <li>registration-record.json · 41bd…0c93</li>
        </ul>
        <p
          className={cn(
            'mt-3 flex items-center gap-1.5 border-t border-ink/10 pt-2.5 text-[10.5px] transition-opacity duration-500 motion-reduce:transition-none',
            approved ? 'text-emerald-800 opacity-100' : 'text-muted opacity-100',
          )}
        >
          {approved ? (
            <>
              <ShieldCheck aria-hidden className="size-3.5 shrink-0" />
              Approved by the legal reviewer. A person sends it.
            </>
          ) : (
            'A person edits, approves and sends it.'
          )}
        </p>
      </div>
    </Show>
  );
}

/* -------------------------------------------------------------- Hero scene */

const STEP_COUNT = 9;

/** The Investigation page's hero scene: a case timeline being assembled. */
export function EvidenceScene({
  tone = 'dark',
  index,
}: {
  /** The band the scene sits on (sets the caption colour; the window stays dark). */
  tone?: 'light' | 'dark';
  index?: string;
} = {}) {
  const { ref, step } = useSceneStep(STEP_COUNT, 1300);
  const count = Math.min(step + 1, EVENTS.length);
  return (
    <SceneFigure
      tone={tone}
      {...(index ? { index } : {})}
      label="Illustrative example: a case timeline being built. A page screenshot is captured, its fingerprint is recorded, a registration record and an analyst note are added, a draft takedown letter is prepared, and a legal reviewer approves it for a person to send."
    >
      <AppWindow tone="dark" title="Case 0142" url="app.similo.example/cases/fake-sign-in-pages">
        <div ref={ref} className={cn(WINDOW_BODY, 'p-4 @lg:p-5')}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] pb-3.5">
            <div>
              <p className="text-[14px] font-semibold tracking-[-0.01em] text-cream">
                Fake sign-in pages
              </p>
              <p className="mt-0.5 text-[11.5px] text-cream/60">3 alerts linked · Owner: analyst</p>
            </div>
            <Chip level="high">High priority</Chip>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-5 @lg:grid-cols-[1.15fr_1fr]">
            <div>
              <PaneLabel>Timeline</PaneLabel>
              <CaseTimeline count={count} className="mt-3" />
            </div>
            <div>
              <PaneLabel>Letter</PaneLabel>
              <div className="mt-3">
                <DraftLetter shown={step >= 4} approved={step >= 5} />
              </div>
            </div>
          </div>
        </div>
      </AppWindow>
    </SceneFigure>
  );
}

/* ----------------------------------------------------------- Story panels */

function StoryWindow({
  title,
  url,
  children,
}: {
  title: string;
  url: string;
  children: ReactNode;
}) {
  return (
    <AppWindow tone="dark" title={title} url={url}>
      <div className={cn(WINDOW_BODY, 'p-4 @lg:p-5')}>{children}</div>
    </AppWindow>
  );
}

const LINKED = [
  { name: 'acrne-login.com', note: 'Website', level: 'high' as const },
  { name: 'acme-secure-login.net', note: 'Website', level: 'high' as const },
  { name: 'Acme Wallet Pro', note: 'App', level: 'medium' as const },
];

/** Step 1: related alerts grouped into one case with an owner and priority. */
export function CaseOpenPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: three related alerts grouped into one case with an owner and a priority.">
      <div ref={ref}>
        <StoryWindow title="New case" url="app.similo.example/cases/new">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-cream">Fake sign-in pages</p>
              <p className="mt-0.5 text-[11.5px] text-cream/60">Owner: analyst · Status: open</p>
            </div>
            <Chip level="high">High priority</Chip>
          </div>
          <PaneLabel className="mt-5">Linked alerts</PaneLabel>
          <ul className="mt-2.5 space-y-2">
            {LINKED.map((item, index) => (
              <Show
                key={item.name}
                as="li"
                when={shown}
                delay={index * 130}
                y={8}
                className="flex items-center gap-3 rounded-lg bg-white/[0.035] px-3 py-2.5 ring-1 ring-white/[0.06]"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-cream">
                  {item.name}
                </span>
                <span className="text-[11px] text-cream/60">{item.note}</span>
                <Chip level={item.level}>{item.level === 'high' ? 'High' : 'Medium'}</Chip>
              </Show>
            ))}
          </ul>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

const FILES = [
  {
    icon: ImageIcon,
    name: 'Screenshot of the sign-in page',
    file: 'page-capture.png',
    hash: '9f2c…a71e',
  },
  {
    icon: Globe,
    name: 'Who registered the website',
    file: 'registration-record.json',
    hash: '41bd…0c93',
  },
  { icon: FileText, name: 'Copy of the page code', file: 'page-source.html', hash: 'e07a…5b2d' },
];

/** Step 2: files saved with where and when they came from, each with a fingerprint. */
export function EvidenceFilesPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: three saved evidence files, each with a fingerprint, all still matching.">
      <div ref={ref}>
        <StoryWindow title="Evidence" url="app.similo.example/cases/fake-sign-in-pages/evidence">
          <PaneLabel>Saved evidence</PaneLabel>
          <ul className="mt-2.5 space-y-2">
            {FILES.map((item, index) => (
              <Show
                key={item.file}
                as="li"
                when={shown}
                delay={index * 140}
                y={8}
                className="flex items-center gap-3 rounded-lg bg-white/[0.035] p-2.5 ring-1 ring-white/[0.06]"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-accent-soft">
                  <item.icon aria-hidden className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] text-cream">{item.name}</span>
                  <span className="block truncate font-mono text-[10.5px] text-cream/60">
                    {item.file}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 font-mono text-[10.5px] text-emerald-300">
                  <Fingerprint aria-hidden className="size-3" /> {item.hash}
                </span>
              </Show>
            ))}
          </ul>
          <Show
            when={shown}
            delay={500}
            className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-400/10 px-3 py-2.5 text-[12px] text-emerald-200 ring-1 ring-emerald-400/25"
          >
            <ShieldCheck aria-hidden className="size-4 shrink-0" />
            All 3 files still match their original fingerprints
          </Show>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 3: one shared timeline of notes and changes. */
export function CaseTeamPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  const notes = [
    [
      'Analyst',
      '10:07',
      'The sign-in form sends passwords to another server. Escalating to legal.',
    ],
    ['Legal reviewer', '10:31', 'Agreed. Please add the registration record to the letter.'],
    ['Analyst', '10:40', 'Added. Letter is ready for review.'],
  ];
  return (
    <SceneFigure label="Illustrative example: a shared case timeline of notes between an analyst and a legal reviewer, with every action recorded.">
      <div ref={ref}>
        <StoryWindow
          title="Case timeline"
          url="app.similo.example/cases/fake-sign-in-pages/timeline"
        >
          <ul className="space-y-3">
            {notes.map(([who, time, text], index) => (
              <Show
                key={time}
                as="li"
                when={shown}
                delay={index * 150}
                y={8}
                className="rounded-lg bg-white/[0.035] p-3 ring-1 ring-white/[0.06]"
              >
                <p className="flex items-baseline justify-between text-[11.5px]">
                  <span className="font-medium text-accent-soft">{who}</span>
                  <span className="font-mono text-cream/60">{time}</span>
                </p>
                <p className="mt-1 text-[12.5px] leading-snug text-cream/85">{text}</p>
              </Show>
            ))}
          </ul>
          <p className="mt-4 text-[11.5px] text-cream/60">
            Every view, change and approval is written to the audit log with a name and a time.
          </p>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 4: the draft letter and a person's approval. */
export function CaseDecidePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: a draft takedown letter written from the case evidence, approved by a legal reviewer and ready for a person to send.">
      <div ref={ref}>
        <StoryWindow
          title="Takedown letter"
          url="app.similo.example/cases/fake-sign-in-pages/letter"
        >
          <DraftLetter shown approved={shown} />
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/* -------------------------------------------------- A page that disappears */

/** The problem in one picture: the fake page is live on day 1 and gone on day 4, but a saved copy remains. */
export function VanishingPage() {
  return (
    <SceneFigure
      tone="light"
      label="Illustrative example: a fake sign-in page that is online on day one and gone by day four. Similo's saved copy of the page, with its fingerprint, is still there."
      index="02"
      caption="Sample page and fingerprint, made up."
    >
      <div className="rounded-2xl bg-cream-deep/70 p-4 shadow-card ring-1 ring-line sm:p-5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="mb-2 text-[12.5px] font-medium text-muted">Day 1: online</p>
            <MiniPage url="acrne-login.com/secure" copy />
          </div>
          <div>
            <p className="mb-2 text-[12.5px] font-medium text-muted">Day 4: gone</p>
            <div className="flex aspect-[1.05] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong bg-cream/60 px-3 text-center">
              <span className="text-[13px] font-semibold text-ink">Page not found</span>
              <span className="text-[11.5px] text-muted">The site was taken offline</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-white px-3.5 py-3 ring-1 ring-line">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cream text-accent-ink ring-1 ring-line">
            <Fingerprint aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">
              Saved copy kept · day 1, 09:42
            </p>
            <p className="truncate font-mono text-[11.5px] text-muted">SHA-256 9f2c…a71e</p>
          </div>
          <Chip tone="light" level="ok">
            <Check aria-hidden className="size-3" /> Unchanged
          </Chip>
        </div>
      </div>
    </SceneFigure>
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
    <div className={cn('rounded-2xl bg-white p-6 shadow-card ring-1 ring-line sm:p-7', className)}>
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
        className="mt-4 w-full resize-none rounded-xl bg-cream px-4 py-3 font-mono text-[14px] leading-relaxed ring-1 ring-line-strong outline-none focus:ring-2 focus:ring-accent"
      />

      {canHash ? (
        <dl className="mt-5 space-y-4">
          <div>
            <dt className="text-[12.5px] text-muted">Fingerprint when it was saved</dt>
            <dd className="mt-1.5 font-mono text-[12px] leading-relaxed break-all text-ink/70">
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
            <Check aria-hidden className="size-4 shrink-0" /> Matches the original: nothing has
            changed.
          </>
        ) : (
          <>
            <X aria-hidden className="size-4 shrink-0" /> Doesn’t match: this copy has been changed.
          </>
        )}
      </p>
      <p className="mt-4 font-mono text-[12px] text-muted">
        Under the hood: SHA-256, calculated in your browser. Nothing you type is sent anywhere.
      </p>
    </div>
  );
}
