import { cn } from '@/lib/cn';
import type { BrandStatus } from '../api';

/** "Active" (green) or "Paused" (grey): always a word, never colour alone. */
export function StatusBadge({ status }: { status: BrandStatus }) {
  const active = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium ring-1',
        active ? 'bg-emerald-50 text-emerald-900 ring-emerald-200' : 'bg-cream text-ink ring-line',
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', active ? 'bg-emerald-600' : 'bg-muted')}
      />
      {active ? 'Active' : 'Paused'}
    </span>
  );
}
