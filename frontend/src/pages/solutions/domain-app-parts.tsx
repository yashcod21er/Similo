import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Section } from '@/components/marketing/sections';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { cn } from '@/lib/cn';

/* Building blocks shared by the Domain and App Intelligence pages. */

/** Technical names, on one quiet line, after the plain explanation. */
export function UnderTheHood({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('font-mono text-[12px] leading-relaxed text-muted', className)}>
      <span className="text-ink">Under the hood:</span> {children}
    </p>
  );
}

/** Bento tile: plain title and sentence first, a visual, then the technical footnote. */
export function Tile({
  title,
  description,
  underHood,
  children,
  className,
}: {
  title: ReactNode;
  description: string;
  underHood?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <SpotlightCard className={cn('flex h-full flex-col p-6 sm:p-8', className)}>
      <h3 className="text-title font-semibold">{title}</h3>
      <p className="mt-2.5 max-w-xl leading-relaxed text-muted">{description}</p>
      {children && <div className="mt-7 flex-1">{children}</div>}
      {underHood && (
        <UnderTheHood className="mt-6 border-t border-line pt-4">{underHood}</UnderTheHood>
      )}
    </SpotlightCard>
  );
}

/** Small card for one way a brand gets imitated, with a monospace example. */
export function KindCard({
  icon,
  title,
  text,
  example,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  example: string;
}) {
  return (
    <SpotlightCard className="flex h-full flex-col p-6">
      <span className="flex size-10 items-center justify-center rounded-xl bg-paper text-crimson-dark ring-1 ring-line transition-colors duration-300 group-hover/spot:bg-crimson group-hover/spot:text-white group-hover/spot:ring-crimson">
        {icon}
      </span>
      <h3 className="mt-6 text-[1.125rem] font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 flex-1 leading-relaxed text-muted">{text}</p>
      <p className="mt-6 rounded-xl bg-paper px-3 py-2 font-mono text-[12px] text-ink/75 ring-1 ring-line">
        {example}
      </p>
    </SpotlightCard>
  );
}

/** A short story told as a timeline; the last step is Similo's part. */
export function Story({ steps }: { steps: { when: string; text: ReactNode; ours?: boolean }[] }) {
  return (
    <RevealGroup className="relative mt-10 space-y-7">
      {steps.map((step, index) => (
        <RevealItem key={step.when} className="relative flex items-start gap-5">
          {/* Connector down to the next step's pill. */}
          {index < steps.length - 1 && (
            <span
              aria-hidden
              className="absolute top-3 -bottom-7 left-[37px] w-px bg-line-strong"
            />
          )}
          <span
            className={cn(
              'relative w-[76px] shrink-0 rounded-full py-1 text-center font-mono text-[11.5px] font-medium ring-1',
              step.ours
                ? 'bg-crimson text-white ring-crimson'
                : 'bg-white text-ink/75 ring-line-strong',
            )}
          >
            {step.when}
          </span>
          <p
            className={cn(
              'pt-0.5 leading-relaxed',
              step.ours ? 'font-medium text-ink' : 'text-ink/80',
            )}
          >
            {step.text}
          </p>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/** FAQ section: heading kept in view on large screens, questions on the right. */
export function FaqSection({
  index,
  title,
  description,
  items,
  link,
  tone = 'white',
}: {
  index: string;
  title: ReactNode;
  description: string;
  items: AccordionItem[];
  link?: { label: string; to: string };
  tone?: 'light' | 'white';
}) {
  return (
    <Section tone={tone}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            index={index}
            eyebrow="Questions"
            title={title}
            description={description}
          />
          {link && (
            <Reveal>
              <Link
                to={link.to}
                className="group mt-8 inline-flex items-center gap-1.5 text-[15px] font-medium text-crimson-dark"
              >
                {link.label}
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </Reveal>
          )}
        </div>
        <Reveal>
          <Accordion items={items} />
        </Reveal>
      </div>
    </Section>
  );
}
