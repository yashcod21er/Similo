import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { AcmeVariant } from './acme-data';

/*
 * Ready-made sample content for the compare slider and the loupe: a login page of the
 * fictional brand "Acme" (acme.com) and a look-alike copy (acrne.com) that differs in four
 * places. It is made-up sample content, never a real company. Every size is in `cqw` (a share
 * of the sheet's own width), so the page looks the same from 350 px to 900 px wide.
 */

/** An orange dashed outline with a number tag, drawn round whatever it wraps. */
function Diff({
  n,
  show,
  children,
  className,
}: {
  n: number;
  show: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('relative inline-flex', className)}>
      {children}
      {show && (
        <span
          aria-hidden
          data-diff={n}
          className="animate-scene-pop pointer-events-none absolute -inset-[0.9cqw] rounded-[1cqw] border-accent motion-reduce:animate-none"
          style={{
            borderWidth: 'max(1.5px, 0.3cqw)',
            borderStyle: 'dashed',
            boxShadow: '0 0 0 max(1.5px, 0.3cqw) rgb(246 240 230 / 0.85)',
            animationDelay: `${n * 90}ms`,
          }}
        >
          <span
            className="absolute -top-[2.6cqw] font-mono font-medium -left-[1.2cqw] grid place-items-center rounded-[0.5cqw] bg-accent text-white"
            style={{
              width: 'max(15px, 3cqw)',
              height: 'max(15px, 3cqw)',
              fontSize: 'max(8px, 1.9cqw)',
              letterSpacing: 0,
            }}
          >
            {n}
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * The sample login page. `variant="copy"` is the look-alike; add `annotated` to draw the
 * orange outlines and numbers round the four differences (use it for the copy in a
 * `CompareSlider`, and for the magnified view of a `Loupe`).
 */
export function AcmeSheet({
  variant = 'original',
  annotated = false,
  className,
}: {
  variant?: AcmeVariant;
  annotated?: boolean;
  className?: string;
}) {
  const copy = variant === 'copy';
  const show = annotated && copy;

  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden bg-cream text-ink [container-type:inline-size]',
        className,
      )}
    >
      {/* browser bar */}
      <div
        className="absolute inset-x-0 top-0 flex items-center bg-cream-deep"
        style={{ height: '9%', paddingInline: '2.4cqw', gap: '2cqw' }}
      >
        <span className="flex" style={{ gap: '0.9cqw' }} aria-hidden>
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="rounded-full bg-ink/20"
              style={{ width: '1.4cqw', height: '1.4cqw' }}
            />
          ))}
        </span>
        <span
          className="flex flex-1 items-center rounded-full bg-white font-mono text-muted"
          style={{
            height: '5.2cqw',
            paddingInline: '2cqw',
            fontSize: '2.3cqw',
            gap: '1.1cqw',
            maxWidth: '58cqw',
          }}
        >
          <svg viewBox="0 0 12 12" aria-hidden style={{ width: '2.2cqw', height: '2.2cqw' }}>
            <rect x="2" y="5.2" width="8" height="5.6" rx="1.2" fill="currentColor" />
            <path
              d="M3.8 5.2V3.8a2.2 2.2 0 0 1 4.4 0v1.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          <span className="flex items-center">
            <Diff n={1} show={show}>
              <span className="text-ink">{copy ? 'acrne.com' : 'acme.com'}</span>
            </Diff>
            <span>/login</span>
          </span>
        </span>
      </div>

      {/* the page */}
      <div
        className="absolute inset-x-0 bottom-0 grid place-items-center"
        style={{ top: '9%', paddingBlock: '4cqw' }}
      >
        <div
          className="flex flex-col rounded-[1.6cqw] bg-white shadow-[0_0.4cqw_1.2cqw_-0.2cqw_rgb(21_19_15/0.12)] ring-1 ring-ink/10"
          style={{ width: '52cqw', padding: '4cqw 4.4cqw 3.4cqw' }}
        >
          <div className="flex items-center" style={{ gap: '1.4cqw' }}>
            <span
              aria-hidden
              className="grid place-items-center rounded-full bg-night"
              style={{ width: '4.6cqw', height: '4.6cqw' }}
            >
              <span
                className="bg-cream"
                style={{
                  width: '2cqw',
                  height: '2cqw',
                  clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
                }}
              />
            </span>
            <Diff n={2} show={show}>
              <span className="font-semibold tracking-tight" style={{ fontSize: '3.8cqw' }}>
                {copy ? 'Acrne' : 'Acme'}
              </span>
            </Diff>
          </div>

          <p
            className="font-semibold tracking-tight"
            style={{ fontSize: '3.1cqw', marginTop: '3.2cqw' }}
          >
            Sign in to your account
          </p>

          {(['Email', 'Password'] as const).map((field) => (
            <div key={field} style={{ marginTop: '2.2cqw' }}>
              <p className="font-medium text-muted" style={{ fontSize: '1.9cqw' }}>
                {field}
              </p>
              <div
                className="flex items-center rounded-[0.9cqw] border border-line-strong bg-cream/50 text-muted"
                style={{
                  height: '5.2cqw',
                  marginTop: '0.6cqw',
                  paddingInline: '1.6cqw',
                  fontSize: '2cqw',
                }}
              >
                {field === 'Email' ? 'name@company.com' : '••••••••'}
              </div>
            </div>
          ))}

          <div
            className="flex items-center justify-between text-muted"
            style={{ marginTop: '2.4cqw', fontSize: '1.9cqw' }}
          >
            <span className="flex items-center" style={{ gap: '0.9cqw' }}>
              <span
                aria-hidden
                className="rounded-[0.4cqw] border border-line-strong"
                style={{ width: '2cqw', height: '2cqw' }}
              />
              Remember me
            </span>
            <Diff n={3} show={show}>
              <span className="text-ink underline decoration-ink/30 underline-offset-2">
                {copy ? 'Forgot pasword?' : 'Forgot password?'}
              </span>
            </Diff>
          </div>

          <div style={{ marginTop: '3cqw' }}>
            <Diff n={4} show={show} className="flex w-full">
              <span
                className={cn(
                  'flex w-full items-center justify-center rounded-[1cqw] font-semibold text-cream',
                  copy ? 'bg-night-raised' : 'bg-night',
                )}
                style={{ height: '6cqw', fontSize: '2.3cqw' }}
              >
                {copy ? 'Log in' : 'Sign in'}
              </span>
            </Diff>
          </div>
        </div>
      </div>
    </div>
  );
}
