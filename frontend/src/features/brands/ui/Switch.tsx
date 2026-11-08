import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * An on/off switch built on a real checkbox (announced as a "switch"), so it works with
 * keyboard, screen readers and react-hook-form's `register`. Shows On/Off in words too.
 */
export function Switch({
  label,
  description,
  className,
  ...inputProps
}: Omit<ComponentProps<'input'>, 'type' | 'role' | 'className'> & {
  label: string;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-4 rounded-2xl p-4 ring-1 ring-line transition-colors hover:bg-cream has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70 has-[:disabled]:hover:bg-transparent',
        className,
      )}
    >
      <input type="checkbox" role="switch" className="peer sr-only" {...inputProps} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[13.5px] text-muted">{description}</span>
        )}
      </span>
      <span
        aria-hidden
        className="mt-0.5 w-7 text-right text-[13px] font-medium text-muted peer-checked:hidden"
      >
        Off
      </span>
      <span
        aria-hidden
        className="mt-0.5 hidden w-7 text-right text-[13px] font-medium text-ink peer-checked:block"
      >
        On
      </span>
      {/* Track and thumb (the ::after). Off is an outline, On is solid: never colour alone. */}
      <span
        aria-hidden
        className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-white ring-1 ring-muted transition-colors after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-muted after:transition-transform after:content-[''] peer-checked:bg-night peer-checked:ring-night peer-checked:after:translate-x-5 peer-checked:after:bg-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
      />
    </label>
  );
}
