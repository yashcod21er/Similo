import { useRef, type ElementType, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Light card with a soft crimson spotlight that follows the pointer.
 * The effect is pure CSS driven by two custom properties, so it costs no
 * re-renders; on touch screens and with reduced motion it simply never shows.
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
  const ref = useRef<HTMLElement>(null);

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    ref.current.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  };

  return (
    <Tag
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn(
        'group/spot relative isolate overflow-hidden rounded-3xl border border-line bg-white transition-[border-color,box-shadow,transform] duration-300 ease-out hover:border-ink/15 hover:shadow-lifted motion-safe:hover:-translate-y-0.5',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100 motion-reduce:hidden"
        style={{
          background:
            'radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 0%), rgb(217 47 72 / 0.07), transparent 45%)',
        }}
      />
      {children}
    </Tag>
  );
}
