import { AlertTriangle, Check, Fingerprint, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { AppWindow } from '@/components/motion';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/cn';
import {
  Chip,
  DecisionBar,
  Fact,
  MiniPage,
  PaneLabel,
  SceneFigure,
  Show,
  SignalBar,
  type Level,
} from './scene-kit';
import { usePanelShown, useSceneStep, WINDOW_BODY } from './scene-hooks';

/*
 * Domain Intelligence scenes. Sample brand "Acme"; every name is made up.
 * The hero scene loops: look-alike names arrive, one is flagged, its scores fill, its
 * registration facts and page capture appear, a person decides. The same parts are
 * reused alone as ScrollStory panels.
 */

const FLAGGED = 'acrne-login.com';

interface FeedItem {
  id: string;
  name: string;
  registered: string;
  level: Level;
  label: string;
}

/** In arrival order: the last one is the flagged name. */
const FEED: FeedItem[] = [
  {
    id: 'recipes',
    name: 'acme-recipes.blog',
    registered: '3 days ago',
    level: 'low',
    label: 'Low',
  },
  { id: 'shop', name: 'acmes-shop.top', registered: '1 day ago', level: 'medium', label: 'Medium' },
  { id: 'acmee', name: 'acmee.co', registered: '2 days ago', level: 'medium', label: 'Medium' },
  { id: 'login', name: FLAGGED, registered: '2 days ago', level: 'high', label: 'High' },
];

/* ----------------------------------------------------------- Feed of names */

function FeedRow({
  item,
  scored,
  selected,
}: {
  item: FeedItem;
  scored: boolean;
  selected: boolean;
}) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 transition-colors duration-500',
        selected ? 'bg-accent/[0.14] ring-accent/60' : 'bg-white/[0.035] ring-white/[0.06]',
      )}
    >
      <Globe aria-hidden className="size-4 shrink-0 text-cream/50" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[12.5px] text-cream">{item.name}</p>
        <p className="text-[11px] text-cream/60">Registered {item.registered}</p>
      </div>
      <Chip level={scored ? item.level : 'neutral'}>{scored ? item.label : 'Checking'}</Chip>
    </motion.li>
  );
}

