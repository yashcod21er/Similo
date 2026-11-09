import { Bot, FileText, User } from 'lucide-react';
import { AppWindow } from '@/components/motion';
import { cn } from '@/lib/cn';
import { SceneFigure, Show } from './scene-kit';
import { useSceneStep, WINDOW_BODY } from './scene-hooks';

/*
 * The case assistant: it answers only from the case's own records, numbers its sources, and
 * says so when the records do not hold the answer. Sample case, made-up names.
 */

const SOURCES = [
  { id: 1, label: 'Alert · acrne-login.com' },
  { id: 2, label: 'Evidence · page-capture.png' },
  { id: 3, label: 'Registration record · saved 09:51' },
];

const STEP_COUNT = 7;

function Cite({ id }: { id: number }) {
  return <sup className="ml-0.5 font-mono text-[10px] text-accent-soft">[{id}]</sup>;
}

/** A grounded answer that cites the records it used. */
export function AssistantScene({
  className,
  tone = 'dark',
  index,
}: {
  className?: string;
  index?: string;
  /** The band the scene sits on, which sets the caption colour. The window stays dark. */
  tone?: 'light' | 'dark';
}) {
  const { ref, step } = useSceneStep(STEP_COUNT, 1200);
  return (
    <SceneFigure
      className={className}
      tone={tone}
      {...(index ? { index } : {})}
      label="Illustrative example: someone asks why an alert was flagged. The assistant answers from the case records, cites three of them by number, and says that who operates the website is not in the records."
    >
      <AppWindow
        tone="dark"
        title="Assistant"
        url="app.similo.example/cases/fake-sign-in-pages/ask"
      >
        <div ref={ref} className={cn(WINDOW_BODY, 'space-y-3.5 p-4 @lg:p-5')}>
          <Show when={step >= 0} className="flex justify-end gap-2">
            <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-3.5 py-2.5 text-[12.5px] text-white">
              Why was acrne-login.com flagged against our brand?
            </p>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-cream/80">
              <User aria-hidden className="size-3.5" />
            </span>
          </Show>
          <Show when={step >= 1} className="flex gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft/20 text-accent-soft">
              <Bot aria-hidden className="size-3.5" />
            </span>
            <div className="min-w-0 rounded-2xl rounded-tl-sm bg-white/[0.06] px-3.5 py-3 text-[12.5px] leading-relaxed text-cream/90 ring-1 ring-white/10">
              <p>
                It replaces “m” with “rn”, which looks the same in many fonts
                <Cite id={1} />. The page copies your sign-in screen and sends passwords to another
                server
                <Cite id={2} />. It was registered two days before it was found
                <Cite id={3} />.
              </p>
              <Show
                when={step >= 4}
                className="mt-2.5 border-t border-white/10 pt-2.5 text-cream/65"
              >
                Not found in the case records: who operates the website.
              </Show>
            </div>
          </Show>
          <Show when={step >= 5} className="border-t border-white/[0.07] pt-3">
            <p className="text-[10.5px] font-semibold tracking-[0.04em] text-cream/60 uppercase">
              Sources
            </p>
            <ul className="mt-2 space-y-1.5">
              {SOURCES.map((source) => (
                <li key={source.id} className="flex items-center gap-2 text-[11.5px] text-cream/70">
                  <span className="font-mono text-accent-soft">[{source.id}]</span>
                  <FileText aria-hidden className="size-3 shrink-0" />
                  {source.label}
                </li>
              ))}
            </ul>
          </Show>
        </div>
      </AppWindow>
    </SceneFigure>
  );
}
