import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** A white panel with a title, used for each block inside a brand tab. */
export function Card({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-3xl bg-white p-5 ring-1 ring-line sm:p-8', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 basis-60">
            {title && <h2 className="text-title font-semibold">{title}</h2>}
            {description && <div className="mt-1.5 text-[14.5px] text-muted">{description}</div>}
          </div>
          {actions}
        </div>
      )}
      <div className={title || actions ? 'mt-6' : undefined}>{children}</div>
    </section>
  );
}

/** A quiet message box for "nothing here yet" inside a tab. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-cream px-4 py-6 text-center text-[14.5px] text-ink ring-1 ring-line">
      {children}
    </p>
  );
}
