import { useRef } from 'react';
import { EASE_OUT_EXPO_CSS } from '@/components/motion/easing';
import { useInView, usePrefersReducedMotion } from '@/components/motion/hooks';
import { cn } from '@/lib/cn';

/*
 * An odometer: each digit is a column of 0-9 that rolls to its place, one after another from the
 * left, the first time the number scrolls into view. The final number is in the DOM as plain text
 * for screen readers and search engines; the rolling columns are decoration. With reduced motion
 * the final number shows at once.
 * Only use it for real, sourced numbers, never for invented statistics.
 */

const ROWS = Array.from({ length: 30 }, (_, row) => row % 10);

/** Which row of the 30-row strip a digit finishes on (one full spin, the last two spin twice). */
function finalRow(digit: number, fromRight: number): number {
  return (fromRight < 2 ? 20 : 10) + digit;
}

function Column({
  digit,
  fromRight,
  index,
  rolled,
}: {
  digit: number;
  fromRight: number;
  index: number;
  rolled: boolean;
}) {
  const row = rolled ? finalRow(digit, fromRight) : 0;
  return (
    <span data-digit className="relative inline-block [clip-path:inset(0_-0.06em)]" aria-hidden>
      <span className="invisible">{digit}</span>
      {/* Rows are one line tall (`1lh`), so the window shows exactly one digit whatever the
          line-height, and the strip's baseline matches the invisible digit above. */}
      <span
        className="absolute top-0 left-0 flex flex-col will-change-transform"
        style={{
          transform: `translateY(calc(${-row} * 1lh))`,
          transition: `transform ${1500 + fromRight * 90}ms ${EASE_OUT_EXPO_CSS} ${index * 70}ms`,
        }}
      >
        {ROWS.map((value, position) => (
          <span key={position} className="block h-[1lh]">
            {value}
          </span>
        ))}
      </span>
    </span>
  );
}

export function NumberRoll({
  value,
  decimals = 0,
  suffix = '',
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const seen = useInView(ref, { once: true, rootMargin: '0px 0px -12% 0px' });

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const characters = [...formatted];
  const digitCount = characters.filter((char) => /\d/.test(char)).length;
  let digitIndex = 0;

  return (
    <span ref={ref} className={cn('inline-block whitespace-nowrap tabular-nums', className)}>
      <span className="sr-only">{`${formatted}${suffix}`}</span>
      {reduced ? (
        <span aria-hidden>{`${formatted}${suffix}`}</span>
      ) : (
        <span aria-hidden>
          {characters.map((char, position) => {
            if (!/\d/.test(char)) return <span key={position}>{char}</span>;
            const index = digitIndex;
            digitIndex += 1;
            return (
              <Column
                key={position}
                digit={Number(char)}
                fromRight={digitCount - 1 - index}
                index={index}
                rolled={seen}
              />
            );
          })}
          {suffix}
        </span>
      )}
    </span>
  );
}