/** Newly registered names arriving at the top. `count` rows are showing; `scored` of them have a result. */
export function DomainFeed({
  count,
  scored,
  selected,
}: {
  count: number;
  scored: number;
  selected: boolean;
}) {
  const visible = FEED.slice(0, count).reverse();
  return (
    <div>
      <PaneLabel>New registrations</PaneLabel>
      <ul className="relative mt-2.5 space-y-2" style={{ minHeight: FEED.length * 52 - 8 }}>
        <AnimatePresence initial={false}>
          {visible.map((item) => {
            const index = FEED.indexOf(item);
            return (
              <FeedRow
                key={item.id}
                item={item}
                scored={index < scored}
                selected={selected && item.name === FLAGGED}
              />
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------ Page capture */

export function CaptureFrame({ shown }: { shown: boolean }) {
  return (
    <Show when={shown}>
      <PaneLabel>Page capture</PaneLabel>
      <div className="mt-2.5 rounded-lg bg-white/[0.035] p-2.5 ring-1 ring-white/[0.06]">
        <MiniPage url={`${FLAGGED}/secure`} copy />
        <p className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px] text-cream/65">
          <Fingerprint aria-hidden className="size-3 shrink-0 text-emerald-300" />
          <span className="truncate">SHA-256 9f2c…a71e · saved 09:42</span>
        </p>
      </div>
    </Show>
  );
}

/* ------------------------------------------------------------------ Scores */

/** The three named similarity scores. `shownCount` of them are filled in. */
export function DomainScores({
  shownCount,
  notes = true,
}: {
  shownCount: number;
  notes?: boolean;
}) {
  return (
    <div className="space-y-3">
      <SignalBar
        label="Text similarity"
        value={94}
        shown={shownCount >= 1}
        note={notes && '“rn” reads as “m”, and “login” is added'}
      />
      <SignalBar
        label="Visual similarity"
        value={88}
        shown={shownCount >= 2}
        delay={120}
        note={notes && 'Sign-in page layout and logo match yours'}
      />
      <SignalBar
        label="Meaning similarity"
        value={61}
        shown={shownCount >= 3}
        delay={240}
        note={notes && '“login” suggests an account page'}
      />
    </div>
  );
}

/* --------------------------------------------------------- Registration facts */

export function RdapFacts({ shown }: { shown: boolean }) {
  return (
    <div>
      <PaneLabel aside={<span className="font-mono text-[10.5px] text-cream/60">RDAP</span>}>
        Registration facts
      </PaneLabel>
      <dl className="mt-1.5 divide-y divide-white/[0.06]">
        <Fact label="Registered" value="2 days ago" shown={shown} flag />
        <Fact label="Registrar" value="Example Registrar, Inc." shown={shown} delay={90} />
        <Fact label="Owner" value="Hidden by a privacy service" shown={shown} delay={180} />
        <Fact
          label="Email set up (MX)"
          value="Yes, switched on day 1"
          shown={shown}
          delay={270}
          flag
        />
      </dl>
    </div>
  );
}

/* -------------------------------------------------------------- Hero scene */

const STEP_COUNT = 11;

/** The Domain page's hero scene. */
export function DomainScene() {
  const { ref, step } = useSceneStep(STEP_COUNT, 1100);
  const count = Math.min(step + 1, FEED.length);
  const scored = Math.min(Math.max(step, 0), FEED.length);
  const selected = step >= 4;
  const scores = step >= 4 ? Math.min(step - 3, 3) : 0;
  const stage = step >= 9 ? 2 : step >= 8 ? 1 : 0;

  return (
    <SceneFigure label="Illustrative example: a look-alike website name arrives in a feed of new registrations, is flagged with separate text, visual and meaning scores, its registration facts and a page capture are saved, and a person reviews it.">
      <AppWindow tone="dark" title="Domains" url="app.similo.example/domains">
        <div
          ref={ref}
          className={cn(
            WINDOW_BODY,
            'grid grid-cols-1 gap-x-5 gap-y-5 p-4 @lg:grid-cols-[1fr_1.05fr] @lg:p-5',
          )}
        >
          <div className="space-y-5">
            <DomainFeed count={count} scored={scored} selected={selected} />
            <div className="hidden @lg:block">
              <CaptureFrame shown={step >= 5} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid">
              <Show
                when={!selected}
                y={0}
                className="col-start-1 row-start-1 self-start rounded-lg border border-dashed border-white/15 px-3 py-3 text-[12px] leading-snug text-cream/65"
              >
                Scoring the newest names. When one stands out, its scores and evidence appear here.
              </Show>
              <Show when={selected} className="col-start-1 row-start-1">
                <PaneLabel aside={<Chip level="high">High priority</Chip>}>
                  Selected alert
                </PaneLabel>
                <p className="mt-2 truncate font-mono text-[15px] font-medium text-cream">
                  {FLAGGED}
                </p>
                <p className="mt-0.5 text-[11.5px] text-cream/60">
                  Looks like acme.com, your website
                </p>
              </Show>
            </div>
            <div>
              <PaneLabel>Scores, 0 to 100</PaneLabel>
              <div className="mt-2.5">
                <DomainScores shownCount={scores} />
              </div>
            </div>
            <RdapFacts shown={step >= 7} />
            <DecisionBar stage={stage} />
          </div>
        </div>
      </AppWindow>
    </SceneFigure>
  );
}

/* ----------------------------------------------------------- Story panels */

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

/** Step 1: the feed of new registrations. */
export function DomainWatchPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: a feed of newly registered website names, each one being checked.">
      <div ref={ref}>
        <StoryWindow title="Domains" url="app.similo.example/domains">
          <DomainFeed
            count={shown ? FEED.length : 1}
            scored={shown ? FEED.length : 0}
            selected={false}
          />
          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/[0.07] pt-4 text-[11.5px] text-cream/65 sm:grid-cols-2">
            <p>Sources: registry files and certificate logs your workspace is approved for.</p>
            <p>Your own sites and partners are on an allow-list and never alerted.</p>
          </div>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 2: the name compared with yours, and the three scores. */
export function DomainComparePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: the look-alike name compared letter by letter with the real one, with text, visual and meaning scores.">
      <div ref={ref}>
        <StoryWindow title="Compare" url="app.similo.example/domains/compare">
          <div className="space-y-2 font-mono text-[15px]">
            <p className="flex items-center justify-between rounded-lg bg-white/[0.035] px-3 py-2.5 ring-1 ring-white/[0.06]">
              <span className="text-cream">acme.com</span>
              <span className="font-sans text-[11px] text-cream/60">Your website</span>
            </p>
            <p className="flex items-center justify-between rounded-lg bg-accent/[0.12] px-3 py-2.5 ring-1 ring-accent/50">
              <span className="text-cream">
                ac<mark className="rounded bg-accent px-0.5 text-white">rn</mark>e
                <mark className="rounded bg-accent/40 px-0.5 text-cream">-login</mark>.com
              </span>
              <span className="font-sans text-[11px] text-accent-soft">Found</span>
            </p>
          </div>
          <div className="mt-5">
            <PaneLabel>Scores, 0 to 100</PaneLabel>
            <div className="mt-3">
              <DomainScores shownCount={shown ? 3 : 0} />
            </div>
          </div>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 3: the reasons, the registration facts and the saved page capture. */
export function DomainEvidencePanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: the saved page capture with its fingerprint, and the registration facts for the flagged name.">
      <div ref={ref}>
        <StoryWindow title="Evidence" url="app.similo.example/domains/acrne-login">
          <div className="grid grid-cols-1 gap-5 @lg:grid-cols-[1fr_1fr]">
            <CaptureFrame shown={shown} />
            <RdapFacts shown={shown} />
          </div>
          <ul className="mt-4 space-y-1.5 border-t border-white/[0.07] pt-4 text-[12px] text-cream/80">
            {[
              'Looks like your name: “rn” reads as “m”',
              'Registered 2 days ago, email already on',
              'Has a sign-in form that copies yours',
            ].map((reason, index) => (
              <Show
                key={reason}
                as="li"
                when={shown}
                delay={300 + index * 110}
                y={5}
                className="flex gap-2"
              >
                <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-accent-soft" />
                {reason}
              </Show>
            ))}
          </ul>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/** Step 4: a person decides. */
export function DomainDecisionPanel() {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePanelShown(ref);
  return (
    <SceneFigure label="Illustrative example: a reviewer approves a takedown request draft, or dismisses the alert with a reason.">
      <div ref={ref}>
        <StoryWindow title="Review" url="app.similo.example/domains/acrne-login/review">
          <p className="truncate font-mono text-[15px] font-medium text-cream">{FLAGGED}</p>
          <div className="mt-4">
            <DecisionBar stage={shown ? 2 : 1} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 @lg:grid-cols-2">
            <div className="rounded-lg bg-white/[0.035] p-3 ring-1 ring-white/[0.06]">
              <p className="text-[12px] font-medium text-cream">Draft takedown request</p>
              <p className="mt-1 text-[11.5px] leading-snug text-cream/65">
                Written from the saved evidence. A person edits it, approves it and sends it.
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.035] p-3 ring-1 ring-white/[0.06]">
              <p className="text-[12px] font-medium text-cream">Or dismiss it</p>
              <p className="mt-1 text-[11.5px] leading-snug text-cream/65">
                A false alarm is closed with a reason, so it does not keep coming back.
              </p>
            </div>
          </div>
        </StoryWindow>
      </div>
    </SceneFigure>
  );
}

/* --------------------------------------------------- Real page vs the copy */

/** The real sign-in page next to the copy, on a light band. */
export function PageCompareVisual() {
  return (
    <SceneFigure
      tone="light"
      label="Illustrative example: your real sign-in page next to a look-alike copy that is almost identical."
      caption="Illustrative example: both pages are drawn for this page, with made-up names."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-emerald-800">
            <Check aria-hidden className="size-3.5" /> Your real page
          </p>
          <MiniPage url="portal.acme.com/login" className="shadow-card ring-ink/15" />
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-accent-ink">
            <AlertTriangle aria-hidden className="size-3.5" /> The copy we found
          </p>
          <MiniPage url="acrne-login.com/secure" copy className="shadow-card" />
        </div>
      </div>
    </SceneFigure>
  );
}
