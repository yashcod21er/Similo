import { Globe, Smartphone, Stamp, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppWindow } from '@/components/motion';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { Chip, SceneFigure, Show, SignalBar, type Level } from './scene-kit';
import { useSceneStep, WINDOW_BODY } from './scene-hooks';

/*
 * The Platform page's hero scene: one list for every source. Rows arrive, the most urgent
 * one opens to show its named scores, and a person moves it from "Needs review" to
 * "Approved for takedown request". Sample brand "Acme"; every name is made up.
 */

interface AlertRow {
  id: string;
  icon: LucideIcon;
  kind: string;
  name: string;
  why: string;
  level: Level;
  risk: string;
}

/** In arrival order. The list shows them newest first, so the most urgent ends on top. */
const ROWS: AlertRow[] = [
  {
    id: 'blog',
    icon: Globe,
    kind: 'Website',
    name: 'acme-recipes.blog',
    why: 'Unrelated cooking blog',
    level: 'low',
    risk: 'Low',
  },
  {
    id: 'mark',
    icon: Stamp,
    kind: 'Trademark',
    name: 'ACMEE',
    why: 'Sounds like your mark, same class, 18 days left',
    level: 'medium',
    risk: 'Medium',
  },
  {
    id: 'app',
    icon: Smartphone,
    kind: 'App',
    name: 'Acme Wallet Pro',
    why: 'Logo like yours, different publisher',
    level: 'high',
    risk: 'High',
  },
  {
    id: 'site',
    icon: Globe,
    kind: 'Website',
    name: 'acrne-login.com',
    why: 'Looks like your name, has a sign-in form',
    level: 'high',
    risk: 'High',
  },
];

function statusFor(row: AlertRow, step: number): { label: string; level: Level } {
  if (row.id === 'site') {
    if (step >= 9) return { label: 'Approved', level: 'ok' };
    if (step >= 8) return { label: 'Needs review', level: 'review' };
    return { label: 'New', level: 'neutral' };
  }
  if (row.id === 'blog') return { label: 'Dismissed', level: 'neutral' };
  if (row.id === 'app') return { label: 'Needs review', level: 'review' };
  return { label: 'New', level: 'neutral' };
}

function Row({ row, step, open }: { row: AlertRow; step: number; open: boolean }) {
  const status = statusFor(row, step);
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 transition-colors duration-500',
        open ? 'bg-accent/[0.14] ring-accent/60' : 'bg-white/[0.035] ring-white/[0.06]',
      )}
    >
      <row.icon aria-hidden className="size-4 shrink-0 text-cream/55" />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span
            className={cn(
              'truncate font-mono text-[12.5px] text-cream',
              row.id === 'blog' && 'text-cream/60 line-through decoration-cream/30',
            )}
          >
            {row.name}
          </span>
          <span className="hidden shrink-0 text-[11px] text-cream/60 @lg:inline">{row.kind}</span>
        </p>
        <p className="truncate text-[11px] text-cream/60">{row.why}</p>
      </div>
      <Chip level={row.level} className="hidden @md:inline-flex">
        {row.risk}
      </Chip>
      <Chip level={status.level} className="min-w-[5.5rem] justify-center">
        {status.label}
      </Chip>
    </motion.li>
  );
}

const STEP_COUNT = 11;

/** The Platform page's hero scene. */
export function PlatformScene() {
  const { ref, step } = useSceneStep(STEP_COUNT, 1100);
  const count = Math.min(step + 1, ROWS.length);
  const open = step >= 4;
  const scores = open ? Math.min(step - 3, 3) : 0;
  const visible = ROWS.slice(0, count).reverse();
  return (
    <SceneFigure label="Illustrative example: website, app and trademark alerts arriving in one list sorted by risk. The top alert opens to show separate text, visual and meaning scores, and a person moves it from needs review to approved for a takedown request.">
      <AppWindow tone="dark" title="Alerts" url="app.similo.example/alerts">
        <div ref={ref} className={cn(WINDOW_BODY, 'p-4 @lg:p-5')}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex flex-wrap gap-1.5 text-[11.5px] font-medium">
              <span className="rounded-md bg-cream px-2.5 py-1 text-ink">All sources</span>
              {['Websites', 'Apps', 'Trademarks'].map((label) => (
                <span key={label} className="rounded-md bg-white/[0.06] px-2.5 py-1 text-cream/70">
                  {label}
                </span>
              ))}
            </p>
            <span className="text-[11px] text-cream/60">Sorted by risk</span>
          </div>
          <ul className="relative mt-3.5 space-y-2" style={{ minHeight: ROWS.length * 56 - 8 }}>
            <AnimatePresence initial={false}>
              {visible.map((row) => (
                <Row key={row.id} row={row} step={step} open={open && row.id === 'site'} />
              ))}
            </AnimatePresence>
          </ul>
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-white/[0.035] p-3.5 ring-1 ring-white/[0.07] @lg:grid-cols-3 @lg:gap-5">
            <SignalBar label="Text similarity" value={94} shown={scores >= 1} />
            <SignalBar label="Visual similarity" value={88} shown={scores >= 2} delay={100} />
            <SignalBar label="Meaning similarity" value={61} shown={scores >= 3} delay={200} />
          </div>
          <Show when={step >= 8} className="mt-3">
            <p className="text-[11.5px] leading-snug text-cream/65">
              {step >= 9
                ? 'acrne-login.com approved for a takedown request by the legal reviewer. A person sends it.'
                : 'acrne-login.com is waiting for a person to review the evidence.'}
            </p>
          </Show>
        </div>
      </AppWindow>
    </SceneFigure>
  );
}
