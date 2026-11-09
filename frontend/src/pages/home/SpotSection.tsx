import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { CompareSlider } from '@/components/scenes';
import { useMinWidth } from '@/components/motion/hooks';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/cn';
import { Band, PlateLine } from './band';

/*
 * FIG. 02, "Spot the difference" (white band): the concept in one interactive picture. Exhibit A is the
 * sign-in page of the fictional brand Acme, exhibit B is a copy of it. Drag the tracing-paper
 * slider (or use the arrow keys) to wipe between them; the copy's four differences are ringed
 * in orange and numbered, and the legend underneath names them.
 */

const DIFFERENCES = [
  { n: '01', what: 'The address', detail: 'acme.com becomes acrne-login.com' },
  { n: '02', what: 'The logo', detail: 'Same shape, a slightly different orange' },
  { n: '03', what: 'The tone', detail: 'A calm welcome becomes a deadline' },
  { n: '04', what: 'The ask', detail: 'A new field asks for a card number' },
] as const;

/** An orange ring with a number tag, drawn around one difference in the copy. */
function Ring({ n, className, children }: { n: string; className?: string; children: ReactNode }) {
  return (
    <span className={cn('relative block', className)}>
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-1.5 rounded-[10px] ring-[1.5px] ring-accent"
      />
      <span
        aria-hidden
        className="absolute -top-2.5 -right-2.5 z-10 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-white"
      >
        {n}
      </span>
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <span className="block">
      <span className="block text-[11px] font-medium text-ink/60 sm:text-[12px] lg:text-[13px]">
        {label}
      </span>
      <span className="mt-1 flex h-8 items-center rounded-md bg-white px-2.5 font-mono text-[11px] text-ink/60 ring-1 ring-ink/15 sm:h-9 sm:text-[12px] lg:h-10">
        {value}
      </span>
    </span>
  );
}

/**
 * One sign-in page for the fictional brand "Acme", drawn in code. `copy` draws the imitation:
 * the same layout with four small differences, each ringed and numbered.
 */
