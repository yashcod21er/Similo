import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  ACME_DIFFERENCES,
  AcmeSheet,
  CompareSlider,
  IsometricStack,
  LetterSwap,
  Loupe,
  NumberRoll,
  StampSlam,
} from '@/components/scenes';
import { FigCaption, MonoLabel } from '@/components/ui/specimen';
import { cn } from '@/lib/cn';
import { AppIcon } from './app';

/*
 * Exhibits for the "Spot the difference" pages (v6). Each one is a different kind of visual:
 * a letter swap, a compare slider, a loupe, a stamp, big numbers and an isometric stack. They
 * are drawn from shapes and text, never screenshots. Anything that uses sample data (the
 * fictional brand "Acme") carries one discreet mono "FIG." caption that says so.
 */

type Tone = 'light' | 'dark';

/** A size container that fills its stage: `cqw` units inside it follow the stage's own width. */
function Fit({ children }: { children: ReactNode }) {
  return <div className="h-full w-full [container-type:inline-size]">{children}</div>;
}

/* -------------------------------------------------------------- Letter swap */

/**
 * "acme.com" against "acrne.com": the changed letters roll into place. The one look-alike trick
 * everybody recognises, shown at headline size.
 */
export function DomainSwapExhibit({
  tone = 'light',
  index = '01',
  className,
}: {
  tone?: Tone;
  index?: string;
  className?: string;
}) {
  const dark = tone === 'dark';
  const size = 'font-mono text-[clamp(2.25rem,0.8rem+5.4vw,4.75rem)] leading-none';
  return (
    <figure className={cn('w-full min-w-0', className)}>
      <div
        className={cn(
          'relative rounded-lg p-6 sm:p-9',
          dark
            ? 'bg-night-raised ring-1 ring-cream/10'
            : 'bg-white shadow-card ring-1 ring-ink/[0.07]',
        )}
      >
        <MonoLabel tone={tone}>Exhibit A · your name</MonoLabel>
        <p className={cn(size, 'mt-4', dark ? 'text-cream' : 'text-ink')}>acme.com</p>
        <div
          aria-hidden
          className={cn(
            'my-6 flex items-center gap-3 border-t border-dashed pt-4 sm:my-8',
            dark ? 'border-cream/25' : 'border-line-strong',
          )}
        >
          <MonoLabel tone={tone}>
            <span className={dark ? 'text-accent-soft' : 'text-accent-ink'}>≈</span> reads the same
            at a glance
          </MonoLabel>
        </div>
        <MonoLabel tone={tone}>Exhibit B · the copy</MonoLabel>
        <p className={cn(size, 'mt-4', dark ? 'text-cream' : 'text-ink')}>
          <LetterSwap from="acme.com" to="acrne.com" tone={tone} />
        </p>
      </div>
      <FigCaption as="figcaption" index={index} tone={tone} className="mt-5">
        Sample name. “r” and “n” side by side read as “m”.
      </FigCaption>
    </figure>
  );
}

/* ----------------------------------------------------------- Compare slider */

/** Drag between the real sign-in page and the copy. The four differences are outlined. */
export function PageCompareExhibit({
  index = '02',
  className,
}: {
  tone?: Tone;
  index?: string;
  className?: string;
}) {
  return (
    <CompareSlider
      {...(className ? { className } : {})}
      original={<AcmeSheet />}
      copy={<AcmeSheet variant="copy" annotated />}
      notes={ACME_DIFFERENCES}
      caption={`FIG. ${index} — Sample pages of a fictional brand`}
    />
  );
}

