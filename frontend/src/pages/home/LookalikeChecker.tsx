import { ArrowRight, Globe, Search, Smartphone, Stamp } from 'lucide-react';
import { useDeferredValue, useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { MonoLabel } from '@/components/ui/specimen';
import { cn } from '@/lib/cn';
import { diffParts, exampleImitations, generateLookalikes, type Technique } from '@/lib/lookalikes';

const TECHNIQUE_TAG: Record<Technique, string> = {
  'lookalike-character': 'Look-alike letters',
  'added-word': 'Extra word',
  'swapped-letters': 'Typo',
  'different-ending': 'New ending',
  'missing-letter': 'Typo',
  'doubled-letter': 'Typo',
  hyphen: 'Hyphen',
};

/** Clearly fictional sample names to try (no real companies). */
const SAMPLES = ['acme', 'contoso', 'fabrikam'];

/**
 * The home page's working tool: type a brand name and see the kinds of
 * imitations copycats use, with the difference highlighted and explained.
 * Everything is calculated in the browser by `lib/lookalikes.ts`; nothing is
 * looked up or sent anywhere, and the panel says so.
 *
 * A two-part instrument: a dark input console on the left, a white result sheet on the right
 * (v6: framed by the section's corner brackets instead of a second sheet). Result rows re-enter (opacity + transform) when the name
 * changes; with reduced motion they simply appear.
 */
export function LookalikeChecker() {
  const inputId = useId();
  const hintId = useId();
  const [value, setValue] = useState('acme');
  const query = useDeferredValue(value);

  const results = useMemo(() => generateLookalikes(query), [query]);
  const { brand, app, trademark } = useMemo(() => exampleImitations(query), [query]);
  const website =
    results.find((result) => result.technique === 'added-word')?.domain ?? `${brand}-login.com`;

  const examples = [
    { icon: Globe, kind: 'Website', name: website },
    { icon: Smartphone, kind: 'App', name: app },
    { icon: Stamp, kind: 'Trademark', name: trademark },
  ];

  return (
    <div className="relative">
      <div className="relative grid grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-window ring-1 ring-ink/[0.07] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
        {/* ---------- Input console ---------- */}
        <div className="relative flex flex-col overflow-hidden bg-night p-6 text-cream sm:p-8 lg:p-10">
          <form role="search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor={inputId} className="text-[15px] font-medium text-cream">
              Your brand name
            </label>
            <div className="mt-3 flex h-14 items-center gap-3 rounded-2xl bg-cream/[0.06] px-4 ring-1 ring-cream/15 transition-shadow focus-within:ring-2 focus-within:ring-accent-soft">
              <Search aria-hidden className="size-4 shrink-0 text-cream/60" />
              <input
                id={inputId}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                aria-describedby={hintId}
                maxLength={40}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="yourbrand"
                className="min-w-0 flex-1 bg-transparent font-mono text-lg text-cream caret-accent-soft outline-none placeholder:text-cream/40"
              />
              <span aria-hidden className="font-mono text-cream/55">
                .com
              </span>
            </div>
            <p id={hintId} className="mt-3 text-[13px] text-cream/65">
              Runs in your browser. Nothing you type is sent anywhere.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] text-cream/65">Try a sample:</span>
              {SAMPLES.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setValue(sample)}
                  aria-pressed={brand === sample}
                  className={cn(
                    'rounded-full px-3 py-1 font-mono text-[12.5px] ring-1 transition-colors',
                    brand === sample
                      ? 'bg-cream text-night ring-cream'
                      : 'text-cream/80 ring-cream/20 hover:bg-cream/[0.08] hover:text-cream',
                  )}
                >
                  {sample}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-10">
            <p className="text-[13px] font-medium text-cream/70">The same trick in other places</p>
            <ul className="mt-3 divide-y divide-cream/[0.08] rounded-xl bg-night-raised/70 ring-1 ring-cream/10">
              {examples.map((example) => (
                <li key={example.kind} className="flex items-center gap-3 px-4 py-3">
                  <example.icon aria-hidden className="size-4 shrink-0 text-accent-soft" />
                  <span className="w-20 shrink-0 text-[13px] text-cream/65">{example.kind}</span>
                  <span className="min-w-0 truncate font-mono text-[14.5px] text-cream">
                    {example.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 border-t border-cream/10 pt-6 lg:mt-auto">
            <p className="text-[13px] font-medium text-cream/70">
              What the full platform checks next
            </p>
            <ol className="mt-3 space-y-2.5">
              {[
                'Is the name registered, and when?',
                'Is there a live page, and does it look like yours?',
                'Does it ask for passwords or payment?',
              ].map((check, index) => (
                <li key={check} className="flex items-start gap-3 text-[14px] text-cream/85">
                  <span className="mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] text-accent-soft ring-1 ring-accent-soft/40">
                    {index + 1}
                  </span>
                  {check}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ---------- Result sheet ---------- */}
        <div className="min-w-0 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p aria-live="polite" className="text-title font-semibold text-balance">
              {results.length} ways someone could imitate{' '}
              <span className="font-mono text-accent-ink">{brand}.com</span>
            </p>
            <MonoLabel>Possible, not live results</MonoLabel>
          </div>
          <p className="mt-2 text-[15px] text-muted">
            Each one is built the way copycats really do it. The changed part is highlighted.
          </p>

          <ol key={brand} className="mt-6 divide-y divide-line border-y border-line">
            {results.map((result, index) => {
              const [before, changed, after] = diffParts(result.domain, `${brand}.com`);
              return (
                <li
                  key={result.domain}
                  style={{ animationDelay: `${index * 45}ms` }}
                  className="grid animate-scene-in grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3.5 motion-reduce:animate-none"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[15px]">
                      {before}
                      {changed ? (
                        <mark className="rounded bg-accent/10 px-0.5 text-accent-ink">
                          {changed}
                        </mark>
                      ) : (
                        // Nothing to highlight when a letter was removed: mark where it was.
                        <span className="mx-px inline-block h-[1.05em] w-0.5 translate-y-[0.18em] rounded bg-accent" />
                      )}
                      {after}
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-muted">{result.reason}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="hidden text-[13px] text-ink/80 sm:block">
                      {TECHNIQUE_TAG[result.technique]}
                    </p>
                    <p className="font-mono text-[12px] text-muted">{result.matchLabel}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-5 text-[13px] leading-relaxed text-muted">
            These are <strong className="font-medium text-ink">possible</strong> imitations made
            from what you typed, not live results. The full platform checks names like these against
            newly registered domains, app stores and trademark journals.
          </p>
          <Link
            to="/technology"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
          >
            How Similo compares names <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
