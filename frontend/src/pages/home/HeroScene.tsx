import { Check, FileText, Globe, Image, Smartphone, Stamp, type LucideIcon } from 'lucide-react';
import { useRef } from 'react';
import { AppWindow } from '@/components/motion/AppWindow';
import { useLoop } from '@/components/motion/useLoop';
import { cn } from '@/lib/cn';
import { Appear, MiniSignIn, SignalMeter, StatusChip } from './scene-parts';

/*
 * The home hero's product scene, built in code with sample data for the fictional brand
 * "Acme". It loops through Similo's real job:
 *   0 watching → 1 a look-alike domain arrives → 2 the named signals fill →
 *   3–5 plain-language reasons appear (evidence is saved) → 6 a person approves → 7 hold.
 * With reduced motion useLoop returns the last step, so the finished alert is shown still.
 */

const STEP_MS = 1500;
const STEPS = 8;

const QUEUE: {
  icon: LucideIcon;
  name: string;
  kind: string;
  level: 'medium' | 'low';
  when: string;
}[] = [
  { icon: Globe, name: 'acrne-pay.com', kind: 'Website', level: 'medium', when: '1 h' },
  { icon: Smartphone, name: 'Acme Wallet Pro', kind: 'App', level: 'medium', when: '3 h' },
  { icon: Stamp, name: 'ACMEE', kind: 'Trademark', level: 'low', when: '1 d' },
];

const REASONS = [
  'Uses your name “acme” with the word “login” added.',
  'Copies the layout and logo of your sign-in page.',
  'Registered 2 days ago; the owner is hidden.',
];