/** One store listing, drawn in shapes: icon, name, publisher and what it asks to use. */
function Listing({ copy = false }: { copy?: boolean }) {
  const permissions = copy
    ? ['Camera', 'Notifications', 'SMS messages', 'Contacts']
    : ['Camera', 'Notifications'];
  const mark = 'outline-dashed outline-[max(1.5px,0.25em)] outline-offset-[0.25em] outline-accent';
  return (
    <Fit>
      <div className="flex h-full w-full flex-col justify-center bg-white px-[9%] text-[clamp(10px,3.1cqw,19px)] text-ink">
        <div className="flex items-center gap-[1.2em]">
          <span className="block size-[5.5em] shrink-0 [&>span]:size-full! [&>span]:rounded-[1.4em]!">
            <AppIcon variant={copy ? 'copy' : 'official'} />
          </span>
          <div className="min-w-0">
            <p className={cn('w-fit text-[1.5em] font-semibold tracking-[-0.03em]', copy && mark)}>
              {copy ? 'Acme Wallet Pro' : 'Acme Wallet'}
            </p>
            <p className="mt-[0.5em] flex items-center gap-[0.4em] text-[0.9em] text-muted">
              <span className={cn(copy && mark)}>
                {copy ? 'Acme Apps Studio' : 'Acme Global Ltd'}
              </span>
              {!copy && <Check aria-hidden className="size-[1em] text-emerald-700" />}
            </p>
          </div>
        </div>
        <div className="mt-[1.8em]">
          <MonoLabel>Asks to use</MonoLabel>
          <ul className="mt-[0.7em] flex flex-wrap gap-[0.6em]">
            {permissions.map((permission) => (
              <li
                key={permission}
                className={cn(
                  'rounded-full bg-cream-deep px-[0.9em] py-[0.3em] text-[0.85em]',
                  copy && /SMS|Contacts/.test(permission) && mark,
                )}
              >
                {permission}
              </li>
            ))}
          </ul>
        </div>
        <div
          aria-hidden
          className="mt-[1.8em] flex h-[2.8em] items-center justify-center rounded-full bg-night text-[0.9em] font-medium text-cream"
        >
          Get
        </div>
      </div>
    </Fit>
  );
}

/** Drag between the real app listing and the copycat's. */
export function AppCompareExhibit({
  index = '01',
  className,
}: {
  tone?: Tone;
  index?: string;
  className?: string;
}) {
  return (
    <CompareSlider
      {...(className ? { className } : {})}
      aspect="5 / 4"
      originalLabel="Exhibit A · your app"
      copyLabel="Exhibit B · found in the store"
      ariaLabel="Compare your app listing with the copycat listing"
      original={<Listing />}
      copy={<Listing copy />}
      notes={[
        'The name has “Pro” added.',
        'The publisher is not your company.',
        'It asks to read your messages and contacts, which your app never does.',
      ]}
      caption={`FIG. ${index} — Sample listings, made-up names`}
    />
  );
}

/* -------------------------------------------------------------------- Loupe */

/** The look-alike name at headline size; `marked` outlines the two letters that fool the eye. */
function NameLine({ marked = false }: { marked?: boolean }) {
  return (
    <Fit>
      <div className="flex h-full w-full flex-col justify-center gap-[2cqw] bg-white px-[7%]">
        <p className="font-semibold tracking-[-0.045em] whitespace-nowrap text-ink text-[clamp(1.5rem,9.4cqw,4rem)] leading-none">
          ac
          <span
            className={cn(
              marked &&
                'bg-accent text-white outline-dashed outline-[max(1.5px,0.4cqw)] outline-offset-[0.3cqw] outline-accent',
            )}
          >
            rn
          </span>
          e-login.com
        </p>
        <p
          className={cn(
            'font-mono text-[max(9px,2.2cqw)] tracking-[0.12em] uppercase',
            marked ? 'text-accent-ink' : 'text-muted',
          )}
        >
          {marked ? 'r + n reads as m' : 'Look closer'}
        </p>
      </div>
    </Fit>
  );
}

/**
 * The look-alike name under a loupe: move over it to see that “rn” stands in for “m”. The
 * Loupe scene keeps the lens resting on the letters for touch screens and reduced motion.
 */
