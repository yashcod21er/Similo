import { BrainCircuit, FolderSearch, Globe, Smartphone, Stamp } from 'lucide-react';
import type { ResourceCategory } from '@/content/resources';
import { cn } from '@/lib/cn';

const COVERS: Record<ResourceCategory, { icon: typeof Globe; glow: string }> = {
  'Domain intelligence': { icon: Globe, glow: '-top-16 -left-10 bg-coral/45' },
  'Trademark watch': { icon: Stamp, glow: '-right-12 -bottom-20 bg-crimson/25' },
  'App ecosystem': { icon: Smartphone, glow: '-top-20 right-1/4 bg-coral/40' },
  Investigations: { icon: FolderSearch, glow: '-bottom-24 left-1/4 bg-crimson/20' },
  'AI & methodology': { icon: BrainCircuit, glow: '-top-16 -right-8 bg-[#9fb3e8]/45' },
};

/** Generated light cover art per category — no stock photos needed. */
export function ResourceCover({
  category,
  label,
  className,
}: {
  category: ResourceCategory;
  label: string;
  className?: string;
}) {
  const { icon: Icon, glow } = COVERS[category];
  return (
    <div aria-hidden className={cn('relative isolate overflow-hidden bg-paper', className)}>
      <div className="bg-dots absolute inset-0 -z-10 opacity-70" />
      <div className={cn('absolute -z-10 size-56 rounded-full blur-3xl', glow)} />
      <Icon
        className="absolute -right-6 -bottom-10 -z-10 size-44 text-crimson/[0.07]"
        strokeWidth={1}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-crimson-dark shadow-lifted ring-1 ring-line transition-transform duration-500 group-hover:scale-110 group-hover/spot:scale-110">
          <Icon className="size-6" />
        </span>
      </div>
      <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10.5px] tracking-wider text-muted uppercase ring-1 ring-line">
        {label}
      </span>
    </div>
  );
}
