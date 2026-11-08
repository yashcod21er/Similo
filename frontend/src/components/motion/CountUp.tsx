import { useEffect, useRef, useState } from 'react';
import { useInView, usePrefersReducedMotion } from './hooks';

const DURATION_MS = 1100;

function format(value: number, decimals: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * A number that counts up once, the first time it scrolls into view. The final value is
 * always in the DOM (read by screen readers and search engines); the moving digits are
 * decorative. With reduced motion the final value shows immediately.
 * Only use it for real, sourced numbers — never for invented statistics.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const seen = useInView(ref, { once: true, rootMargin: '0px 0px -10% 0px' });
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    if (reduced || !seen) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduced, seen, value]);

  const finalText = `${prefix}${format(value, decimals)}${suffix}`;
  const visibleText = reduced ? finalText : `${prefix}${format(shown ?? 0, decimals)}${suffix}`;

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{finalText}</span>
      <span aria-hidden className="tabular-nums">
        {visibleText}
      </span>
    </span>
  );
}
