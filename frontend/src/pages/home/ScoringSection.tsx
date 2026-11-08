import { ArrowRight, FileSearch, Eye, Type, UserRoundCheck, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Section } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';

const SIGNALS: {
  icon: LucideIcon;
  name: string;
  question: string;
  checks: string[];
  example: { from: string; to: string; note: string };
}[] = [
  {
    icon: Type,
    name: 'Name',
    question: 'Is it spelled to look like you?',
    checks: [
      'Typos and swapped letters',
      'Look-alike letters such as “rn” for “m”',
      'Your name plus a word, or a new ending',
    ],
    example: { from: 'acme.com', to: 'acrne.com', note: '“rn” looks like “m”' },
  },
  {
    icon: Eye,
    name: 'Visual',
    question: 'Does it look like you?',
    checks: [
      'Your logo, or one close to it',
      'Your colours and page layout',
      'App icons that copy yours',
    ],
    example: { from: 'Your sign-in page', to: 'Their page', note: 'Same layout and logo' },
  },
  {
    icon: FileSearch,
    name: 'Page content',
    question: 'Does it act like you?',
    checks: [
      'Text that copies yours',
      'Forms that ask for passwords or payment',
      'Products or offers in your name',
    ],
    example: { from: 'Sign in to Acme', to: 'Sign in to Acme', note: 'Same words, new site' },
  },
];

/** "How we score": the three named signals, explained in the open, and the human decision. */
export function ScoringSection() {
  return (
    <Section>
      <SectionHeading
        align="split"
        eyebrow="How we score, in the open"
        title="Three signals you can check. One decision that stays yours."
        description="Every alert shows each signal with its own score and the reasons behind it. Nothing is hidden in a single number, and the score only sorts the queue."
      />

      <RevealGroup className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {SIGNALS.map((signal, index) => (
          <RevealItem key={signal.name} className="h-full">
            <article className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-card ring-1 ring-line sm:p-7">
              <div className="flex items-center justify-between">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-night text-accent-soft">
                  <signal.icon aria-hidden className="size-5" />
                </span>
                <span className="font-mono text-[12px] text-muted">Signal {index + 1} of 3</span>
              </div>
              <h3 className="text-title mt-6 font-semibold">{signal.name}</h3>
              <p className="mt-1 text-muted">{signal.question}</p>
              <ul className="mt-5 space-y-2 text-[14.5px]">
                {signal.checks.map((check) => (
                  <li key={check} className="flex gap-2.5">
                    <span aria-hidden className="mt-[9px] h-px w-3 shrink-0 bg-accent" />
                    {check}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl bg-cream p-3 ring-1 ring-line">
                  <span className="truncate text-center font-mono text-[12.5px] text-muted">
                    {signal.example.from}
                  </span>
                  <span aria-hidden className="text-accent">
                    ∼
                  </span>
                  <span className="truncate text-center font-mono text-[12.5px] font-medium text-accent-ink">
                    {signal.example.to}
                  </span>
                  <span className="col-span-3 text-center text-[12px] text-muted">
                    {signal.example.note}
                  </span>
                </div>
              </div>
            </article>
          </RevealItem>
        ))}
      </RevealGroup>

      {/* The order of things: signals → reasons → a risk level → a person. */}
      <Reveal className="mt-5">
        <div className="grid grid-cols-1 items-center gap-6 rounded-2xl bg-night p-6 text-cream shadow-window sm:p-8 xl:grid-cols-[auto_minmax(0,1fr)] xl:gap-12">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-3 text-[14px]">
            {['Three signals', 'Reasons in plain words', 'A risk level to sort by'].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="rounded-full bg-cream/[0.07] px-3.5 py-1.5 text-cream/85 ring-1 ring-cream/15">
                  {item}
                </span>
                <ArrowRight aria-hidden className="size-4 text-cream/40" />
              </li>
            ))}
            <li className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 font-medium text-white">
              <UserRoundCheck aria-hidden className="size-4" />A person decides
            </li>
          </ol>
          <p className="max-w-sm text-[14.5px] leading-relaxed text-cream/70">
            The score is not a legal finding. It tells your team what to look at first; your
            reviewer decides what happens.{' '}
            <Link to="/technology" className="font-medium text-accent-soft hover:underline">
              How the signals work
            </Link>
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
