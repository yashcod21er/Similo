import { Globe, Lock, Smartphone, Stamp, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Section } from '@/components/marketing/sections';
import { ExampleTag, SectionHeading } from '@/components/ui/layout';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';

/* Each copycat is shown as the original next to the imitation, the way a customer meets it. */

function AddressBar({ host, changed }: { host: string; changed?: string }) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-lg bg-white px-3 shadow-[0_1px_2px_rgb(21_19_15/0.06)] ring-1 ring-line">
      <Lock aria-hidden className="size-3.5 shrink-0 text-muted" />
      <span className="truncate font-mono text-[13px]">
        {host}
        {changed && <mark className="rounded bg-accent/10 px-0.5 text-accent-ink">{changed}</mark>}
        .com
      </span>
    </div>
  );
}

function WebsitePair() {
  return (
    <div className="space-y-2.5">
      <AddressBar host="acme" />
      <AddressBar host="acme" changed="-login" />
    </div>
  );
}

function AppTile({ name, publisher, copy }: { name: string; publisher: string; copy?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-[0_1px_2px_rgb(21_19_15/0.06)] ring-1 ring-line">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-[0.7rem] bg-night font-semibold text-cream"
      >
        A<span className="text-accent-soft">.</span>
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-semibold">{name}</p>
        <p className="truncate text-[12px] text-muted">
          {copy ? (
            <>
              by <mark className="rounded bg-accent/10 px-0.5 text-accent-ink">{publisher}</mark>
            </>
          ) : (
            <>by {publisher}</>
          )}
        </p>
      </div>
    </div>
  );
}

function AppPair() {
  return (
    <div className="space-y-2.5">
      <AppTile name="Acme Wallet" publisher="Acme Inc." />
      <AppTile name="Acme Wallet Pro" publisher="Acme Apps Ltd" copy />
    </div>
  );
}

function TrademarkPair() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="rounded-xl bg-white p-3 text-center shadow-[0_1px_2px_rgb(21_19_15/0.06)] ring-1 ring-line">
        <p className="text-[11px] text-muted">Your mark</p>
        <p className="mt-1 text-lg font-semibold tracking-[0.08em]">ACME</p>
      </div>
      <div className="rounded-xl bg-white p-3 text-center shadow-[0_1px_2px_rgb(21_19_15/0.06)] ring-1 ring-accent/40">
        <p className="text-[11px] text-muted">New filing</p>
        <p className="mt-1 text-lg font-semibold tracking-[0.08em]">
          A<mark className="rounded bg-accent/10 text-accent-ink">K</mark>ME
        </p>
      </div>
      <p className="col-span-2 text-center text-[12px] text-muted">
        Sounds the same · objection window open
      </p>
    </div>
  );
}

const KINDS: { icon: LucideIcon; title: string; text: string; visual: ReactNode }[] = [
  {
    icon: Globe,
    title: 'A fake website',
    text: 'Someone registers a name close to yours, copies your sign-in page and sends your customers a link.',
    visual: <WebsitePair />,
  },
  {
    icon: Smartphone,
    title: 'A copycat app',
    text: 'An app uses your name, logo and colours. People install it because they think it is yours.',
    visual: <AppPair />,
  },
  {
    icon: Stamp,
    title: 'A look-alike trademark',
    text: 'A company files a name that sounds like yours. If nobody objects in time, it can be registered.',
    visual: <TrademarkPair />,
  },
];

/** The problem in plain words: why copycats work, and the three forms they take. */
export function ProblemSection() {
  return (
    <Section tone="white">
      <SectionHeading
        align="split"
        eyebrow="The problem"
        title="Copycats do not look fake. That is why they work."
        description="They borrow your name, your logo and your look. Your customers cannot tell the difference, and by the time someone notices, the damage is done."
      />
      <RevealGroup className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {KINDS.map((kind) => (
          <RevealItem key={kind.title} className="h-full">
            <article className="flex h-full flex-col rounded-2xl bg-cream p-2 ring-1 ring-line">
              <div
                className="flex min-h-[11.75rem] flex-col justify-center rounded-xl bg-cream-deep/60 p-5"
                aria-hidden
              >
                {kind.visual}
              </div>
              <div className="flex flex-1 flex-col p-4 pt-5">
                <h3 className="flex items-center gap-2.5 text-[1.0625rem] font-semibold tracking-[-0.015em]">
                  <kind.icon aria-hidden className="size-[18px] text-accent" />
                  {kind.title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted">{kind.text}</p>
              </div>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>
      <div className="mt-5 flex justify-end">
        <ExampleTag tone="light" />
      </div>
    </Section>
  );
}
