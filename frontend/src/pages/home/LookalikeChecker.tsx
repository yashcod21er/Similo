import { ArrowRight, Search } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useDeferredValue, useId, useMemo, useState, type PointerEvent } from 'react';
import { Link } from 'react-router';
import { Stage } from '@/components/ui/layout';
import { IdentityHeroVisual } from '@/components/visuals/hero/IdentityHeroVisual';
import { WaveCanvas } from '@/components/visuals/hero/WaveCanvas';
import {
  diffParts,
  exampleImitations,
  generateLookalikes,
  toTitle,
  type Technique,
} from '@/lib/lookalikes';
import { EASE_OUT } from '@/lib/motion';

const TECHNIQUE_TAG: Record<Technique, string> = {
  'lookalike-character': 'Lookalike letters',
  'added-word': 'Extra word',
  'swapped-letters': 'Typo',
  'different-ending': 'New ending',
  'missing-letter': 'Typo',
  'doubled-letter': 'Typo',
  hyphen: 'Hyphen',
};

/**
 * The home page's signature moment: type a brand name and see the kinds of
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

  // Pointer parallax for the orbit visual (mouse only, off for reduced motion).
  const reduceMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, { stiffness: 50, damping: 18 });
  const pointerY = useSpring(rawY, { stiffness: 50, damping: 18 });
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (reduceMotion || event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    rawX.set(((event.clientX - rect.left) / rect.width) * 2 - 1);
    rawY.set(((event.clientY - rect.top) / rect.height) * 2 - 1);
  };
  const onPointerLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <Stage>
      {/* Atmosphere */}
      <div aria-hidden className="bg-dots-dark mask-radial absolute inset-0 -z-10 opacity-70" />
      <div
        aria-hidden
        className="absolute -top-40 left-[18%] -z-10 size-[560px] rounded-full bg-crimson/30 blur-[130px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-40 -z-10 size-[460px] rounded-full bg-[#1b2a55]/60 blur-[120px]"
      />
      <WaveCanvas className="absolute inset-x-0 bottom-0 -z-10 h-[45%] w-full opacity-70" />

      <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_1fr]">
        {/* ---------- Input + orbit ---------- */}
        <div
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-10"
        >
          <form role="search" onSubmit={(event) => event.preventDefault()}>
            <label
              htmlFor={inputId}
              className="font-mono text-[12px] font-medium tracking-[0.08em] text-coral uppercase"
            >
              Try it with your brand
            </label>
            <div className="mt-3 flex h-14 items-center gap-3 rounded-2xl bg-white/[0.07] px-4 ring-1 ring-white/15 transition-shadow focus-within:ring-2 focus-within:ring-coral">
              <Search aria-hidden className="size-5 shrink-0 text-white/50" />
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
                className="min-w-0 flex-1 bg-transparent font-mono text-lg text-white outline-none placeholder:text-white/35"
              />
              <span aria-hidden className="font-mono text-white/60">
                .com
              </span>
            </div>
            <p id={hintId} className="mt-2.5 text-[13px] text-white/55">
              Runs in your browser — nothing you type is sent anywhere.
            </p>
          </form>

          <IdentityHeroVisual
            pointerX={pointerX}
            pointerY={pointerY}
            brand={toTitle(brand)}
            examples={{ website, app, trademark }}
            className="mx-auto my-auto max-w-[580px] pt-6"
          />
        </div>

        {/* ---------- Results ---------- */}
        <div className="min-w-0 border-t border-white/10 p-5 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
          <p aria-live="polite" className="text-title font-semibold text-balance">
            {results.length} ways someone could imitate{' '}
            <span className="font-mono text-coral">{brand}.com</span>
          </p>
          <p className="mt-2 text-[15px] text-white/60">
            Each one is built the way copycats really do it. The changed part is highlighted.
          </p>

          <ol className="mt-6 divide-y divide-white/10 border-y border-white/10">
            <AnimatePresence initial={false} mode="popLayout">
              {results.map((result, index) => {
                const [before, changed, after] = diffParts(result.domain, `${brand}.com`);
                return (
                  <motion.li
                    key={result.domain}
                    layout="position"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT }}
                    className="flex items-center gap-3.5 py-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-[11px] text-white/50 ring-1 ring-white/10">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[15px] text-white">
                        {before}
                        {changed ? (
                          <mark className="rounded bg-crimson/30 px-0.5 text-coral">{changed}</mark>
                        ) : (
                          // Nothing to highlight when a letter was removed: mark where it was.
                          <span className="mx-px inline-block h-[1.05em] w-0.5 translate-y-[0.18em] rounded bg-coral" />
                        )}
                        {after}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-white/55">{result.reason}</p>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11.5px] text-white/70 ring-1 ring-white/10">
                        {TECHNIQUE_TAG[result.technique]}
                      </span>
                      <span className="font-mono text-[11px] text-white/60">
                        {result.matchLabel}
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>

          <p className="mt-6 text-[13px] leading-relaxed text-white/55">
            These are <strong className="font-medium text-white/80">possible</strong> imitations
            made from what you typed — not live results. The full platform checks names like these
            against newly registered domains, app stores and trademark journals.
          </p>
          <Link
            to="/technology"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-coral"
          >
            How Similo compares names <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </div>
    </Stage>
  );
}
