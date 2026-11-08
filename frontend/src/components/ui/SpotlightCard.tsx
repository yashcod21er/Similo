import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The standard light card: white, 1 px border, small radius. The only hover
 * change is a slightly stronger border. (The name is historical: the v2
 * pointer spotlight is gone, and new code can use a plain element with the
 * same classes.)
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
        'group/spot relative overflow-hidden rounded-xl border border-line bg-white transition-colors duration-150 hover:border-line-strong',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
