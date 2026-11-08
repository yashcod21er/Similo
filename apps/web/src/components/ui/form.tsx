import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/cn';

/** Shared look for text inputs and selects (design system v2). */
export const inputClass =
  'mt-2 block w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-[15px] text-ink shadow-[inset_0_1px_2px_rgb(11_16_32/0.04)] outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 hover:border-ink/30 focus:border-crimson focus:ring-4 focus:ring-crimson/15 aria-invalid:border-crimson aria-invalid:ring-4 aria-invalid:ring-crimson/10 disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted';

/** Label + control + hint + error, wired together for screen readers. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-[14px] font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="mt-2 text-[13px] text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-2 text-[13.5px] text-crimson-dark">
          {error}
        </p>
      )}
    </div>
  );
}

/** Page- or form-level message. Errors are announced immediately by screen readers. */
export function FormAlert({
  tone = 'error',
  children,
  className,
}: {
  tone?: 'error' | 'success';
  children: ReactNode;
  className?: string;
}) {
  const error = tone === 'error';
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-2xl px-4 py-3 text-[14px] ring-1',
        error
          ? 'bg-crimson/[0.06] text-ink ring-crimson/25'
          : 'bg-emerald-50 text-ink ring-emerald-200',
        className,
      )}
    >
      {error ? (
        <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-crimson-dark" />
      ) : (
        <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-700" />
      )}
      <div>{children}</div>
    </div>
  );
}

/** Submit button that shows progress and can't be double-clicked. */
export function SubmitButton({
  pending,
  children,
  pendingLabel = 'Please wait…',
  className,
  variant,
}: {
  pending: boolean;
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: 'primary' | 'dark';
}) {
  return (
    <Button
      type="submit"
      size="lg"
      variant={variant}
      disabled={pending}
      aria-busy={pending}
      className={className}
    >
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/** Password input with a show/hide toggle (helps people type long passphrases correctly). */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn(inputClass, 'pr-20', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute top-1/2 right-2 mt-1 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-muted hover:bg-paper hover:text-ink"
      >
        {visible ? 'Hide' : 'Show'}
        <span className="sr-only"> password</span>
      </button>
    </div>
  );
}
