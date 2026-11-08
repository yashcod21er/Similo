import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  /** Small count or status shown after the label, e.g. "3". */
  badge?: string | undefined;
}

const tabId = (baseId: string, id: string) => `${baseId}-tab-${id}`;
const panelId = (baseId: string, id: string) => `${baseId}-panel-${id}`;

/**
 * Accessible tabs (WAI-ARIA tabs pattern): one tab stop for the whole list, arrow keys
 * (and Home/End) move between tabs and show their panel straight away.
 * Pair it with <TabPanel> using the same `baseId`.
 */
export function Tabs({
  baseId,
  label,
  tabs,
  value,
  onChange,
}: {
  baseId: string;
  label: string;
  tabs: readonly TabItem[];
  value: string;
  onChange: (id: string) => void;
}) {
  const refs = useRef(new Map<string, HTMLButtonElement>());

  // On a phone the list scrolls sideways: keep the chosen tab in view (also after a page load).
  useEffect(() => {
    refs.current.get(value)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [value]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === value);
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    const target = tabs[next];
    if (!target) return;
    event.preventDefault();
    onChange(target.id);
    refs.current.get(target.id)?.focus();
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {/* Arrow keys are handled here, once, for whichever tab has focus. */}
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex min-w-max gap-1 border-b border-line"
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                if (node) refs.current.set(tab.id, node);
                else refs.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              id={tabId(baseId, tab.id)}
              aria-selected={selected}
              aria-controls={panelId(baseId, tab.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                '-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[14.5px] font-medium whitespace-nowrap transition-colors',
                selected
                  ? 'border-ink text-ink'
                  : 'border-transparent text-muted hover:border-line-strong hover:text-ink',
              )}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[12px] leading-none font-medium ring-1',
                    selected ? 'bg-ink text-white ring-ink' : 'bg-white text-ink ring-line',
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The content of the selected tab. Render it only for the active tab. */
export function TabPanel({
  baseId,
  id,
  children,
}: {
  baseId: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div role="tabpanel" id={panelId(baseId, id)} aria-labelledby={tabId(baseId, id)} tabIndex={0}>
      {children}
    </div>
  );
}
