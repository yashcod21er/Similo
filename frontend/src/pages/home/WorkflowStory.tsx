import {
  ArrowRight,
  Check,
  FileText,
  Globe,
  Image,
  Smartphone,
  Stamp,
  UserRound,
} from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router';
import { AppWindow } from '@/components/motion/AppWindow';
import { ScrollStory, type ScrollStoryStep } from '@/components/motion/ScrollStory';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Container, Eyebrow } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/cn';
import { Appear, MiniSignIn, SignalMeter } from './scene-parts';
import { useStoryActive } from './useStoryActive';

/* ------------------------------------------------------------ Step visuals */

const FEED = [
  { host: 'sunnyfield-bakery.com', match: false },
  { host: 'acme-login.com', match: true },
  { host: 'parkview-dental.net', match: false },
  { host: 'northgate-cycles.org', match: false },
  { host: 'acme.shop', match: true },
  { host: 'riverbend-yoga.com', match: false },
];

/** Step 1: new registrations stream past; the two that resemble Acme are picked out. */
function WatchVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useStoryActive(ref);
  return (
    <div ref={ref}>
      <AppWindow tone="light" url="app.similo.example/sources" title="Illustrative example">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { icon: Globe, label: 'Websites', active: true },
              { icon: Smartphone, label: 'Apps', active: false },
              { icon: Stamp, label: 'Trademarks', active: false },
            ].map((tab) => (
              <span
                key={tab.label}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-medium ring-1',
                  tab.active ? 'bg-night text-cream ring-night' : 'text-muted ring-line',
                )}
              >
                <tab.icon aria-hidden className="size-3.5" />
                {tab.label}
              </span>
            ))}
          </div>
          <p className="mt-5 text-[12px] font-medium tracking-[0.06em] text-muted uppercase">
            Newly registered today
          </p>
          <ul className="mt-2 divide-y divide-line rounded-xl ring-1 ring-line">
            {FEED.map((row, index) => (
              <Appear
                key={row.host}
                as="li"
                on={on}
                delay={index * 90}
                className={cn(
                  'flex items-center justify-between gap-3 px-4 py-2.5',
                  row.match && 'bg-accent/[0.05]',
                )}
              >
                <span
                  className={cn(
                    'truncate font-mono text-[13px]',
                    row.match ? 'font-medium text-ink' : 'text-muted',
                  )}
                >
                  {row.host}
                </span>
                {row.match ? (
                  <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">
                    Looks like acme.com
                  </span>
                ) : (
                  <span className="shrink-0 text-[11.5px] text-muted">No match</span>
                )}
              </Appear>
            ))}
          </ul>
        </div>
      </AppWindow>
    </div>
  );
}

/** Step 2: one alert, its three named signals and the reasons in plain words. */
function ExplainVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useStoryActive(ref);
  return (
    <div ref={ref}>
      <AppWindow
        tone="light"
        url="app.similo.example/alerts/acme-login.com"
        title="Illustrative example"
      >
        <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_10rem] sm:p-6">
          <div className="min-w-0">
            <p className="font-mono text-[17px] font-medium">acme-login.com</p>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Risk level <span className="font-medium text-accent-ink">High</span> · from three
              signals
            </p>
            <div className="mt-5 space-y-3">
              <SignalMeter tone="light" label="Name" value={92} on={on} />
              <SignalMeter tone="light" label="Visual" value={84} on={on} delay={150} />
              <SignalMeter tone="light" label="Page content" value={88} on={on} delay={300} />
            </div>
            <ul className="mt-5 space-y-2">
              {[
                'Your name with the word “login” added',
                'Same layout and logo as your sign-in page',
                'Asks for a password on a 2-day-old site',
              ].map((reason, index) => (
                <Appear
                  key={reason}
                  as="li"
                  on={on}
                  delay={700 + index * 180}
                  className="flex items-start gap-2 text-[13px] leading-snug"
                >
                  <span aria-hidden className="mt-[6px] size-1.5 shrink-0 rounded-full bg-accent" />
                  {reason}
                </Appear>
              ))}
            </ul>
          </div>
          <div className="hidden space-y-2.5 sm:block">
            <MiniSignIn tone="light" className="h-20" />
            <p className="text-[11px] text-muted">Yours</p>
            <MiniSignIn tone="light" copy className="h-20 ring-accent/50" />
            <p className="text-[11px] text-muted">Theirs, captured</p>
          </div>
        </div>
      </AppWindow>
    </div>
  );
}

