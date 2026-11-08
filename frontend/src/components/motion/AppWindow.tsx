import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * A crafted app-window frame for product scenes: a title bar (window dots, an address
 * pill, a title), a hairline border, rounded-2xl corners and a layered soft shadow.
 *
 * - `tone="dark"` (night surface) for heroes and dark bands; `tone="light"` (white) on cream.
 * - `url` shows an address pill (e.g. `app.similo.example/alerts`); `title` sits on the right.
 * - The frame does not clip vertically on purpose: give the children a height if needed.
 */
export function AppWindow({
  title,
  url,
  tone = 'light',
  className,
  children,
}: {
  title?: ReactNode;
  url?: string;
  tone?: 'light' | 'dark';
  className?: string;
  children: ReactNode;
}) {
  const dark = tone === 'dark';
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-2xl',
        dark
          ? 'bg-night text-cream shadow-window-dark ring-1 ring-white/[0.09]'
          : 'bg-white text-ink shadow-window ring-1 ring-ink/[0.07]',
        className,
      )}
    >
      {/* Top highlight: a 1 px light edge that reads as a bevel on dark windows. */}
      {dark && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
        />
      )}
      <div
        className={cn(
          'flex h-11 items-center gap-3 border-b px-4',
          dark ? 'border-white/[0.07] bg-night-raised/60' : 'border-line bg-cream/60',
        )}
      >
        <span aria-hidden className="flex shrink-0 gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className={cn('size-2.5 rounded-full', dark ? 'bg-white/[0.14]' : 'bg-ink/[0.12]')}
            />
          ))}
        </span>
        <div className="flex min-w-0 flex-1 justify-center">
          {url && (
            <span
              className={cn(
                'inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[11.5px]',
                dark ? 'bg-white/[0.06] text-cream/70' : 'bg-white text-muted ring-1 ring-line',
              )}
            >
              <Lock aria-hidden className="size-3 shrink-0" />
              <span className="truncate">{url}</span>
            </span>
          )}
        </div>
        <div
          className={cn(
            'flex min-w-0 shrink-0 items-center justify-end text-[12px] font-medium',
            dark ? 'text-cream/70' : 'text-muted',
            !title && 'w-[46px]',
          )}
        >
          {title}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
