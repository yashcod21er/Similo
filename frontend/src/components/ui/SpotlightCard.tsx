import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { CornerBrackets } from './specimen';

/**
 * The standard light card (v6): white, a crisp hairline, rounded-2xl and the layered
 * `shadow-card`. No glow and no haze. On hover it lifts 2 px, the hairline darkens and four
 * small corner brackets appear, as if the card were being picked out as a specimen
 * (150-200 ms). With reduced motion only the colour change remains. Kept under its old name
 * because many pages use it.
 */
export function SpotlightCard({
  as: Tag = 'article',
  children,
  className,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        'group/spot relative isolate overflow-hidden rounded-2xl border border-line bg-white shadow-card',
        'transition-[border-color,box-shadow,transform] duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-window motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      <CornerBrackets
        tone="light"
        className="inset-2 text-accent opacity-0 transition-opacity duration-200 group-hover/spot:opacity-100 motion-reduce:transition-none"
      />
      {children}
    </Tag>
  );
}