/** Step 3: a person reviews the evidence and decides; the draft is never sent by itself. */
function DecideVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const on = useStoryActive(ref);
  return (
    <div ref={ref}>
      <AppWindow
        tone="light"
        url="app.similo.example/alerts/acme-login.com/review"
        title="Illustrative example"
      >
        <div className="p-5 sm:p-6">
          <ol className="flex items-center gap-2 text-[12px] font-medium">
            <li className="rounded-full bg-cream-deep px-2.5 py-1 text-muted">Needs review</li>
            <li aria-hidden className="h-px w-6 bg-line-strong" />
            <Appear
              as="li"
              on={on}
              delay={500}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-white"
            >
              <Check aria-hidden className="size-3.5" /> Approved for takedown request
            </Appear>
          </ol>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-cream p-4 ring-1 ring-line">
              <p className="text-[12px] font-medium tracking-[0.06em] text-muted uppercase">
                Evidence
              </p>
              <ul className="mt-3 space-y-2 text-[13px]">
                {[
                  { icon: Image, text: 'Screenshot, 14:02 UTC' },
                  { icon: FileText, text: 'Registration record' },
                  { icon: Globe, text: 'Page code and links' },
                ].map((item, index) => (
                  <Appear
                    key={item.text}
                    as="li"
                    on={on}
                    delay={index * 120}
                    className="flex items-center gap-2"
                  >
                    <item.icon aria-hidden className="size-3.5 text-accent" />
                    {item.text}
                  </Appear>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-white p-4 ring-1 ring-line">
              <p className="text-[12px] font-medium tracking-[0.06em] text-muted uppercase">
                Draft request
              </p>
              <div aria-hidden className="mt-3 space-y-1.5">
                <span className="block h-1.5 w-11/12 rounded-full bg-ink/15" />
                <span className="block h-1.5 w-full rounded-full bg-ink/10" />
                <span className="block h-1.5 w-4/5 rounded-full bg-ink/10" />
                <span className="block h-1.5 w-2/3 rounded-full bg-ink/10" />
              </div>
              <p className="mt-3 text-[12px] text-muted">Not sent. You edit and send it.</p>
            </div>
          </div>

          <Appear
            on={on}
            delay={800}
            className="mt-4 flex items-center gap-3 rounded-xl bg-night px-4 py-3 text-cream"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream/10">
              <UserRound aria-hidden className="size-4 text-accent-soft" />
            </span>
            <p className="text-[13px] leading-snug">
              <span className="font-medium">Your security reviewer</span>{' '}
              <span className="text-cream/70">approved this and added a note. Logged.</span>
            </p>
          </Appear>
        </div>
      </AppWindow>
    </div>
  );
}

/* ------------------------------------------------------------------ Section */

const STEPS: ScrollStoryStep[] = [
  {
    id: 'watch',
    label: 'Watch',
    title: 'Similo watches where copycats appear.',
    body: 'Every day it checks newly registered websites, app store listings and trademark journals for names that resemble yours, so you hear about a copy before your customers do.',
    visual: <WatchVisual />,
  },
  {
    id: 'explain',
    label: 'Explain',
    title: 'Each alert says why it looks like you.',
    body: 'Three named signals (name, visual and page content) each get their own score, and the reasons are written in plain words anyone on your team can check.',
    visual: <ExplainVisual />,
  },
  {
    id: 'decide',
    label: 'Decide',
    title: 'A person makes every decision.',
    body: 'Your reviewer sees the evidence and chooses what happens next. Takedown requests are drafted for you to edit, and nothing is ever sent automatically.',
    visual: <DecideVisual />,
  },
];

/** Dark band: Watch → Explain → Decide as a scroll story with a pinned product visual. */
export function WorkflowStory() {
  return (
    <section aria-labelledby="workflow-title" className="bg-night py-24 text-cream lg:py-32">
      <Container>
        <div className="max-w-3xl">
          <Reveal y={12}>
            <Eyebrow tone="dark">How Similo works</Eyebrow>
          </Reveal>
          <SplitReveal
            as="h2"
            id="workflow-title"
            className="text-statement serif-em mt-5 font-semibold text-balance"
          >
            From the first signal to <em className="text-accent-soft">a decision you made.</em>
          </SplitReveal>
        </div>
        <ScrollStory steps={STEPS} tone="dark" className="mt-16 lg:mt-8" />
        <Reveal className="mt-14 lg:mt-4">
          <Link
            to="/platform"
            className="inline-flex items-center gap-1.5 text-[15px] font-medium text-accent-soft hover:underline"
          >
            See the whole platform <ArrowRight aria-hidden className="size-4" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
