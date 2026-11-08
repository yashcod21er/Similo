import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CornerDownLeft,
  type LucideIcon,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { RESOURCES } from '@/content/resources';
import { cn } from '@/lib/cn';
import { EASE_OUT } from '@/lib/motion';
import { howItWorksItems, solutionItems } from './navigation';

type Group = 'Solutions' | 'How it works' | 'Guides' | 'Actions';

interface Command {
  id: string;
  group: Group;
  label: string;
  hint: string;
  to: string;
  icon: LucideIcon;
  keywords: string;
}

const COMMANDS: Command[] = [
  ...solutionItems.map((item) => ({
    id: item.to,
    group: 'Solutions' as const,
    label: item.label,
    hint: item.description,
    to: item.to,
    icon: item.icon,
    keywords: 'product solution',
  })),
  ...howItWorksItems.map((item) => ({
    id: item.to,
    group: 'How it works' as const,
    label: item.label,
    hint: item.description,
    to: item.to,
    icon: item.icon,
    keywords: 'platform technology ai how it works',
  })),
  ...RESOURCES.map((resource) => ({
    id: `/resources/${resource.slug}`,
    group: 'Guides' as const,
    label: resource.title,
    hint: `${resource.type} · ${resource.readMinutes} min read`,
    to: `/resources/${resource.slug}`,
    icon: BookOpen,
    keywords: `${resource.category} ${resource.tags.join(' ')}`,
  })),
  {
    id: 'check',
    group: 'Actions',
    label: 'Check your brand name',
    hint: 'See how copycats could imitate it',
    to: '/#check',
    icon: ShieldCheck,
    keywords: 'try lookalike checker scan',
  },
  {
    id: 'demo',
    group: 'Actions',
    label: 'Request a demo',
    hint: 'Talk to the team',
    to: '/contact',
    icon: CalendarCheck,
    keywords: 'contact sales talk',
  },
  {
    id: 'status',
    group: 'Actions',
    label: 'System status',
    hint: 'Live health of the platform',
    to: '/status',
    icon: Activity,
    keywords: 'health uptime api',
  },
];

const DEFAULT_IDS = new Set([
  ...solutionItems.map((item) => item.to),
  'check',
  'demo',
  '/resources/lookalike-domains-explained',
]);

function search(query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMANDS.filter((command) => DEFAULT_IDS.has(command.id));
  return COMMANDS.map((command) => {
    const label = command.label.toLowerCase();
    const score = label.startsWith(q)
      ? 3
      : label.includes(q)
        ? 2
        : `${command.hint} ${command.keywords}`.toLowerCase().includes(q)
          ? 1
          : 0;
    return { command, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.command);
}

const GROUP_ORDER: Group[] = ['Actions', 'Solutions', 'How it works', 'Guides'];

function CommandDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  // Results grouped for display, but navigated as one flat list.
  const flat = useMemo(() => {
    const results = search(query);
    return GROUP_ORDER.flatMap((group) => results.filter((command) => command.group === group));
  }, [query]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (command: Command | undefined) => {
    if (!command) return;
    onClose();
    void navigate(command.to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (flat.length ? (index + 1) % flat.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (flat.length ? (index - 1 + flat.length) % flat.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(flat[active]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'Tab') {
      // Focus stays in the search box; options are reached with the arrow keys.
      event.preventDefault();
    }
  };

  const optionId = (index: number) => `${baseId}-option-${index}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[12vh]">
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-midnight/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Search the site"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
        className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-stage ring-1 ring-line"
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search aria-hidden className="size-5 shrink-0 text-muted" />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={`${baseId}-list`}
            aria-activedescendant={flat.length ? optionId(active) : undefined}
            aria-autocomplete="list"
            placeholder="Search pages, guides and actions…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="h-16 w-full bg-transparent text-[17px] outline-none placeholder:text-muted/80"
          />
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted sm:block">
            Esc
          </kbd>
        </div>

        <ul
          ref={listRef}
          id={`${baseId}-list`}
          role="listbox"
          aria-label="Results"
          className="max-h-[min(420px,60vh)] overflow-y-auto p-2"
        >
          {flat.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted">
              No results for “{query}”. Try “domain”, “trademark” or “demo”.
            </li>
          )}
          {GROUP_ORDER.map((group) => {
            const items = flat
              .map((command, index) => ({ command, index }))
              .filter((entry) => entry.command.group === group);
            if (!items.length) return null;
            return (
              <li key={group} role="presentation">
                <p
                  role="presentation"
                  className="px-3 pt-3 pb-1.5 text-[12px] font-medium text-muted"
                >
                  {group}
                </p>
                <ul role="presentation">
                  {items.map(({ command, index }) => {
                    const selected = index === active;
                    return (
                      <li
                        key={command.id}
                        id={optionId(index)}
                        data-index={index}
                        role="option"
                        aria-selected={selected}
                        onPointerMove={() => setActive(index)}
                        onClick={() => run(command)}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5',
                          selected ? 'bg-paper' : '',
                        )}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-crimson ring-1 ring-line">
                          <command.icon aria-hidden className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">
                            {command.label}
                          </span>
                          <span className="block truncate text-[13px] text-muted">
                            {command.hint}
                          </span>
                        </span>
                        {selected ? (
                          <CornerDownLeft aria-hidden className="size-4 shrink-0 text-muted" />
                        ) : (
                          <ArrowRight aria-hidden className="size-4 shrink-0 text-line-strong" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-line bg-paper px-5 py-2.5 font-mono text-[11px] text-muted">
          <span>↑ ↓ to move · Enter to open</span>
          <span className="hidden sm:inline">Ctrl K / ⌘ K</span>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Site-wide search (⌘K / Ctrl K, or "/"). Restores focus to whatever opened
 * it when it closes.
 */
export function CommandMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
    } else {
      returnFocus.current?.focus?.();
    }
  }, [open]);

  return <AnimatePresence>{open && <CommandDialog onClose={onClose} />}</AnimatePresence>;
}
