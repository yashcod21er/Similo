import { ArrowRight, Check, Fingerprint, ScanText } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Section } from '@/components/marketing/sections';
import { LogoMark } from '@/components/ui/Logo';
import { SectionHeading } from '@/components/ui/layout';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { cn } from '@/lib/cn';
import { EASE_OUT } from '@/lib/motion';

function Tile({
  title,
  text,
  under,
  visual,
  className,
  horizontal = false,
}: {
  title: string;
  text: string;
  /** Technical names, shown quietly after the plain explanation. */
  under: string;
  visual: ReactNode;
  className?: string;
  horizontal?: boolean;
}) {
  return (
    <RevealItem className={className}>
      <SpotlightCard
        className={cn(
          'flex h-full flex-col',
          horizontal && 'lg:grid lg:grid-cols-2 lg:items-center',
        )}
      >
        <div
          aria-hidden
          className={cn(
            'relative isolate flex min-h-[200px] items-center justify-center overflow-hidden bg-paper p-6',
            horizontal
              ? 'border-b border-line lg:order-2 lg:h-full lg:border-b-0 lg:border-l'
              : 'border-b border-line',
          )}
        >
          <div className="bg-dots mask-radial absolute inset-0 -z-10 opacity-60" />
          {visual}
        </div>
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <h3 className="text-title font-semibold">{title}</h3>
          <p className="mt-2.5 leading-relaxed text-muted">{text}</p>
          <p className="mt-auto pt-5 font-mono text-[12px] text-muted">
            <span className="text-crimson-dark">Under the hood:</span> {under}
          </p>
        </div>
      </SpotlightCard>
    </RevealItem>
  );
}

const pop = (delay = 0) => ({
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: EASE_OUT, delay },
});

function NamesVisual() {
  const rows: [string, ReactNode, string][] = [
    [
      'Looks like',
      <>
        ac<b className="text-crimson-dark">rn</b>e.com
      </>,
      '“rn” reads as “m”',
    ],
    [
      'Typo',
      <>
        a<b className="text-crimson-dark">mc</b>e.com
      </>,
      'Two letters swapped',
    ],
    [
      'Sounds like',
      <>
        a<b className="text-crimson-dark">k</b>me.com
      </>,
      'Same sound',
    ],
  ];
  return (
    <div className="w-full max-w-md space-y-2">
      {rows.map(([label, domain, why], index) => (
        <motion.div
          key={label}
          {...pop(index * 0.1)}
          className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-soft ring-1 ring-line"
        >
          <span className="w-20 shrink-0 text-[12px] text-muted">{label}</span>
          <span className="flex-1 font-mono text-[15px] text-ink [&_b]:font-medium">{domain}</span>
          <span className="hidden text-[12px] text-muted sm:block">{why}</span>
        </motion.div>
      ))}
    </div>
  );
}

function LogoVisual() {
  return (
    <div className="flex items-center gap-4">
      <motion.div {...pop()} className="text-center">
        <LogoMark className="size-16 rounded-2xl shadow-lifted" />
        <p className="mt-2 text-[12px] text-muted">Yours</p>
      </motion.div>
      <motion.div {...pop(0.1)} className="flex flex-col items-center">
        <span className="rounded-full bg-crimson/10 px-2.5 py-1 text-[12px] font-semibold text-crimson-dark">
          Very similar
        </span>
        <span className="mt-2 h-px w-16 bg-line-strong" />
      </motion.div>
      <motion.div {...pop(0.2)} className="text-center">
        <LogoMark className="size-16 rotate-[4deg] rounded-2xl opacity-90 saturate-[0.8] shadow-lifted" />
        <p className="mt-2 text-[12px] text-muted">Found</p>
      </motion.div>
    </div>
  );
}

function JournalVisual() {
  return (
    <motion.div
      {...pop()}
      className="w-full max-w-[260px] rounded-xl bg-white p-4 shadow-lifted ring-1 ring-line"
    >
      <div className="flex items-center justify-between text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <ScanText aria-hidden className="size-3.5 text-crimson-dark" /> Journal 2214
        </span>
        <span>page 318</span>
      </div>
      <div className="mt-3 space-y-1.5">
        <span className="block h-1.5 w-full rounded bg-card" />
        <span className="block h-1.5 w-4/5 rounded bg-card" />
        <span className="block rounded bg-crimson/10 px-1.5 py-1 font-mono text-[12px] text-crimson-dark ring-1 ring-crimson/30">
          ACMEE · class 9
        </span>
        <span className="block h-1.5 w-11/12 rounded bg-card" />
        <span className="block h-1.5 w-3/5 rounded bg-card" />
      </div>
    </motion.div>
  );
}

