import { CalendarClock, Fingerprint, Globe, ImageIcon, UserCheck } from 'lucide-react';
import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { AppIcon } from './app';
import { Chip, Show, type Level } from './scene-kit';
import { usePanelShown } from './scene-hooks';

/*
 * Small previews of the four modules, drawn for the Platform page. Each shows the one
 * thing that module does. Sample data, made-up names.
 */

export type ModuleKind = 'domain' | 'app' | 'trademark' | 'investigation';

const ROW =
  'flex items-center gap-2.5 rounded-lg bg-white/[0.045] px-3 py-2 ring-1 ring-white/[0.07]';

function DomainThumb({ shown }: { shown: boolean }) {
  const rows: [string, Level, string][] = [
    ['acrne-login.com', 'high', 'High'],
    ['acmee.co', 'medium', 'Medium'],
    ['acme-recipes.blog', 'low', 'Low'],
  ];
  return (
    <ul className="space-y-2">
      {rows.map(([name, level, label], index) => (
        <Show key={name} as="li" when={shown} delay={index * 120} y={8} className={ROW}>
          <Globe aria-hidden className="size-3.5 shrink-0 text-cream/55" />
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-cream">{name}</span>
          <Chip level={level}>{label}</Chip>
        </Show>
      ))}
    </ul>
  );
}

function AppThumb({ shown }: { shown: boolean }) {
  return (
    <div className="space-y-2.5">
      <Show when={shown} y={8} className="flex items-center justify-center gap-4 py-1.5">
        <div className="flex flex-col items-center gap-1.5">
          <AppIcon variant="official" className="size-12" />
          <span className="text-[10.5px] text-cream/65">Yours</span>
        </div>
        <span aria-hidden className="text-[20px] text-cream/60">
          ≈
        </span>
        <div className="flex flex-col items-center gap-1.5">
          <AppIcon variant="copy" className="size-12" />
          <span className="text-[10.5px] text-accent-soft">The copy</span>
        </div>
      </Show>
      <Show when={shown} delay={200} y={6} className="flex items-center justify-between gap-3">
        <span className="text-[11.5px] text-cream/75">Publisher</span>
        <Chip level="high">Not on your list</Chip>
      </Show>
    </div>
  );
}

function TrademarkThumb({ shown }: { shown: boolean }) {
  return (
    <div className="space-y-2.5">
      <Show
        when={shown}
        y={8}
        className="grid grid-cols-2 gap-2 text-center text-[14px] font-semibold tracking-[0.04em]"
      >
        <span className="rounded-lg bg-white/[0.045] py-2 text-cream ring-1 ring-white/[0.07]">
          ACME
        </span>
        <span className="rounded-lg bg-accent/[0.14] py-2 text-cream ring-1 ring-accent/50">
          ACME<span className="text-accent-soft">E</span>
        </span>
      </Show>
      <Show when={shown} delay={160} y={6} className="flex items-center justify-between gap-3">
        <span className="text-[11.5px] text-cream/75">Sounds alike</span>
        <Chip level="high">92</Chip>
      </Show>
      <Show when={shown} delay={260} y={6} className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[11.5px] text-cream/75">
          <CalendarClock aria-hidden className="size-3.5 text-accent-soft" /> Time left to object
        </span>
        <span className="font-mono text-[12px] text-cream">18 days</span>
      </Show>
    </div>
  );
}

function InvestigationThumb({ shown }: { shown: boolean }) {
  const rows = [
    { icon: ImageIcon, text: 'Page captured', note: '09:42' },
    { icon: Fingerprint, text: 'Fingerprint 9f2c…a71e', note: '09:42' },
    { icon: UserCheck, text: 'Letter approved by a person', note: '10:48' },
  ];
  return (
    <ul className="space-y-2">
      {rows.map((row, index) => (
        <Show key={row.text} as="li" when={shown} delay={index * 120} y={8} className={ROW}>
          <row.icon aria-hidden className="size-3.5 shrink-0 text-accent-soft" />
          <span className="min-w-0 flex-1 truncate text-[12px] text-cream">{row.text}</span>
          <span className="font-mono text-[10.5px] text-cream/60">{row.note}</span>
        </Show>
      ))}
    </ul>
  );
}

/** A small, decorative preview of one module (the card around it carries the text). */
export function ModuleThumb({ kind, className }: { kind: ModuleKind; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <div ref={ref} aria-hidden className={cn('min-h-[148px]', className)}>
      {kind === 'domain' && <DomainThumb shown={shown} />}
      {kind === 'app' && <AppThumb shown={shown} />}
      {kind === 'trademark' && <TrademarkThumb shown={shown} />}
      {kind === 'investigation' && <InvestigationThumb shown={shown} />}
    </div>
  );
}