export function NameLoupeExhibit({
  tone = 'dark',
  index = '01',
  className,
}: {
  tone?: Tone;
  index?: string;
  className?: string;
}) {
  return (
    <div className={cn('w-full min-w-0', className)}>
      <Loupe
        aspect="5 / 3"
        tone="light"
        focus={{ x: 0.29, y: 0.46 }}
        hint={false}
        description="Magnified: the letters r and n side by side look like the letter m."
        magnified={<NameLine marked />}
      >
        <NameLine />
      </Loupe>
      <FigCaption index={index} tone={tone} className="mt-5">
        Sample name. Move the magnifier over each letter.
      </FigCaption>
    </div>
  );
}

const JOURNAL_ROWS = [
  ['MARATHON TEA', 'Class 30', 'Pg 128'],
  ['ACMEE', 'Class 9, 36', 'Pg 128'],
  ['BLUE HERON', 'Class 25', 'Pg 128'],
  ['NORTHLINE', 'Class 35', 'Pg 129'],
];

/** A trademark journal page drawn as columns of small type; the entry that matters is outlined. */
function JournalSheet({ marked = false }: { marked?: boolean }) {
  return (
    <Fit>
      <div className="h-full w-full bg-white px-[5%] py-[4%] font-mono text-[max(8px,2.4cqw)] leading-tight text-ink/80">
        <p className="flex justify-between border-b border-ink/15 pb-[1.4cqw] tracking-[0.12em] uppercase">
          <span>Trade Marks Journal</span>
          <span>Part 2 · Sample</span>
        </p>
        <ul className="divide-y divide-ink/10">
          {JOURNAL_ROWS.map(([mark, classes, page]) => {
            const hit = mark === 'ACMEE';
            return (
              <li
                key={mark}
                className={cn(
                  'grid grid-cols-[1.4fr_1fr_auto] gap-[2cqw] px-[1cqw] py-[2.6cqw]',
                  hit &&
                    marked &&
                    'bg-accent/15 font-semibold text-ink outline-dashed outline-[max(1.5px,0.3cqw)] outline-accent',
                )}
              >
                <span>{mark}</span>
                <span>{classes}</span>
                <span>{page}</span>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-ink/15 pt-[1.6cqw] tracking-[0.12em] uppercase">
          {marked ? 'ACMEE sounds like ACME · same classes' : 'Applicants and dates continue below'}
        </p>
      </div>
    </Fit>
  );
}

/** A journal page under a loupe: the entry that sounds like your mark is picked out. */
export function JournalLoupeExhibit({
  tone = 'light',
  index = '02',
  className,
}: {
  tone?: Tone;
  index?: string;
  className?: string;
}) {
  return (
    <div className={cn('w-full min-w-0', className)}>
      <Loupe
        aspect="16 / 10"
        tone="light"
        focus={{ x: 0.22, y: 0.37 }}
        hint={false}
        description="Magnified: the entry ACMEE in the journal sounds like the brand ACME and is registered in the same product classes."
        magnified={<JournalSheet marked />}
      >
        <JournalSheet />
      </Loupe>
      <FigCaption index={index} tone={tone} className="mt-5">
        Sample journal page, made-up marks. Move the magnifier to read closer.
      </FigCaption>
    </div>
  );
}

/* -------------------------------------------------------------------- Stamp */

/** An evidence sheet with the ink stamp slamming down on it. Sample capture and fingerprint. */
export function EvidenceStampExhibit({
  tone = 'light',
  index = '01',
  className,
}: {
  tone?: Tone;
  index?: string;
  className?: string;
}) {
  return (
    <figure className={cn('w-full min-w-0', className)}>
      <div className="relative overflow-hidden rounded-lg bg-white p-6 shadow-card ring-1 ring-ink/[0.07] sm:p-9">
        <MonoLabel>Exhibit A · saved capture</MonoLabel>
        <div aria-hidden className="mt-5 space-y-2.5">
          <div className="h-3 w-2/3 rounded-sm bg-cream-deep" />
          <div className="h-3 w-full rounded-sm bg-cream-deep" />
          <div className="h-3 w-5/6 rounded-sm bg-cream-deep" />
          <div className="mt-5 h-10 w-1/2 rounded-md bg-night/90" />
        </div>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-5 border-t border-dashed border-line-strong pt-5">
          <dl className="space-y-2 font-mono text-[12px] leading-snug text-ink/80">
            <div className="flex gap-6">
              <dt className="w-16 text-muted">Captured</dt>
              <dd>8 Nov 2026, 09:42</dd>
            </div>
            <div className="flex gap-6">
              <dt className="w-16 text-muted">SHA-256</dt>
              <dd>9f2c4e…a71e</dd>
            </div>
          </dl>
          <StampSlam
            text="Saved"
            detail="Fingerprint kept"
            className="text-[clamp(1.25rem,0.9rem+1.4vw,1.875rem)]"
          />
        </div>
      </div>
      <FigCaption as="figcaption" index={index} tone={tone} className="mt-5">
        Sample capture and fingerprint, made up.
      </FigCaption>
    </figure>
  );
}

/* ------------------------------------------------------------- Big numbers */

const WINDOWS: { office: string; value: number; unit: string; note?: string }[] = [
  { office: 'India · Trade Marks Registry', value: 4, unit: 'months' },
  { office: 'European Union · EUIPO', value: 3, unit: 'months' },
  { office: 'United States · USPTO', value: 30, unit: 'days', note: 'can be extended' },
];

/**
 * How long each office gives you to object, as three big numbers. General facts (not sample
 * data), so the caption tells people to confirm the exact deadline with their attorney.
 */
export function OppositionNumbers({
  tone = 'dark',
  index = '01',
  className,
}: {
  tone?: Tone;
  index?: string;
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <figure className={cn('w-full min-w-0', className)}>
      <MonoLabel tone={tone}>Time left to object, after publication</MonoLabel>
      <ul
        className={cn(
          'mt-5 divide-y border-y',
          dark ? 'divide-cream/20 border-cream/20' : 'divide-line-strong border-line-strong',
        )}
      >
        {WINDOWS.map((window) => (
          <li
            key={window.office}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5 sm:py-6"
          >
            <span
              className={cn(
                'flex items-baseline gap-3 text-[clamp(3.75rem,2rem+6vw,6.5rem)] leading-[0.85] font-semibold tracking-[-0.06em]',
                dark ? 'text-cream' : 'text-ink',
              )}
            >
              <NumberRoll value={window.value} />
              <span
                className={cn(
                  'text-[clamp(1.25rem,1rem+0.8vw,1.75rem)] tracking-[-0.03em]',
                  dark ? 'text-accent-soft' : 'text-accent',
                )}
              >
                {window.unit}
              </span>
            </span>
            <span className="text-right">
              <MonoLabel tone={tone}>{window.office}</MonoLabel>
              {window.note && (
                <span className="mt-1 block">
                  <MonoLabel tone={tone}>{window.note}</MonoLabel>
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <FigCaption as="figcaption" index={index} tone={tone} className="mt-5">
        General rules, not sample data. Confirm exact deadlines with your attorney.
      </FigCaption>
    </figure>
  );
}

/* --------------------------------------------------------- Isometric stack */

const LAYERS = [
  { label: 'Websites', detail: 'New domain names' },
  { label: 'Apps', detail: 'Store listings' },
  { label: 'Trademarks', detail: 'Journal filings' },
  { label: 'Evidence', detail: 'Saved proof' },
];

/** The four things Similo watches, stacked as sheets over one shared alert list. */
export function PlatformStackExhibit({
  tone = 'light',
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  return (
    <figure className={cn('w-full min-w-0', className)}>
      <IsometricStack
        layers={LAYERS}
        tone={tone}
        ariaLabel="The four things Similo watches, stacked: websites, apps, trademarks and evidence"
      />
      <FigCaption as="figcaption" index="01" tone={tone} className="mt-5">
        Four layers, one alert list.
      </FigCaption>
    </figure>
  );
}