function RegistrationVisual() {
  const rows = [
    ['Registered', '2 days ago'],
    ['Email set up', 'Yes'],
    ['Owner', 'Hidden'],
  ];
  return (
    <motion.dl
      {...pop()}
      className="w-full max-w-[260px] divide-y divide-line rounded-xl bg-white px-4 shadow-lifted ring-1 ring-line"
    >
      {rows.map(([term, value]) => (
        <div key={term} className="flex justify-between py-2.5 text-[13.5px]">
          <dt className="text-muted">{term}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </motion.dl>
  );
}

function RiskVisual() {
  const reasons = ['Name looks like yours', 'Brand-new website', 'Has a login form'];
  return (
    <motion.div
      {...pop()}
      className="w-full max-w-[260px] rounded-xl bg-white p-4 shadow-lifted ring-1 ring-line"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted">Risk level</span>
        <span className="rounded-full bg-crimson/10 px-2.5 py-0.5 text-[12.5px] font-semibold text-crimson-dark">
          High
        </span>
      </div>
      <p className="mt-3 text-[12px] text-muted">Because:</p>
      <ul className="mt-1.5 space-y-1.5">
        {reasons.map((reason) => (
          <li key={reason} className="flex items-center gap-2 text-[13.5px]">
            <Check aria-hidden className="size-3.5 text-crimson-dark" />
            {reason}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function ProofVisual() {
  return (
    <div className="flex w-full max-w-md items-center gap-4">
      <motion.div
        {...pop()}
        className="aspect-[4/3] w-36 shrink-0 overflow-hidden rounded-xl bg-white p-2 shadow-lifted ring-1 ring-line"
      >
        <div className="h-3 w-1/2 rounded bg-card" />
        <div className="mt-2 h-14 rounded-md bg-gradient-to-br from-coral/40 to-crimson/30" />
        <div className="mt-2 h-2 w-3/4 rounded bg-card" />
      </motion.div>
      <motion.div {...pop(0.15)} className="min-w-0 flex-1 space-y-2">
        <p className="inline-flex items-center gap-1.5 text-[13px] font-medium">
          <Fingerprint aria-hidden className="size-4 text-crimson-dark" /> Fingerprint saved
        </p>
        <p className="truncate rounded-lg bg-white px-2.5 py-1.5 font-mono text-[12px] text-muted ring-1 ring-line">
          9f2c4e1b7d0a…a71e
        </p>
        <p className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700">
          <Check aria-hidden className="size-4" /> Unchanged since capture
        </p>
      </motion.div>
    </div>
  );
}

/** 03 — What you get: six checks as a bento grid, plain words first. */
export function WhatYouGet() {
  return (
    <Section>
      <SectionHeading
        align="split"
        index="03"
        eyebrow="What you get"
        title={
          <>
            Six checks, explained in <em className="text-crimson">plain</em> words.
          </>
        }
        description="Every alert says exactly what matched and why it matters. The technical detail is there when you want it."
      />
      <RevealGroup className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
        <Tile
          className="lg:col-span-4"
          title="Names that look or sound like yours"
          text="Swapped letters, lookalike characters, extra words and names that sound the same — the tricks copycats use to fool people."
          under="edit distance · homoglyph tables · phonetic matching"
          visual={<NamesVisual />}
        />
        <Tile
          className="lg:col-span-2"
          title="Copied logos and app icons"
          text="Finds logos and icons that look like yours, even if they are resized or recoloured."
          under="perceptual hashing · image embeddings"
          visual={<LogoVisual />}
        />
        <Tile
          className="lg:col-span-2"
          title="Reads trademark journals for you"
          text="Turns long, scanned journals into a list of new trademarks to compare with yours."
          under="OCR · document parsing"
          visual={<JournalVisual />}
        />
        <Tile
          className="lg:col-span-2"
          title="Who registered it, and when"
          text="A website made two days ago with email set up is a warning sign. You see those facts at a glance."
          under="RDAP · DNS and MX records"
          visual={<RegistrationVisual />}
        />
        <Tile
          className="lg:col-span-2"
          title="A risk level you can understand"
          text="High, medium or low — always with the reasons listed, so you know what to look at first."
          under="weighted, explainable reason codes"
          visual={<RiskVisual />}
        />
        <Tile
          horizontal
          className="md:col-span-2 lg:col-span-6"
          title="Proof that can’t be quietly changed"
          text="Every screenshot and record is saved with a digital fingerprint. If anything is altered later, the fingerprint no longer matches — so your evidence holds up."
          under="SHA-256 hashing · chain of custody"
          visual={<ProofVisual />}
        />
      </RevealGroup>
      <p className="mt-10 text-center">
        <Link
          to="/technology"
          className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-crimson"
        >
          See the technology behind each check <ArrowRight aria-hidden className="size-4" />
        </Link>
      </p>
    </Section>
  );
}
