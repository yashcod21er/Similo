import { ArrowRight, Globe, Search, Smartphone, Stamp } from 'lucide-react';
import { useDeferredValue, useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
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

/**
 * The home page's working tool: type a brand name and see the kinds of
 * imitations copycats use, with the difference highlighted and explained.
 * Everything is calculated in the browser by `lib/lookalikes.ts`; nothing is
 * looked up or sent anywhere, and the panel says so.
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
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[1fr_1.4fr]">
      {/* ---------- Input ---------- */}
      <div className="border-b border-line bg-cream p-6 sm:p-8 lg:border-r lg:border-b-0">
        <form role="search" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor={inputId} className="text-[15px] font-medium">
            Your brand name
          </label>
          <div className="mt-3 flex h-12 items-center gap-2.5 rounded-lg border border-line-strong bg-white px-3.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
            <Search aria-hidden className="size-4 shrink-0 text-muted" />
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
              className="min-w-0 flex-1 bg-transparent font-mono text-base outline-none placeholder:text-muted/70"
            />
            <span aria-hidden className="font-mono text-muted">
              .com
            </span>
          </div>
          <p id={hintId} className="mt-2.5 text-[13px] text-muted">
            Runs in your browser. Nothing you type is sent anywhere.
          </p>
        </form>

        <div className="mt-8">
          <p className="text-[13px] font-medium text-muted">The same trick in other places</p>
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-white">
            {examples.map((example) => (
              <li key={example.kind} className="flex items-center gap-3 px-4 py-3">
                <example.icon aria-hidden className="size-4 shrink-0 text-accent" />
                <span className="w-20 shrink-0 text-[13px] text-muted">{example.kind}</span>
                <span className="min-w-0 truncate font-mono text-[14.5px]">{example.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- Results ---------- */}
      <div className="min-w-0 p-6 sm:p-8">
        <p aria-live="polite" className="text-title font-semibold text-balance">
          {results.length} ways someone could imitate{' '}
          <span className="font-mono text-accent-ink">{brand}.com</span>
        </p>
        <p className="mt-2 text-[15px] text-muted">
          Each one is built the way copycats really do it. The changed part is highlighted.
        </p>

        <ol className="mt-5 divide-y divide-line border-y border-line">
          {results.map((result) => {
            const [before, changed, after] = diffParts(result.domain, `${brand}.com`);
            return (
              <li key={result.domain} className="flex items-center justify-between gap-4 py-3.5">
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
          These are <strong className="font-medium text-ink">possible</strong> imitations made from
          what you typed, not live results. The full platform checks names like these against newly
          registered domains, app stores and trademark journals.
        </p>
        <Link
          to="/technology"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
        >
          How Similo compares names <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </div>
  );
}
