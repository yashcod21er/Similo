import { useRef, type ReactNode } from 'react';
import { AppWindow } from '@/components/motion';
import { cn } from '@/lib/cn';
import { AppIcon } from './app';
import { ScoreTable } from './score';
import { Chip, DecisionBar, PaneLabel, SceneFigure, Show } from './scene-kit';
import { usePanelShown, WINDOW_BODY } from './scene-hooks';

/*
 * Story panels for the "How it works" page: where Similo looks, the three kinds of check,
 * the score, the reasons, and the person who decides. Sample data, made-up names.
 */

function StoryWindow({
  title,
  url,
  children,
}: {
  title: string;
  url: string;
  children: ReactNode;
}) {
  return (
    <AppWindow tone="dark" title={title} url={url}>
      <div className={cn(WINDOW_BODY, 'p-4 @lg:p-5')}>{children}</div>
    </AppWindow>
  );
}

const SOURCES = [
  { name: 'Newly registered websites', how: 'Registry files you are approved for', on: true },
  { name: 'Security certificate logs', how: 'Public Certificate Transparency logs', on: true },
  { name: 'Apple App Store', how: 'Apple’s official public search', on: true },
  { name: 'Trademark journals', how: 'Official journals, one office at a time', on: true },
  { name: 'Google Play', how: 'Needs a licensed data provider', on: false },
];

/** Step 1: where Similo looks, and what is not switched on. */
export function HowSourcesPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: a workspace's list of sources. Four are connected and Google Play is shown as not connected because it needs a licensed provider.">
      <div ref={ref}>
        <StoryWindow title="Sources" url="app.similo.example/settings/sources">
          <ul className="divide-y divide-white/[0.06]">
            {SOURCES.map((source, index) => (
              <Show
                key={source.name}
                as="li"
                when={shown}
                delay={index * 110}
                y={6}
                className="flex items-center gap-3 py-2.5"
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    source.on ? 'bg-emerald-400' : 'bg-white/25',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-cream">
                    {source.name}
                  </span>
                  <span className="block truncate text-[11px] text-cream/60">{source.how}</span>
                </span>
                <Chip level={source.on ? 'ok' : 'neutral'}>
                  {source.on ? 'Connected' : 'Not connected'}
                </Chip>
              </Show>
            ))}
          </ul>
          <p className="mt-3 text-[11.5px] text-cream/60">
            A source that is not set up is never shown as active.
          </p>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 2: names, logos and documents each get their own check. */
export function HowComparePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  const card = 'rounded-lg bg-white/[0.035] p-3 ring-1 ring-white/[0.06]';
  return (
    <SceneFigure label="Illustrative example: three separate checks. Names are compared letter by letter and by sound, logos and icons by their pictures, and journal pages are read.">
      <div ref={ref}>
        <StoryWindow title="Checks" url="app.similo.example/alerts/acrne-login.com/checks">
          <div className="grid grid-cols-1 gap-3 @lg:grid-cols-3">
            <Show when={shown} className={card}>
              <PaneLabel>Names</PaneLabel>
              <p className="mt-3 font-mono text-[12.5px] leading-relaxed text-cream">
                ac<mark className="rounded bg-accent px-0.5 text-white">rn</mark>e-login.com
              </p>
              <p className="mt-0.5 font-mono text-[12.5px] text-cream/60">acme.com</p>
              <p className="mt-2.5 text-[11px] leading-snug text-cream/65">
                Spelling, sound and meaning
              </p>
            </Show>
            <Show when={shown} delay={130} className={card}>
              <PaneLabel>Logos and icons</PaneLabel>
              <div className="mt-3 flex items-center gap-2">
                <AppIcon variant="official" className="size-9 rounded-[10px]" />
                <span aria-hidden className="text-cream/60">
                  ≈
                </span>
                <AppIcon variant="copy" className="size-9 rounded-[10px]" />
              </div>
              <p className="mt-2.5 text-[11px] leading-snug text-cream/65">
                Near-copies and overall style
              </p>
            </Show>
            <Show when={shown} delay={260} className={card}>
              <PaneLabel>Documents</PaneLabel>
              <div aria-hidden className="mt-3 space-y-1.5 rounded bg-cream p-2">
                <div className="h-1.5 w-[85%] rounded bg-ink/15" />
                <div className="h-3 rounded bg-accent/25 ring-1 ring-accent/50" />
                <div className="h-1.5 w-[60%] rounded bg-ink/15" />
              </div>
              <p className="mt-2.5 text-[11px] leading-snug text-cream/65">
                Journal pages read, page numbers kept
              </p>
            </Show>
          </div>
          <p className="mt-4 text-[11.5px] text-cream/60">
            Each check gives its own score. They are never blended into one mystery number.
          </p>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 3: the separate scores, weighted and added. */
export function HowScorePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: four separate scores, each with its weight, adding up to a priority of 83, which is high.">
      <div ref={ref}>
        <StoryWindow title="Score" url="app.similo.example/alerts/acrne-login.com/score">
          <ScoreTable shownCount={shown ? 4 : 0} showTotal={shown} />
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

const REASONS: [string, string][] = [
  ['Uses “rn” to look like “m”', 'HOMOGLYPH'],
  ['Name is very close to yours', 'FUZZY_NAME'],
  ['Page asks for a password', 'CREDENTIAL_FORM'],
  ['Registered less than a week ago', 'NEW_REGISTRATION'],
  ['Set up to send email', 'MX_CONFIGURED'],
];

/** Step 4: the reasons in plain words, each with a code stored with the alert. */
export function HowExplainPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: the reasons an alert was raised, written in plain words, each stored with a reason code.">
      <div ref={ref}>
        <StoryWindow title="Reasons" url="app.similo.example/alerts/acrne-login.com/reasons">
          <PaneLabel
            aside={<span className="text-[10.5px] text-cream/60">Stored with the alert</span>}
          >
            Why it was flagged
          </PaneLabel>
          <ul className="mt-2 divide-y divide-white/[0.06]">
            {REASONS.map(([plain, code], index) => (
              <Show
                key={code}
                as="li"
                when={shown}
                delay={index * 110}
                y={6}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="text-[12.5px] text-cream/90">{plain}</span>
                <span className="shrink-0 rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-accent-soft">
                  {code}
                </span>
              </Show>
            ))}
          </ul>
          <p className="mt-3 text-[11.5px] text-cream/60">
            Rules are versioned, so an old alert can always be explained.
          </p>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 5: a person decides, and it is recorded. */
export function HowDecidePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  const log: [string, string][] = [
    ['09:42', 'Alert raised, evidence saved'],
    ['10:20', 'Draft takedown request prepared'],
    ['10:48', 'Approved by the legal reviewer'],
  ];
  return (
    <SceneFigure label="Illustrative example: a reviewer approves a draft request, and every step is recorded in an audit log.">
      <div ref={ref}>
        <StoryWindow title="Decision" url="app.similo.example/alerts/acrne-login.com/decision">
          <DecisionBar stage={shown ? 2 : 1} />
          <PaneLabel className="mt-5">Audit log</PaneLabel>
          <ul className="mt-2 divide-y divide-white/[0.06]">
            {log.map(([time, text], index) => (
              <Show
                key={time}
                as="li"
                when={shown}
                delay={index * 120}
                y={5}
                className="flex gap-3 py-2 text-[12.5px]"
              >
                <span className="font-mono text-[11px] text-cream/60">{time}</span>
                <span className="text-cream/85">{text}</span>
              </Show>
            ))}
          </ul>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}
