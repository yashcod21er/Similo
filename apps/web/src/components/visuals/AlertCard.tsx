import { AlertTriangle, ArrowRight, Globe, Smartphone, Stamp } from 'lucide-react';
import { ExampleTag } from '@/components/ui/layout';
import { cn } from '@/lib/cn';

export type AlertKind = 'website' | 'app' | 'trademark';
export type AlertLevel = 'high' | 'medium' | 'review';

const KIND = {
  website: { icon: Globe, label: 'New website' },
  app: { icon: Smartphone, label: 'App store listing' },
  trademark: { icon: Stamp, label: 'Trademark filing' },
} as const;

const LEVEL = {
  high: {
    label: 'High risk',
    light: 'bg-crimson/10 text-crimson-dark',
    dark: 'bg-crimson/20 text-coral',
  },
  medium: {
    label: 'Medium risk',
    light: 'bg-amber-100 text-amber-800',
    dark: 'bg-amber-400/15 text-amber-300',
  },
  review: { label: 'Needs review', light: 'bg-card text-ink', dark: 'bg-white/10 text-white/80' },
} as const;

/**
 * A finding explained in plain words: what was found, why it looks risky, and
 * the risk level. Used wherever the site shows "what an alert looks like".
 * Always labelled as an example unless `example` is false.
 */
export function AlertCard({
  kind,
  name,
  facts,
  level,
  tone = 'light',
  example = true,
  className,
}: {
  kind: AlertKind;
  name: string;
  facts: string[];
  level: AlertLevel;
  tone?: 'light' | 'dark';
  example?: boolean;
  className?: string;
}) {
  const dark = tone === 'dark';
  const Icon = KIND[kind].icon;
  return (
    <div
      className={cn(
        'rounded-2xl p-5 text-left',
        dark
          ? 'bg-white/[0.06] text-white ring-1 ring-white/12 backdrop-blur-xl'
          : 'bg-white text-ink shadow-lifted ring-1 ring-line',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            'inline-flex items-center gap-2 text-[13px] font-medium',
            dark ? 'text-white/70' : 'text-muted',
          )}
        >
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-md',
              dark ? 'bg-white/10 text-coral' : 'bg-paper text-crimson-dark ring-1 ring-line',
            )}
          >
            <Icon aria-hidden className="size-3.5" />
          </span>
          {KIND[kind].label}
        </p>
        {example && <ExampleTag tone={tone} />}
      </div>
      <p className="mt-4 truncate font-mono text-[17px] font-medium tracking-[-0.02em]">{name}</p>
      <ul className="mt-3 space-y-1.5">
        {facts.map((fact) => (
          <li
            key={fact}
            className={cn('flex items-start gap-2 text-sm', dark ? 'text-white/75' : 'text-ink/80')}
          >
            <span
              aria-hidden
              className={cn(
                'mt-[7px] size-1.5 shrink-0 rounded-full',
                dark ? 'bg-coral' : 'bg-crimson',
              )}
            />
            {fact}
          </li>
        ))}
      </ul>
      <div
        className={cn(
          'mt-5 flex items-center justify-between gap-3 border-t pt-4',
          dark ? 'border-white/10' : 'border-line',
        )}
      >
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold',
            dark ? LEVEL[level].dark : LEVEL[level].light,
          )}
        >
          <AlertTriangle aria-hidden className="size-3.5" />
          {LEVEL[level].label}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[13px] font-medium',
            dark ? 'text-white/60' : 'text-muted',
          )}
        >
          Sent for review <ArrowRight aria-hidden className="size-3.5" />
        </span>
      </div>
    </div>
  );
}
