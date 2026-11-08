import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Section } from '@/components/marketing/sections';
import { ScrollStory, type ScrollStoryStep } from '@/components/motion';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';
import { Eyebrow, SectionHeading } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { cn } from '@/lib/cn';

/*
 * Small page pieces shared by the solution, resource and about pages.
 * Heroes, sections, cards, steps and the closing call to action come from
 * components/marketing/sections.tsx; this file only holds what those don't have.
 */

/** A photo's file path (without the size suffix), alt text and the 1600 px file's size. */
export interface PhotoData {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** One step of a page's scroll story: a short label, a statement, a plain paragraph and a visual. */
export interface StoryItem {
  label: string;
  title: ReactNode;
  description: string;
  /** The quiet "Under the hood" line. */
  detail?: string;
  visual: ReactNode;
}

/**
 * A dark band that tells the page's steps as a scroll story: the text scrolls on the left and
 * a product panel on the right changes with each step (stacked inline on phones). The heading
 * may hold one `<em>`, set in the serif accent.
 */
export function StoryBand({
  id,
  eyebrow,
  title,
  description,
  items,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  items: StoryItem[];
}) {
  const steps: ScrollStoryStep[] = items.map((item, index) => ({
    id: `step-${index + 1}`,
    label: item.label,
    title: item.title,
    body: (
      <>
        <p>{item.description}</p>
        {item.detail && <p className="mt-4 text-[13px] text-cream/60">{item.detail}</p>}
      </>
    ),
    visual: item.visual,
  }));
  return (
    <Section tone="dark" {...(id ? { id } : {})}>
      <Reveal className="max-w-3xl">
        <Eyebrow tone="dark">{eyebrow}</Eyebrow>
        <h2 className="text-statement serif-em mt-5 font-semibold text-balance text-cream">
          {title}
        </h2>
        {description && (
          <p className="text-lead mt-5 max-w-xl text-pretty text-cream/75">{description}</p>
        )}
      </Reveal>
      <div className="mt-14 lg:mt-20">
        <ScrollStory steps={steps} tone="dark" />
      </div>
    </Section>
  );
}

/** A responsive grid of cards that fades in as one block. */
export function CardGrid({
  columns = 3,
  className,
  children,
}: {
  columns?: 2 | 3 | 4;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Reveal
      y={12}
      className={cn(
        'grid grid-cols-1 gap-5 sm:grid-cols-2',
        columns === 3 && 'lg:grid-cols-3',
        columns === 4 && 'lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </Reveal>
  );
}

/** Text on one side, media on the other. `flip` puts the media first on large screens. */
export function SplitSection({
  text,
  media,
  flip = false,
  className,
}: {
  text: ReactNode;
  media: ReactNode;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16', className)}>
      <div className={cn(flip && 'lg:order-2')}>{text}</div>
      <div className={cn('min-w-0', flip && 'lg:order-1')}>{media}</div>
    </div>
  );
}

/** A figure for an illustrative product visual, always captioned. */
export function ProductFigure({
  children,
  caption,
  className,
}: {
  children: ReactNode;
  caption: string;
  className?: string;
}) {
  return (
    <figure className={cn('mx-auto w-full max-w-md lg:max-w-none', className)}>
      {children}
      <figcaption className="mt-4 text-[13px] leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}

/** A short list with a thin rule between items. */
export function RuledList({ items }: { items: { title: string; text: ReactNode }[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.title} className="py-5">
          <p className="font-semibold tracking-[-0.01em]">{item.title}</p>
          <p className="mt-1 leading-relaxed text-muted">{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

/** A short story told in a few lines; the `ours` line is Similo's part. */
export function Timeline({
  items,
}: {
  items: { when: string; text: ReactNode; ours?: boolean }[];
}) {
  return (
    <ol className="mt-8 space-y-4">
      {items.map((item) => (
        <li key={item.when} className="flex gap-5">
          <span
            className={cn(
              'w-16 shrink-0 pt-px text-[13px] font-medium',
              item.ours ? 'text-accent-ink' : 'text-muted',
            )}
          >
            {item.when}
          </span>
          <span
            className={cn('leading-relaxed', item.ours ? 'font-medium text-ink' : 'text-ink/80')}
          >
            {item.text}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Questions: intro on the left, the accordion on the right. */
export function FaqBlock({
  title,
  description,
  items,
  link,
  tone = 'white',
}: {
  title: ReactNode;
  description?: string;
  items: AccordionItem[];
  link?: { label: string; to: string };
  tone?: 'light' | 'white';
}) {
  return (
    <Section tone={tone}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="Questions"
            title={title}
            {...(description ? { description } : {})}
          />
          {link && (
            <Link
              to={link.to}
              className="group mt-7 inline-flex items-center gap-1.5 text-[15px] font-medium text-accent-ink hover:underline"
            >
              {link.label}
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          )}
        </div>
        <Reveal y={12}>
          <Accordion items={items} />
        </Reveal>
      </div>
    </Section>
  );
}
