import { BadgeCheck, Check, FileText, Search, ShieldAlert } from 'lucide-react';
import { useRef, type ReactNode } from 'react';
import { AppWindow } from '@/components/motion';
import { cn } from '@/lib/cn';
import { Chip, DecisionBar, PaneLabel, SceneFigure, Show, SignalBar } from './scene-kit';
import { usePanelShown, useSceneStep, WINDOW_BODY } from './scene-hooks';

/*
 * App Intelligence scenes. Sample brand "Acme"; every app, publisher and number is made up.
 * The icons are drawn as simple shapes: the copy is the same shield with small differences.
 */

/* ---------------------------------------------------------------- App icon */

export function AppIcon({
  variant,
  className,
}: {
  variant: 'official' | 'copy';
  className?: string;
}) {
  const official = variant === 'official';
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-[14px] shadow-[0_6px_16px_-6px_rgb(0_0_0/0.6)]',
        official
          ? 'bg-linear-to-br from-accent-soft to-accent'
          : 'bg-linear-to-br from-[#f2a06a] to-[#a8460c]',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[56%]">
        <path
          d="M12 3 5 5.6v5.6c0 4.6 3 8.5 7 9.8 4-1.3 7-5.2 7-9.8V5.6L12 3Z"
          fill="none"
          stroke="white"
          strokeWidth={official ? 1.7 : 2.3}
          strokeLinejoin="round"
          transform={official ? undefined : 'translate(0.6 0.4)'}
        />
        {!official && <circle cx="12.6" cy="11.4" r="1.8" fill="white" />}
      </svg>
    </span>
  );
}

/* ----------------------------------------------------------- Listing cards */

interface Listing {
  variant: 'official' | 'copy';
  label: string;
  name: string;
  publisher: string;
  verified: boolean;
  permissions: { name: string; extra?: boolean }[];
}

const OFFICIAL: Listing = {
  variant: 'official',
  label: 'Your app',
  name: 'Acme Wallet',
  publisher: 'Acme Global Ltd',
  verified: true,
  permissions: [{ name: 'Camera' }, { name: 'Notifications' }],
};

const COPY: Listing = {
  variant: 'copy',
  label: 'Found in the store',
  name: 'Acme Wallet Pro',
  publisher: 'Acme Apps Studio',
  verified: false,
  permissions: [
    { name: 'Camera' },
    { name: 'Notifications' },
    { name: 'SMS messages', extra: true },
    { name: 'Contacts', extra: true },
  ],
};

export function ListingCard({ listing, shown }: { listing: Listing; shown: boolean }) {
  const copy = listing.variant === 'copy';
  return (
    <Show when={shown} y={10} className="h-full">
      <div
        className={cn(
          'h-full rounded-xl p-3 ring-1 @lg:p-3.5',
          copy ? 'bg-accent/[0.1] ring-accent/50' : 'bg-white/[0.035] ring-white/[0.07]',
        )}
      >
        <p className={cn('text-[11px] font-medium', copy ? 'text-accent-soft' : 'text-cream/60')}>
          {listing.label}
        </p>
        <div className="mt-2.5 flex items-center gap-2.5">
          <AppIcon variant={listing.variant} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-cream">{listing.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-cream/65">
              {listing.verified ? (
                <BadgeCheck aria-hidden className="size-3 shrink-0 text-emerald-300" />
              ) : (
                <ShieldAlert aria-hidden className="size-3 shrink-0 text-accent-soft" />
              )}
              <span className="truncate">{listing.publisher}</span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-[10.5px] font-medium text-cream/60">Asks to use</p>
        <ul className="mt-1.5 flex flex-wrap gap-1">
          {listing.permissions.map((permission) => (
            <li
              key={permission.name}
              className={cn(
                'rounded px-1.5 py-0.5 text-[10.5px]',
                permission.extra
                  ? 'bg-accent/25 font-medium text-accent-soft ring-1 ring-accent/40'
                  : 'bg-white/[0.07] text-cream/70',
              )}
            >
              {permission.name}
            </li>
          ))}
        </ul>
      </div>
    </Show>
  );
}

/* ----------------------------------------------------------- Named signals */

export function AppSignals({ shownCount }: { shownCount: number }) {
  return (
    <div className="space-y-3">
      <SignalBar
        label="Icon similarity"
        value={91}
        shown={shownCount >= 1}
        note="Same shield, slightly different colour and line"
      />
      <SignalBar
        label="Name similarity"
        value={84}
        shown={shownCount >= 2}
        delay={120}
        note="Your name plus “Pro”"
      />
      <Show when={shownCount >= 3} y={5}>
        <div className="flex items-center justify-between gap-3 text-[12.5px]">
          <span className="text-cream/85">Publisher</span>
          <Chip level="high">Not on your list</Chip>
        </div>
      </Show>
      <Show when={shownCount >= 4} y={5}>
        <div className="flex items-center justify-between gap-3 text-[12.5px]">
          <span className="text-cream/85">Permissions</span>
          <Chip level="medium">2 more than your app</Chip>
        </div>
      </Show>
    </div>
  );
}

