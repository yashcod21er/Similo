import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ScrollStoryStep {
  id: string;
  /** Short label such as "Watch" or "Step 1". */
  label: string;
  title: ReactNode;
  body: ReactNode;
  visual: ReactNode;
}

/**
 * Scroll storytelling. On large screens the steps scroll on the left while one visual on
 * the right stays pinned and cross-fades to the step being read (IntersectionObserver). On
 * phones each step shows its own visual inline, under its text.
 *
 * All text is real DOM in reading order (keyboard and screen-reader friendly); visuals of
 * inactive steps are hidden from assistive tech. With reduced motion there are no fades.
 * Put it inside a `Container`; it brings no section padding of its own.
 */
export function ScrollStory({
  steps,
  tone = 'dark',
  className,
}: {
  steps: ScrollStoryStep[];
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const dark = tone === 'dark';
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = stepRefs.current.indexOf(entry.target as HTMLElement);
          if (index >= 0) setActive(index);
        }
      },
      // A thin band across the middle of the viewport decides which step is "being read".
      { rootMargin: '-45% 0px -45% 0px' },
    );
    for (const element of stepRefs.current) if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [steps.length]);

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16',
        className,
      )}
    >
      <ol className="flex flex-col gap-16 lg:gap-0">
        {steps.map((step, index) => {
          const isActive = index === active;
          return (
            <li
              key={step.id}
              ref={(element) => {
                stepRefs.current[index] = element;
              }}
              aria-current={isActive ? 'step' : undefined}
              className="lg:flex lg:min-h-[78vh] lg:items-center"
            >
              <div
                className={cn(
                  'lg:border-l-2 lg:pl-8 lg:transition-colors lg:duration-500 motion-reduce:transition-none',
                  isActive ? 'lg:border-accent' : dark ? 'lg:border-cream/10' : 'lg:border-ink/10',
                )}
              >
                <p
                  className={cn(
                    'flex items-center gap-3 text-[13px] font-medium',
                    dark ? 'text-accent-soft' : 'text-accent-ink',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex size-7 items-center justify-center rounded-full font-mono text-[12px] ring-1',
                      dark ? 'ring-accent-soft/40' : 'ring-accent-ink/30',
                    )}
                  >
                    {index + 1}
                  </span>
                  {step.label}
                </p>
                <h3
                  className={cn(
                    'mt-4 text-[1.75rem] leading-[1.15] font-semibold tracking-[-0.025em] text-balance transition-opacity duration-500 ease-out motion-reduce:transition-none sm:text-[2rem]',
                    dark ? 'text-cream' : 'text-ink',
                    !isActive && 'lg:opacity-50',
                  )}
                >
                  {step.title}
                </h3>
                <div
                  className={cn(
                    'text-lead mt-4 max-w-md text-pretty',
                    dark ? 'text-cream/70' : 'text-muted',
                  )}
                >
                  {step.body}
                </div>
              </div>
              {/* Phones and tablets: the visual sits under its own step. */}
              <div className="mt-8 lg:hidden">{step.visual}</div>
            </li>
          );
        })}
      </ol>

      {/* Desktop: one pinned stage that cross-fades between the step visuals. */}
      <div className="hidden lg:block">
        <div className="sticky top-[calc(50vh-17rem)] h-[34rem]">
          {steps.map((step, index) => {
            const isActive = index === active;
            return (
              <div
                key={step.id}
                aria-hidden={!isActive}
                inert={!isActive}
                className={cn(
                  'absolute inset-0 flex items-center transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
                  isActive
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-3 opacity-0',
                )}
              >
                <div className="w-full">{step.visual}</div>
              </div>
            );
          })}
          <div aria-hidden className="absolute -bottom-2 left-0 flex gap-1.5">
            {steps.map((step, index) => (
              <span
                key={step.id}
                className={cn(
                  'h-1 w-6 rounded-full transition-colors duration-500 ease-out motion-reduce:transition-none',
                  index === active ? 'bg-accent' : dark ? 'bg-cream/20' : 'bg-ink/15',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
