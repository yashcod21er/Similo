import { useRef, type CSSProperties } from 'react';
import { EASE_OUT_EXPO_CSS } from '@/components/motion/easing';
import { useInView, usePrefersReducedMotion } from '@/components/motion/hooks';
import { cn } from '@/lib/cn';

/*
 * A look-alike domain, caught in the act: `acme.com` becomes `acrne.com` when it scrolls into
 * view. Only the letters that differ move: the old ones roll up out of a mask, the new ones
 * roll in from below in burnt orange, and the rest of the name slides across to close the gap.
 * The text is set in Geist Mono and sized in `ch`, so it lines up exactly.
 *
 * Reads as the final state ("acrne.com, a look-alike of acme.com") to screen readers. With
 * reduced motion, the final state shows at once.
 */

interface Parts {
  prefix: string;
  fromMiddle: string[];
  toMiddle: string[];
  suffix: string;
}

/** Splits two strings into what they share at the start and end, and what changed between. */
function splitChange(from: string, to: string): Parts {
  const a = [...from];
  const b = [...to];
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let end = 0;
  while (
    end < a.length - start &&
    end < b.length - start &&
    a[a.length - 1 - end] === b[b.length - 1 - end]
  ) {
    end += 1;
  }
  return {
    prefix: a.slice(0, start).join(''),
    fromMiddle: a.slice(start, a.length - end),
    toMiddle: b.slice(start, b.length - end),
    suffix: a.slice(a.length - end).join(''),
  };
}

const roll = (delay: number) => `transform 760ms ${EASE_OUT_EXPO_CSS} ${delay}ms`;
const START_DELAY = 480;

export function LetterSwap({
  from,
  to,
  tone = 'light',
  annotate = true,
  className,
}: {
  /** The genuine name, e.g. `acme.com`. */
  from: string;
  /** The look-alike, e.g. `acrne.com`. */
  to: string;
  /** `dark` switches the orange to the lighter shade that reads on night. */
  tone?: 'light' | 'dark';
  /** Show the small bracket and "m → rn" note under the changed letters. */
  annotate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const seen = useInView(ref, { once: true, rootMargin: '0px 0px -15% 0px' });
  const swapped = reduced || seen;

  const { prefix, fromMiddle, toMiddle, suffix } = splitChange(from, to);
  const unchanged = fromMiddle.length === 0 && toMiddle.length === 0;
  const width = Math.max(fromMiddle.length, toMiddle.length);
  // Where the tail of the name sits before and after the swap, in character widths.
  const tailFrom = fromMiddle.length - width;
  const tailTo = toMiddle.length - width;

  const vars = {
    '--swap-big': tone === 'dark' ? 'var(--color-accent-soft)' : 'var(--color-accent)',
    '--swap-small': tone === 'dark' ? 'var(--color-accent-soft)' : 'var(--color-accent-ink)',
  } as CSSProperties;

  const description =
    from === to
      ? to
      : `${to}, a look-alike of ${from}: ${
          fromMiddle.length ? `“${fromMiddle.join('')}” ` : ''
        }${fromMiddle.length && toMiddle.length ? 'is replaced by' : toMiddle.length ? 'adds' : 'is removed'}${
          toMiddle.length ? ` “${toMiddle.join('')}”` : ''
        }`;

  const motionless = reduced ? 'transition-none' : '';

  return (
    <span
      ref={ref}
      className={cn('relative inline-block font-mono whitespace-nowrap', className)}
      style={vars}
    >
      <span className="sr-only">{description}</span>
      <span aria-hidden>
        {unchanged ? (
          <span>{to}</span>
        ) : (
          <>
            <span>{prefix}</span>
            {/* The changed letters. The wrapper is as wide as the longer of the two spellings and
                clips (not hides) its overflow, so letters keep the text's own baseline. */}
            <span
              className="relative inline-block leading-none [clip-path:inset(-0.14em_-0.04em_-0.2em_-0.04em)]"
              style={{ width: `${width}ch` }}
            >
              <span className="invisible">{' '.repeat(width)}</span>
              {fromMiddle.map((char, index) => (
                <span
                  key={`out-${index}`}
                  className={cn('absolute top-0 left-0 block w-[1ch]', motionless)}
                  style={{
                    left: `${index}ch`,
                    transform: swapped ? 'translateY(-125%)' : 'translateY(0)',
                    transition: roll(START_DELAY + index * 55),
                  }}
                >
                  {char}
                </span>
              ))}
              {toMiddle.map((char, index) => (
                <span
                  key={`in-${index}`}
                  className={cn('absolute top-0 left-0 block w-[1ch]', motionless)}
                  style={{
                    left: `${index}ch`,
                    color: 'var(--swap-big)',
                    transform: swapped ? 'translateY(0)' : 'translateY(125%)',
                    transition: roll(START_DELAY + 160 + index * 70),
                  }}
                >
                  {char}
                </span>
              ))}
            </span>
            <span
              className={cn('inline-block', motionless)}
              style={{
                transform: `translateX(${swapped ? tailTo : tailFrom}ch)`,
                transition: roll(START_DELAY + 120),
              }}
            >
              {suffix}
            </span>
          </>
        )}
      </span>

      {annotate && !unchanged && toMiddle.length > 0 && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-full flex flex-col items-center transition-opacity duration-700',
            swapped ? 'opacity-100' : 'opacity-0',
            motionless,
          )}
          style={{
            left: `${[...prefix].length}ch`,
            width: `${toMiddle.length}ch`,
            marginTop: '0.1em',
            color: 'var(--swap-small)',
            transitionDelay: `${START_DELAY + 900}ms`,
          }}
        >
          <span
            className="block h-1.5 w-full border-x border-b border-current"
            style={{ borderWidth: '0 1.5px 1.5px' }}
          />
          <span className="mt-1.5 text-[11px] leading-none font-medium tracking-[0.06em] whitespace-nowrap">
            {fromMiddle.length === 0 ? (
              <>+ {toMiddle.join('')}</>
            ) : (
              <>
                <span className="line-through decoration-1 opacity-70">{fromMiddle.join('')}</span>{' '}
                → {toMiddle.join('')}
              </>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