export function HeroScene() {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(STEPS, STEP_MS, ref);
  const arrived = step >= 1;
  const scored = step >= 2;
  const approved = step >= 6;

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Illustrative example with sample data: Similo flags acme-login.com as a look-alike of acme.com. It scores the name 92, the visual match 84 and the page content 88 out of 100, lists three reasons in plain words, saves the evidence, and a reviewer approves a takedown request."
      className="relative"
    >
      <AppWindow
        tone="dark"
        url="app.similo.example/alerts"
        title={<span className="hidden sm:inline">Illustrative example</span>}
      >
        <div className="grid grid-cols-1 md:grid-cols-[13.5rem_minmax(0,1fr)]">
          {/* ---------- Alert queue ---------- */}
          <aside className="hidden border-r border-cream/[0.07] bg-night-raised/40 p-3 md:block">
            <div className="flex items-center justify-between px-1.5 pt-1 pb-3">
              <p className="text-[12px] font-semibold text-cream">Alerts</p>
              <p className="font-mono text-[11px] text-cream/65">{arrived ? 4 : 3} open</p>
            </div>
            <ul className="space-y-1">
              <li className="relative">
                {/* Before the alert arrives, the slot shows the watch in progress. */}
                <span
                  className={cn(
                    'absolute inset-0 flex items-center gap-2 rounded-lg px-2.5 text-[11.5px] text-cream/65 ring-1 ring-cream/10 ring-inset transition-opacity duration-300 motion-reduce:transition-none',
                    arrived ? 'opacity-0' : 'opacity-100',
                  )}
                >
                  <span className="size-1.5 rounded-full bg-cream/40" />
                  Checking new registrations…
                </span>
                <Appear on={arrived}>
                  <div className="rounded-lg bg-cream/[0.07] p-2.5 ring-1 ring-accent/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Globe aria-hidden className="size-3.5 shrink-0 text-accent-soft" />
                        <span className="truncate font-mono text-[11.5px] text-cream">
                          acme-login.com
                        </span>
                      </span>
                      <span className="size-1.5 shrink-0 rounded-full bg-accent-soft" />
                    </div>
                    <p className="mt-1 text-[11px] text-cream/65">Website · just now</p>
                  </div>
                </Appear>
              </li>
              {QUEUE.map((item) => (
                <li key={item.name} className="rounded-lg p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <item.icon aria-hidden className="size-3.5 shrink-0 text-cream/60" />
                      <span className="truncate font-mono text-[11.5px] text-cream/80">
                        {item.name}
                      </span>
                    </span>
                    <StatusChip tone={item.level} className="px-1.5 text-[10px]">
                      {item.level === 'medium' ? 'Medium' : 'Low'}
                    </StatusChip>
                  </div>
                  <p className="mt-1 text-[11px] text-cream/65">
                    {item.kind} · {item.when}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-cream/[0.07] px-1.5 pt-3">
              <p className="text-[11px] text-cream/65">Watching for acme.com</p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-cream/70">
                <li>New domain registrations</li>
                <li>App store listings</li>
                <li>Trademark journals</li>
              </ul>
            </div>
          </aside>

          {/* ---------- Alert detail ---------- */}
          <div className="relative min-w-0 p-4 sm:p-5">
            <Appear
              on={step === 0}
              className="pointer-events-none absolute inset-0 flex items-center justify-center p-6"
            >
              <p className="text-center text-[13px] text-cream/65">
                Watching new websites, apps and trademarks for look-alikes of{' '}
                <span className="font-mono text-cream/80">acme.com</span>…
              </p>
            </Appear>

            <Appear on={arrived} className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium tracking-[0.06em] text-accent-soft uppercase">
                  New look-alike website
                </p>
                <p className="mt-1 truncate font-mono text-[17px] font-medium text-cream sm:text-[19px]">
                  acme-login.com
                </p>
                <p className="mt-0.5 text-[12px] text-cream/65">
                  Found 4 minutes ago · matches acme.com
                </p>
              </div>
              <div className="relative">
                <StatusChip
                  tone="review"
                  className={cn(
                    'transition-opacity duration-300 motion-reduce:transition-none',
                    approved && 'opacity-0',
                  )}
                >
                  Needs review
                </StatusChip>
                <StatusChip
                  tone="approved"
                  className={cn(
                    'absolute top-0 right-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
                    approved ? 'scale-100 opacity-100' : 'scale-90 opacity-0',
                  )}
                >
                  <Check aria-hidden className="size-3" /> Approved
                </StatusChip>
              </div>
            </Appear>

            {/* Evidence: their page next to yours */}
            <Appear on={scored} className="mt-4 grid grid-cols-2 gap-2.5">
              <figure>
                <MiniSignIn className="h-[4.5rem]" />
                <figcaption className="mt-1.5 text-[11px] text-cream/65">
                  Your sign-in page
                </figcaption>
              </figure>
              <figure>
                <MiniSignIn copy className="h-[4.5rem] ring-1 ring-accent/60" />
                <figcaption className="mt-1.5 truncate text-[11px] text-cream/65">
                  acme-login.com, captured
                </figcaption>
              </figure>
            </Appear>

            {/* Named signals */}
            <Appear on={scored} className="mt-4 space-y-2.5">
              <p className="text-[11px] font-medium tracking-[0.06em] text-cream/65 uppercase">
                Why it matched
              </p>
              <SignalMeter
                label="Name"
                hint="spelling and look-alike letters"
                value={92}
                on={scored}
              />
              <SignalMeter
                label="Visual"
                hint="logo, colours, layout"
                value={84}
                on={scored}
                delay={150}
              />
              <SignalMeter
                label="Page content"
                hint="text and forms"
                value={88}
                on={scored}
                delay={300}
              />
            </Appear>

            {/* Reasons, in plain words */}
            <ul className="mt-4 space-y-1.5">
              {REASONS.map((reason, index) => (
                <Appear
                  key={reason}
                  as="li"
                  on={step >= 3 + index}
                  className="flex items-start gap-2"
                >
                  <span
                    aria-hidden
                    className="mt-[5px] size-1.5 shrink-0 rounded-full bg-accent-soft"
                  />
                  <span className="text-[12.5px] leading-snug text-cream/85">{reason}</span>
                </Appear>
              ))}
            </ul>

            {/* The decision stays with a person */}
            <Appear
              on={arrived}
              className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cream/[0.07] pt-3.5"
            >
              <div className="relative min-h-[2.25rem] min-w-0 flex-1">
                <p
                  className={cn(
                    'absolute inset-0 text-[11.5px] leading-snug text-cream/65 transition-opacity duration-300 motion-reduce:transition-none',
                    approved && 'opacity-0',
                  )}
                >
                  Risk level: <span className="text-accent-soft">High</span>. Nothing is sent until
                  a person approves.
                </p>
                <p
                  className={cn(
                    'absolute inset-0 text-[11.5px] leading-snug text-cream/80 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
                    approved ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
                  )}
                >
                  Approved for a takedown request by your security reviewer. Draft ready to edit.
                </p>
              </div>
              <span
                aria-hidden
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium transition-[background-color,color,transform] duration-300 motion-reduce:transition-none',
                  approved
                    ? 'scale-[0.97] bg-cream/10 text-cream/75'
                    : 'bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]',
                )}
              >
                {approved ? (
                  <>
                    <Check className="size-3.5" /> Approved
                  </>
                ) : (
                  'Approve takedown request'
                )}
              </span>
            </Appear>
          </div>
        </div>
      </AppWindow>

      {/* A layered card: the evidence Similo kept for this alert (large screens). */}
      <Appear
        on={step >= 4}
        className="absolute -bottom-8 -left-14 hidden w-56 rounded-xl bg-night-raised p-3.5 shadow-window-dark ring-1 ring-cream/10 xl:block"
      >
        <p className="text-[11px] font-medium tracking-[0.06em] text-cream/65 uppercase">
          Evidence saved
        </p>
        <ul className="mt-2.5 space-y-2">
          {[
            { icon: Image, text: 'Screenshot of the page' },
            { icon: FileText, text: 'Registration record (RDAP)' },
            { icon: Globe, text: 'Page code and links' },
          ].map((item) => (
            <li key={item.text} className="flex items-center gap-2 text-[12px] text-cream/85">
              <item.icon aria-hidden className="size-3.5 text-accent-soft" />
              {item.text}
            </li>
          ))}
        </ul>
      </Appear>
    </div>
  );
}
