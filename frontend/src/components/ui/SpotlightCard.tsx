import type { ElementType, PointerEvent, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The standard light card (v4): white, hairline border, rounded-2xl and the
 * layered `shadow-card`. On hover it lifts, its shadow deepens, and a soft
 * burnt-orange light follows the pointer — both across the surface and along
 * the border (a 1 px masked ring). Pointer tracking only sets two CSS variables;
 * nothing moves with reduced motion except the colour change.
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
  function track(event: PointerEvent<HTMLElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--spot-x', `${event.clientX - box.left}px`);
    event.currentTarget.style.setProperty('--spot-y', `${event.clientY - box.top}px`);
  }

  return (
    <Tag
      onPointerMove={track}
      className={cn(
        'group/spot relative isolate overflow-hidden rounded-2xl border border-line bg-white shadow-card',
        'transition-[border-color,box-shadow,transform] duration-300 ease-out',
        'hover:-translate-y-1 hover:border-line-strong hover:shadow-window motion-reduce:hover:translate-y-0',
        '[--spot-x:50%] [--spot-y:0%]',
        className,
      )}
    >
      {/* Soft light on the surface, following the pointer. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(420px circle at var(--spot-x) var(--spot-y), rgb(194 80 10 / 0.07), transparent 45%)',
        }}
      />
      {/* The border lights up near the pointer (a 1 px ring cut out with a mask). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(260px circle at var(--spot-x) var(--spot-y), rgb(194 80 10 / 0.55), transparent 60%)',
          mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box xor, linear-gradient(#000 0 0)',
        }}
      />
      {children}
    </Tag>
  );
}