/* -------------------------------------------------------------- Hero scene */

const STEP_COUNT = 10;

/** The App page's hero scene: your listing, the copycat, named signals, a person decides. */
export function AppScene({
  tone = 'dark',
  index,
}: {
  /** The band the scene sits on (sets the caption colour; the window stays dark). */
  tone?: 'light' | 'dark';
  index?: string;
} = {}) {
  const { ref, step } = useSceneStep(STEP_COUNT, 1150);
  const signals = step >= 3 ? Math.min(step - 2, 4) : 0;
  const stage = step >= 8 ? 2 : step >= 7 ? 1 : 0;
  return (
    <SceneFigure
      tone={tone}
      {...(index ? { index } : {})}
      label="Illustrative example: an app store listing for a copycat app next to your real app, with separate icon and name similarity scores, a publisher check and a permissions check, then a person reviews it."
    >
      <AppWindow tone="dark" title="App listings" url="app.similo.example/apps">
        <div ref={ref} className={cn(WINDOW_BODY, 'p-4 @lg:p-5')}>
          <div className="grid grid-cols-2 items-stretch gap-3">
            <ListingCard listing={OFFICIAL} shown={step >= 0} />
            <ListingCard listing={COPY} shown={step >= 1} />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-5 @lg:grid-cols-[1.15fr_1fr]">
            <div>
              <PaneLabel>Signals</PaneLabel>
              <div className="mt-2.5">
                <AppSignals shownCount={signals} />
              </div>
            </div>
            <div className="@lg:pt-6">
              <DecisionBar
                stage={stage}
                approvedLabel="Approved for store complaint"
                approvedNote="Approved by the legal reviewer. A draft complaint is ready; a person sends it."
              />
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

const SEARCH_RESULTS = [
  {
    name: 'Acme Wallet',
    who: 'Acme Global Ltd',
    note: 'Your app',
    level: 'ok' as const,
    variant: 'official' as const,
  },
  {
    name: 'Acme Wallet Pro',
    who: 'Acme Apps Studio',
    note: 'Looks like yours',
    level: 'high' as const,
    variant: 'copy' as const,
  },
  {
    name: 'Acme Rewards',
    who: 'Example Partner Ltd',
    note: 'Approved partner',
    level: 'ok' as const,
    variant: 'official' as const,
  },
];

/** Step 1: a store search for your brand, results marked. */
export function AppSearchPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: a search of an app store for the brand name, with the results marked as your app, a look-alike and an approved partner.">
      <div ref={ref}>
        <StoryWindow title="App search" url="app.similo.example/apps/search">
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2 text-[13px] ring-1 ring-white/[0.08]">
            <Search aria-hidden className="size-3.5 text-cream/60" />
            <span className="text-cream">acme</span>
            <span className="ml-auto text-[11px] text-cream/60">
              your name and common spellings
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {SEARCH_RESULTS.map((result, index) => (
              <Show
                key={result.name}
                as="li"
                when={shown}
                delay={index * 130}
                y={8}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1',
                  result.level === 'high'
                    ? 'bg-accent/[0.1] ring-accent/50'
                    : 'bg-white/[0.035] ring-white/[0.06]',
                )}
              >
                <AppIcon variant={result.variant} className="size-9 rounded-[10px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-cream">{result.name}</p>
                  <p className="truncate text-[11px] text-cream/60">{result.who}</p>
                </div>
                <Chip level={result.level === 'high' ? 'high' : 'ok'}>{result.note}</Chip>
              </Show>
            ))}
          </ul>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 2: each part of the listing compared with yours, separately. */
export function AppComparePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: your app icon next to the look-alike icon, with separate icon, name, publisher and permission checks.">
      <div ref={ref}>
        <StoryWindow title="Compare" url="app.similo.example/apps/acme-wallet-pro">
          <div className="flex items-center justify-center gap-5 rounded-xl bg-white/[0.035] py-5 ring-1 ring-white/[0.06]">
            <figure className="flex flex-col items-center gap-2">
              <AppIcon variant="official" className="size-16 rounded-[18px]" />
              <figcaption className="text-[11px] text-cream/65">Yours</figcaption>
            </figure>
            <span aria-hidden className="text-[22px] text-cream/60">
              ≈
            </span>
            <figure className="flex flex-col items-center gap-2">
              <AppIcon variant="copy" className="size-16 rounded-[18px]" />
              <figcaption className="text-[11px] text-accent-soft">The copy</figcaption>
            </figure>
          </div>
          <div className="mt-5">
            <AppSignals shownCount={shown ? 4 : 0} />
          </div>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 3: partners are recognised once; a copycat is confirmed. */
