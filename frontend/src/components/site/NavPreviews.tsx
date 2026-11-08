import type { ReactElement } from 'react';
import { cn } from '@/lib/cn';
import type { NavPreviewKind } from './navigation';

/*
 * Small illustrations for the mega menu: one per page, each drawn from the job that page
 * describes (a look-alike address, an app and its copy, two near-identical marks, a
 * checklist, three steps, three score bars). They are decorative (aria-hidden) and use the
 * fictional brand "Acme", never a real company.
 */

const card = 'fill-white stroke-line-strong';

function Domain() {
  return (
    <>
      <rect x="9" y="9" width="78" height="46" rx="6" className={card} strokeWidth="1" />
      <rect x="15" y="15" width="66" height="10" rx="5" className="fill-cream" />
      <text
        x="20"
        y="22.4"
        fontSize="6"
        fontFamily="ui-monospace, monospace"
        className="fill-ink"
        fontWeight="500"
      >
        acme<tspan className="fill-accent">-login</tspan>.com
      </text>
      <rect x="15" y="31" width="40" height="4" rx="2" className="fill-ink/15" />
      <rect x="15" y="39" width="28" height="4" rx="2" className="fill-ink/10" />
      <rect x="58" y="37" width="23" height="11" rx="5.5" className="fill-accent" />
      <rect x="63" y="41.5" width="13" height="2" rx="1" className="fill-white" />
    </>
  );
}

function App() {
  return (
    <>
      <rect x="32" y="5" width="32" height="54" rx="7" className={card} strokeWidth="1" />
      <rect x="37" y="11" width="22" height="22" rx="6" className="fill-ink" />
      <path d="M42.5 24a5.5 5.5 0 0 1 11 0" className="stroke-white" strokeWidth="2" fill="none" />
      <rect x="37" y="36" width="22" height="19" rx="6" className="fill-accent" />
      <path d="M42.5 43a5.5 5.5 0 0 0 11 0" className="stroke-white" strokeWidth="2" fill="none" />
      <rect x="10" y="26" width="14" height="3.5" rx="1.75" className="fill-ink/15" />
      <rect x="72" y="26" width="14" height="3.5" rx="1.75" className="fill-ink/15" />
    </>
  );
}

function Trademark() {
  return (
    <>
      <rect x="9" y="9" width="78" height="46" rx="6" className={card} strokeWidth="1" />
      <text
        x="16"
        y="27"
        fontSize="11"
        fontWeight="700"
        letterSpacing="0.5"
        className="fill-ink"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        ACME
      </text>
      <text
        x="16"
        y="43"
        fontSize="11"
        fontWeight="700"
        letterSpacing="0.5"
        className="fill-ink"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        ACME<tspan className="fill-accent">E</tspan>
      </text>
      <rect x="62" y="19" width="19" height="4" rx="2" className="fill-ink/10" />
      <rect x="62" y="19" width="16" height="4" rx="2" className="fill-accent" />
      <rect x="62" y="35" width="19" height="4" rx="2" className="fill-ink/10" />
      <rect x="62" y="35" width="13" height="4" rx="2" className="fill-ink/60" />
    </>
  );
}

function Evidence() {
  const rows = [
    { y: 17, done: true, width: 38 },
    { y: 31, done: true, width: 30 },
    { y: 45, done: false, width: 34 },
  ];
  return (
    <>
      <rect x="9" y="7" width="78" height="50" rx="6" className={card} strokeWidth="1" />
      {rows.map((row) => (
        <g key={row.y}>
          {row.done ? (
            <>
              <circle cx="21" cy={row.y} r="5" className="fill-accent" />
              <path
                d={`M18.6 ${row.y}l1.8 1.8 3.2-3.4`}
                className="stroke-white"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <circle
              cx="21"
              cy={row.y}
              r="4.5"
              className="fill-white stroke-ink/35"
              strokeWidth="1.2"
            />
          )}
          <rect x="31" y={row.y - 2} width={row.width} height="4" rx="2" className="fill-ink/15" />
          <rect x="72" y={row.y - 2} width="9" height="4" rx="2" className="fill-ink/10" />
        </g>
      ))}
    </>
  );
}

function Platform() {
  return (
    <>
      <path d="M22 32H74" className="stroke-line-strong" strokeWidth="1.5" strokeDasharray="2 3" />
      <circle cx="18" cy="32" r="9" className={card} strokeWidth="1" />
      <circle cx="48" cy="32" r="11" className="fill-accent" />
      <circle cx="78" cy="32" r="9" className="fill-ink" />
      <circle cx="18" cy="32" r="3.2" className="fill-ink/60" />
      <path
        d="M43.5 32h9M48 27.5v9"
        className="stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M74 32.2l3 3 5.2-5.6"
        className="stroke-white"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

function Ai() {
  const bars = [
    { y: 14, fill: 46, tone: 'fill-ink/70' },
    { y: 28, fill: 30, tone: 'fill-ink/70' },
    { y: 42, fill: 56, tone: 'fill-accent' },
  ];
  return (
    <>
      <rect x="9" y="7" width="78" height="50" rx="6" className={card} strokeWidth="1" />
      {bars.map((bar) => (
        <g key={bar.y}>
          <rect x="15" y={bar.y} width="14" height="5" rx="2.5" className="fill-ink/20" />
          <rect x="33" y={bar.y} width="48" height="5" rx="2.5" className="fill-cream-deep" />
          <rect x="33" y={bar.y} width={bar.fill} height="5" rx="2.5" className={bar.tone} />
        </g>
      ))}
    </>
  );
}

const PREVIEWS: Record<NavPreviewKind, () => ReactElement> = {
  domain: Domain,
  app: App,
  trademark: Trademark,
  evidence: Evidence,
  platform: Platform,
  ai: Ai,
};

/**
 * An illustration tile for a mega-menu item. `row` is a 96 x 64 thumbnail beside the text;
 * `card` is a full-width banner above it.
 */
export function NavPreview({
  kind,
  layout = 'row',
}: {
  kind: NavPreviewKind;
  layout?: 'row' | 'card';
}) {
  const Drawing = PREVIEWS[kind];
  return (
    <span
      aria-hidden
      className={cn(
        'block shrink-0 overflow-hidden rounded-xl bg-cream-deep/70 ring-1 ring-line transition-colors group-hover/row:bg-cream-deep',
        layout === 'card' ? 'h-[6.5rem] w-full' : 'h-16 w-24',
      )}
    >
      <svg viewBox="0 0 96 64" className="size-full">
        <Drawing />
      </svg>
    </span>
  );
}
