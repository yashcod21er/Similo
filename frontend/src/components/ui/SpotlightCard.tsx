import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The standard light card (v4): white, hairline border, rounded-2xl and the
 * layered `shadow-card`. On hover the border strengthens and the card lifts
 * by 2 px (transform only; none with reduced motion). The name is historical.
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
        'group/spot relative overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-[border-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-line-strong motion-reduce:hover:translate-y-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