export function AppReviewPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: a partner's app is on an allow-list and never alerted, while the look-alike is confirmed as a copycat by a person.">
      <div ref={ref}>
        <StoryWindow title="Review" url="app.similo.example/apps/review">
          <PaneLabel>Allow-list</PaneLabel>
          <ul className="mt-2.5 divide-y divide-white/[0.06] rounded-lg bg-white/[0.035] ring-1 ring-white/[0.06]">
            {[
              ['Acme Wallet', 'Acme Global Ltd', 'Your app'],
              ['Acme Rewards', 'Example Partner Ltd', 'Approved partner'],
            ].map(([name, who, tag], index) => (
              <Show
                key={name}
                as="li"
                when={shown}
                delay={index * 120}
                y={6}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <Check aria-hidden className="size-3" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-cream">
                    {name}
                  </span>
                  <span className="block truncate text-[11px] text-cream/60">{who}</span>
                </span>
                <span className="text-[11px] text-cream/65">{tag}</span>
              </Show>
            ))}
          </ul>
          <div className="mt-5">
            <PaneLabel>Waiting for a decision</PaneLabel>
            <div className="mt-2.5">
              <DecisionBar
                stage={shown ? 2 : 1}
                approvedLabel="Confirmed as a copycat"
                approvedNote="Confirmed by the legal reviewer. Evidence is being saved for the complaint."
              />
            </div>
          </div>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 4: evidence saved and a complaint drafted for a person to send. */
export function AppRespondPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: the saved listing evidence and a draft complaint to the app store, waiting for a person to approve and send it.">
      <div ref={ref}>
        <StoryWindow title="Respond" url="app.similo.example/apps/acme-wallet-pro/complaint">
          <PaneLabel>Saved evidence</PaneLabel>
          <ul className="mt-2 divide-y divide-white/[0.06]">
            {[
              ['Listing page', 'captured 10:02'],
              ['Icon and screenshots', 'captured 10:02'],
              ['Publisher details', 'captured 10:03'],
            ].map(([name, when], index) => (
              <Show
                key={name}
                as="li"
                when={shown}
                delay={index * 110}
                y={5}
                className="flex items-center gap-2.5 py-2 text-[12.5px]"
              >
                <FileText aria-hidden className="size-3.5 shrink-0 text-accent-soft" />
                <span className="flex-1 text-cream/90">{name}</span>
                <span className="font-mono text-[10.5px] text-cream/60">{when}</span>
              </Show>
            ))}
          </ul>
          <div className="mt-4 rounded-lg bg-cream p-3.5 text-ink">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold">Draft complaint to the store</p>
              <Chip tone="light" level="review">
                Draft
              </Chip>
            </div>
            <div aria-hidden className="mt-2.5 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-ink/15" />
              <div className="h-1.5 w-[92%] rounded bg-ink/15" />
              <div className="h-1.5 w-[70%] rounded bg-ink/15" />
            </div>
            <p className="mt-2.5 text-[11px] text-muted">A person edits, approves and sends it.</p>
          </div>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/* ------------------------------------------- What a customer sees in the store */

const STORE_RESULTS = [
  { name: 'Acme Wallet Pro', who: 'Acme Apps Studio', variant: 'copy' as const },
  { name: 'Acme Wallet', who: 'Acme Global Ltd', variant: 'official' as const },
  {
    name: 'Wallet Tracker Lite',
    who: 'Example Studio Ltd',
    variant: 'official' as const,
  },
];

/** A store search as a customer sees it, on a light band. The copy sits first, and looks right. */
export function StoreSearchLight() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure
      tone="light"
      label="Illustrative example: an app store search for the brand name. A look-alike app is listed first and its icon is almost the same as the real app's icon."
      caption="Illustrative example: a store search as a customer sees it. The apps and publishers are made up."
    >
      <div ref={ref}>
        <AppWindow tone="light" title="App store" url="store.example/search">
          <div className="p-4 @lg:p-5">
            <div className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2 text-[13px] ring-1 ring-line">
              <Search aria-hidden className="size-3.5 text-muted" />
              <span className="text-ink">acme wallet</span>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {STORE_RESULTS.map((result, index) => (
                <Show
                  key={result.name}
                  as="li"
                  when={shown}
                  delay={index * 120}
                  y={8}
                  className="flex items-center gap-3 py-3"
                >
                  <AppIcon variant={result.variant} className="size-12 rounded-[14px]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">{result.name}</p>
                    <p className="truncate text-[12px] text-muted">{result.who}</p>
                  </div>
                  <span className="rounded-full bg-cream-deep px-3 py-1 text-[12px] font-semibold text-ink">
                    Get
                  </span>
                </Show>
              ))}
            </ul>
          </div>
        </AppWindow>
      </div>
    </SceneFigure>
  );
}