function SignInSpecimen({ copy = false }: { copy?: boolean }) {
  const address = copy ? (
    <Ring n="01" className="min-w-0">
      <span className="flex h-6 min-w-0 items-center gap-1.5 rounded-md bg-ink/[0.05] px-2 font-mono text-[11px] text-ink/70 sm:text-[12px]">
        <Lock aria-hidden className="size-3 shrink-0" />
        <span className="truncate">acrne-login.com/verify</span>
      </span>
    </Ring>
  ) : (
    <span className="flex h-6 min-w-0 items-center gap-1.5 rounded-md bg-ink/[0.05] px-2 font-mono text-[11px] text-ink/70 sm:text-[12px]">
      <Lock aria-hidden className="size-3 shrink-0" />
      <span className="truncate">acme.com/sign-in</span>
    </span>
  );

  const logo = (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          'grid size-7 place-items-center rounded-lg font-semibold text-white',
          copy ? 'bg-[#d9661c]' : 'bg-accent',
        )}
      >
        A
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">Acme</span>
    </span>
  );

  return (
    <div
      aria-hidden
      className="flex h-full flex-col overflow-hidden bg-[#fbf8f3] text-ink select-none"
    >
      {/* Browser bar */}
      <div className="flex items-center gap-3 border-b border-ink/10 bg-white px-3 py-2">
        <span className="hidden gap-1.5 sm:flex">
          <span className="size-2 rounded-full bg-ink/15" />
          <span className="size-2 rounded-full bg-ink/15" />
          <span className="size-2 rounded-full bg-ink/15" />
        </span>
        <span className="min-w-0 flex-1 sm:max-w-xs">{address}</span>
      </div>

      {/* The site's own header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-8 sm:py-4">
        {copy ? <Ring n="02">{logo}</Ring> : logo}
        <span className="hidden gap-6 text-[13px] text-ink/60 sm:flex">
          <span>Personal</span>
          <span>Business</span>
          <span>Help</span>
        </span>
      </div>

      {/* The form, centred */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-5 pb-6">
        <div className="w-full max-w-[22rem] lg:max-w-[25rem]">
          <p className="text-center text-[1.3rem] leading-tight font-semibold tracking-[-0.03em] sm:text-[1.6rem] lg:text-[2rem]">
            Sign in to Acme
          </p>
          {copy ? (
            <Ring n="03" className="mx-auto mt-1.5 w-fit">
              <span className="block text-center text-[12px] text-accent-ink sm:text-[13px]">
                Account closes in 24 hours. Verify now.
              </span>
            </Ring>
          ) : (
            <span className="mt-1.5 block text-center text-[12px] text-ink/60 sm:text-[13px]">
              Welcome back. Good to see you again.
            </span>
          )}
          <span className="mt-5 grid gap-3">
            <Field label="Email" value="you@example.com" />
            <Field label="Password" value="••••••••••" />
            {copy ? (
              <Ring n="04">
                <Field label="Card number" value="0000 0000 0000 0000" />
              </Ring>
            ) : (
              // Same height as the copy's extra field, so the two pages line up exactly.
              <span className="relative block">
                <span className="invisible">
                  <Field label="Card number" value="0000" />
                </span>
                <span className="absolute bottom-1.5 left-0 flex items-center text-[12px] text-ink/60">
                  <span className="mr-2 inline-block size-3.5 rounded-[4px] ring-1 ring-ink/25" />
                  Keep me signed in
                </span>
              </span>
            )}
          </span>
          <span className="mt-4 flex h-9 items-center justify-center rounded-md bg-ink text-[13px] font-medium text-cream sm:h-10 lg:h-11">
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
}

/** White band: the headline, the compare slider and a legend of the four differences. */
export function SpotSection() {
  const wide = useMinWidth(1024);
  const medium = useMinWidth(640);
  const aspect = wide ? '2 / 1' : medium ? '16 / 11' : '3 / 4';

  return (
    <Band tone="white" labelledBy="spot-title" className="py-20 sm:py-24 lg:py-28">
      <PlateLine tone="white" index="02" title="Spot the difference" note="Exhibits A and B" />

      <div className="mt-12 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <SplitReveal
          as="h2"
          id="spot-title"
          className="text-[clamp(2.75rem,1rem+6vw,6.5rem)] leading-[0.95] font-semibold tracking-[-0.05em] text-balance"
        >
          Spot the difference.
        </SplitReveal>
        <Reveal delay={0.15}>
          <p className="max-w-sm text-[1.0625rem] leading-relaxed text-pretty text-muted lg:pb-2">
            A customer gives a sign-in page about two seconds. Similo compares the address, the
            logo, the words and every form field.
          </p>
        </Reveal>
      </div>

      <Reveal className="mt-12 lg:mt-16">
        <CompareSlider
          aspect={aspect}
          original={<SignInSpecimen />}
          copy={<SignInSpecimen copy />}
          originalLabel="Exhibit A · your sign-in page"
          copyLabel="Exhibit B · the copy"
          ariaLabel="Compare your sign-in page with the copy"
          caption="Fig. 02 — Sample pages for the fictional brand Acme"
        />
      </Reveal>

      <Reveal className="mt-10">
        <ol className="grid grid-cols-1 border-t border-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFERENCES.map((item) => (
            <li
              key={item.n}
              className="flex gap-4 border-b border-ink/10 py-5 sm:odd:border-r sm:odd:pr-6 sm:even:pl-6 lg:border-r lg:border-b-0 lg:px-6 lg:first:pl-0 lg:last:border-r-0"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent font-mono text-[11px] text-white">
                {item.n}
              </span>
              <span>
                <span className="block text-[15px] font-medium">{item.what}</span>
                <span className="mt-1 block text-[14px] leading-snug text-muted">
                  {item.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Reveal>
    </Band>
  );
}
