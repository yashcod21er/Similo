import { ArrowRight, Plus } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Section } from '@/components/marketing/sections';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { ButtonLink } from '@/components/ui/Button';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';
import { Container } from '@/components/ui/layout';
import { LogoSymbol } from '@/components/ui/Logo';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { FigCaption, MonoLabel, RegMarks } from '@/components/ui/specimen';
import { cn } from '@/lib/cn';

/*
 * Page pieces shared by the pages in `pages/` (v6, "Spot the difference"). Every page gets the
 * same few building blocks so the site feels like one evidence room, but each section is free
 * to bring a different kind of visual:
 *
 *   PageHero      cream or night hero: a case label, one headline, one sentence, one exhibit
 *   SectionHead   mono label + big tight headline + one sentence
 *   StepRows      steps as big numerals with a hairline between them
 *   StepsWithScene  the same steps beside one sticky product scene
 *   SpecimenGrid  a hairline table of "FIG." items (no repeated rounded cards)
 *   UnderTheHood  the technical detail, folded into a small mono note
 *   OrangeBand    the page's one full-bleed burnt-orange band (usually the closing call to action)
 *   FaqBlock, Timeline, RuledList, CardGrid, SplitSection, ProductFigure  small layouts
 */

/** A photo's file path (without the size suffix), alt text and the 1600 px file's size. */
export interface PhotoData {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Display type for page headlines: tight tracking, line height about 1, a big scale gap. */
export const H1_CLASS =
  'text-[clamp(2.75rem,1rem+6vw,5.75rem)] leading-[0.98] tracking-[-0.05em] font-semibold text-balance';
export const H2_CLASS =
  'text-[clamp(2.125rem,1.1rem+3.6vw,4.5rem)] leading-[1] tracking-[-0.045em] font-semibold text-balance';
/** A big numeral or short word set in a row of steps or a table. */
export const H3_CLASS =
  'text-[clamp(1.5rem,1.1rem+1.4vw,2.375rem)] leading-[1.05] tracking-[-0.035em] font-semibold text-balance';

/* ------------------------------------------------------------------ Hero */

/**
 * Inner-page hero. The case label ("CASE 01 · WEBSITES") sits above one headline (an `<em>` in
 * it is the page's one serif italic phrase), one sentence and the buttons; the visual on the
 * right is an exhibit, not a screenshot. `tone` picks cream or night.
 */
export function PageHero({
  label,
  title,
  description,
  primary = { label: 'Request a demo', to: '/contact' },
  secondary,
  visual,
  tone = 'light',
}: {
  label: string;
  title: ReactNode;
  description: ReactNode;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
  visual: ReactNode;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden',
        dark ? 'bg-night text-cream' : 'bg-cream text-ink',
      )}
    >
      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
          <div>
            <MonoLabel tone={dark ? 'dark' : 'light'}>{label}</MonoLabel>
            <h1 className={cn(H1_CLASS, 'serif-em-accent mt-6', dark ? 'text-cream' : 'text-ink')}>
              {title}
            </h1>
            <p
              className={cn(
                'text-lead mt-7 max-w-md text-pretty',
                dark ? 'text-cream/75' : 'text-muted',
              )}
            >
              {description}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to={primary.to} size="lg">
                {primary.label}
              </ButtonLink>
              {secondary && (
                <ButtonLink to={secondary.to} variant={dark ? 'outline-dark' : 'outline'} size="lg">
                  {secondary.label}
                </ButtonLink>
              )}
            </div>
          </div>
          <div className="min-w-0">{visual}</div>
        </div>
        <RegMarks tone={dark ? 'dark' : 'light'} className="hidden lg:block" />
      </Container>
    </section>
  );
}

/* ----------------------------------------------------------- Section head */

/** A mono label, a big tight headline (its words slide up out of a mask) and one sentence. */
export function SectionHead({
  label,
  title,
  description,
  tone = 'light',
  id,
  className,
}: {
  label: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: 'light' | 'dark';
  /** Put on the `h2`, so a section can use `aria-labelledby`. */
  id?: string;
  className?: string;
}) {
  const dark = tone === 'dark';
  return (
    <div className={cn('max-w-3xl', className)}>
      <Reveal y={10}>
        <MonoLabel tone={tone}>{label}</MonoLabel>
      </Reveal>
      <SplitReveal
        as="h2"
        {...(id ? { id } : {})}
        className={cn(H2_CLASS, 'mt-5', dark ? 'text-cream' : 'text-ink')}
      >
        {title}
      </SplitReveal>
      {description && (
        <Reveal delay={0.2}>
          <p
            className={cn(
              'text-lead mt-6 max-w-xl text-pretty',
              dark ? 'text-cream/70' : 'text-muted',
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- Under the hood */

/**
 * The technical detail, folded away: a small mono "Under the hood" button that opens a short
 * note. Keeps the plain words first (the owner's rule) without deleting the detail.
 */
export function UnderTheHood({
  children,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const dark = tone === 'dark';
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'text-micro inline-flex items-center gap-1.5 py-1 transition-colors duration-150',
          dark ? 'text-cream/65 hover:text-cream' : 'text-muted hover:text-ink',
        )}
      >
        <Plus
          aria-hidden
          className={cn(
            'size-3 transition-transform duration-300 motion-reduce:transition-none',
            open && 'rotate-45',
          )}
        />
        Under the hood
      </button>
      <div
        id={id}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <p
            className={cn(
              'mt-2 border-l pl-3 font-mono text-[12.5px] leading-relaxed',
              dark ? 'border-cream/25 text-cream/70' : 'border-line-strong text-muted',
            )}
          >
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}

/** A one-line mono note with an orange tick, for a short plain fact under a visual. */
export function FigNote({
  children,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <p className={cn('flex items-start gap-2.5', className)}>
      <span
        aria-hidden
        className={cn(
          'mt-[3px] size-1.5 shrink-0',
          tone === 'dark' ? 'bg-accent-soft' : 'bg-accent',
        )}
      />
      <MonoLabel tone={tone}>{children}</MonoLabel>
    </p>
  );
}

/* ------------------------------------------------------------------ Steps */

export interface Step {
  title: string;
  text: string;
  /** The "Under the hood" line; shown in a small mono note. */
  hood?: string;
}

/**
 * Steps as big numerals with a hairline between them: number, title, one sentence. No icons, no
 * cards. `compact` is the narrower version that sits beside a scene.
 */
export function StepRows({
  steps,
  tone = 'light',
  compact = false,
}: {
  steps: Step[];
  tone?: 'light' | 'dark';
  compact?: boolean;
}) {
  const dark = tone === 'dark';
  return (
    <RevealGroup>
      <ol className={cn('border-b', dark ? 'border-cream/20' : 'border-line-strong')}>
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={cn('border-t', dark ? 'border-cream/20' : 'border-line-strong')}
          >
            <RevealItem
              className={cn(
                'group/step grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-3 py-7 sm:gap-x-8 lg:py-9',
                !compact &&
                  'lg:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-x-10 lg:gap-y-0',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'font-semibold tracking-[-0.06em] tabular-nums',
                  compact
                    ? 'text-[2.5rem] leading-none'
                    : 'text-[clamp(2.75rem,2rem+3vw,4.75rem)] leading-[0.9]',
                  dark ? 'text-accent-soft' : 'text-accent',
                )}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3
                className={cn(
                  compact ? 'text-[1.5rem] tracking-[-0.03em]' : H3_CLASS,
                  'font-semibold',
                  dark ? 'text-cream' : 'text-ink',
                  !compact && 'lg:pt-1',
                )}
              >
                {step.title}
              </h3>
              <div className={cn('col-start-2', !compact && 'lg:col-start-3 lg:row-start-1')}>
                <p
                  className={cn(
                    'text-pretty',
                    compact ? 'leading-relaxed' : 'text-lead',
                    dark ? 'text-cream/75' : 'text-muted',
                  )}
                >
                  {step.text}
                </p>
                {step.hood && (
                  <UnderTheHood tone={tone} className="mt-3">
                    {step.hood}
                  </UnderTheHood>
                )}
              </div>
            </RevealItem>
          </li>
        ))}
      </ol>
    </RevealGroup>
  );
}

/**
 * The steps on the left, one product scene on the right that stays in view while they scroll
 * past. This is the page's single product-UI scene.
 */
export function StepsWithScene({
  steps,
  scene,
  tone = 'light',
}: {
  steps: Step[];
  scene: ReactNode;
  tone?: 'light' | 'dark';
}) {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
      <StepRows steps={steps} tone={tone} compact />
      <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">{scene}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- Specimens */

export interface SpecimenData {
  title: string;
  text: string;
  /** A short mono example, such as `acrne.com`. */
  example?: string;
  /** The "Under the hood" line. */
  hood?: string;
}

/**
 * A hairline table of specimens, "FIG. 01" and up: no rounded cards, just rules between cells.
 * The orange rule under the number draws in when a cell is hovered or focused.
 */
export function SpecimenGrid({
  items,
  columns = 3,
  tone = 'light',
}: {
  items: SpecimenData[];
  columns?: 2 | 3 | 4;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <RevealGroup
      className={cn(
        'grid grid-cols-1 gap-px overflow-hidden border sm:grid-cols-2',
        columns === 3 && 'lg:grid-cols-3',
        columns === 4 && 'lg:grid-cols-4',
        dark ? 'border-cream/20 bg-cream/20' : 'border-line-strong bg-line-strong',
      )}
    >
      {items.map((item, index) => (
        <RevealItem key={item.title} className="h-full">
          <article
            className={cn(
              'group/fig relative flex h-full flex-col p-6 transition-colors duration-200 lg:p-8',
              dark ? 'bg-night hover:bg-night-raised' : 'bg-cream hover:bg-white',
            )}
          >
            <p className="flex items-center justify-between gap-3">
              <MonoLabel tone={tone}>FIG. {String(index + 1).padStart(2, '0')}</MonoLabel>
              <LogoSymbol
                className={cn(
                  'h-3 w-auto transition-[color,transform] duration-300 group-hover/fig:translate-x-1 group-hover/fig:text-accent motion-reduce:transition-none',
                  dark ? 'text-cream/30' : 'text-line-strong',
                )}
              />
            </p>
            <span
              aria-hidden
              className={cn(
                'mt-4 block h-px w-full origin-left scale-x-[0.12] transition-transform duration-500 ease-out group-hover/fig:scale-x-100 motion-reduce:transition-none',
                dark ? 'bg-accent-soft' : 'bg-accent',
              )}
            />
            <h3
              className={cn(
                'mt-6 text-[1.375rem] leading-[1.12] font-semibold tracking-[-0.03em] text-balance',
                dark ? 'text-cream' : 'text-ink',
              )}
            >
              {item.title}
            </h3>
            <p
              className={cn(
                'mt-3 leading-relaxed text-pretty',
                dark ? 'text-cream/70' : 'text-muted',
              )}
            >
              {item.text}
            </p>
            <div className="mt-auto pt-6">
              {item.example && (
                <p
                  className={cn(
                    'border-t border-dashed pt-4 font-mono text-[12.5px]',
                    dark ? 'border-cream/25 text-cream/80' : 'border-line-strong text-ink/80',
                  )}
                >
                  <span className={dark ? 'text-accent-soft' : 'text-accent-ink'}>e.g.</span>{' '}
                  {item.example}
                </p>
              )}
              {item.hood && (
                <UnderTheHood tone={tone} className={item.example ? 'mt-2' : undefined}>
                  {item.hood}
                </UnderTheHood>
              )}
            </div>
          </article>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}

/* --------------------------------------------------------------- Orange band */

const bandLink =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium tracking-[-0.01em] whitespace-nowrap transition-[background-color,color,transform] duration-200 ease-out active:translate-y-px focus-visible:outline-white';

/**
 * The page's one full-bleed burnt-orange band, usually the closing call to action. All text on
 * it is pure white (4.7:1 on the orange, passes AA at any size); cream would only reach 4.2:1.
 */
export function OrangeBand({
  label = 'Get started',
  title,
  description,
  primary = { label: 'Request a demo', to: '/contact' },
  secondary = { label: 'See how it works', to: '/platform' },
}: {
  label?: string;
  title: ReactNode;
  description: ReactNode;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string } | null;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-accent text-white">
      <LogoSymbol className="pointer-events-none absolute -right-[8%] -bottom-[18%] -z-10 hidden h-[88%] w-auto text-white/[0.09] lg:block" />
      <Container className="relative">
        <div className="py-20 sm:py-24 lg:py-36">
          <Reveal y={10}>
            <MonoLabel tone="orange">{label}</MonoLabel>
          </Reveal>
          <SplitReveal
            as="h2"
            className={cn(
              'mt-6 max-w-5xl text-[clamp(2.5rem,1rem+6.8vw,7rem)] leading-[0.95] tracking-[-0.05em] font-semibold text-balance text-white',
            )}
          >
            {title}
          </SplitReveal>
          <Reveal delay={0.25}>
            <p className="text-lead mt-8 max-w-lg text-pretty text-white">{description}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                to={primary.to}
                className={cn(
                  bandLink,
                  'bg-night text-cream shadow-[inset_0_1px_0_rgb(255_255_255/0.1)] hover:bg-night-raised',
                )}
              >
                {primary.label}
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              {secondary && (
                <Link
                  to={secondary.to}
                  className={cn(
                    bandLink,
                    'border border-white/70 text-white hover:border-white hover:bg-white/10',
                  )}
                >
                  {secondary.label}
                </Link>
              )}
            </div>
          </Reveal>
        </div>
        <RegMarks tone="orange" className="hidden lg:block" />
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------ Small layouts */

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

/**
 * A figure for a visual that uses sample data. The one discreet mono caption says so
 * ("FIG. 02: Sample data, made-up names").
 */
export function ProductFigure({
  children,
  index,
  caption,
  tone = 'light',
  className,
}: {
  children: ReactNode;
  /** The figure number, for example "02". */
  index: string;
  caption: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <figure className={cn('mx-auto w-full max-w-xl lg:max-w-none', className)}>
      {children}
      <FigCaption as="figcaption" index={index} tone={tone} className="mt-5">
        {caption}
      </FigCaption>
    </figure>
  );
}

/** A short list with a thin rule between items. */
export function RuledList({
  items,
  tone = 'light',
}: {
  items: { title: string; text: ReactNode; tag?: string }[];
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <ul
      className={cn(
        'divide-y border-y',
        dark ? 'divide-cream/20 border-cream/20' : 'divide-line-strong border-line-strong',
      )}
    >
      {items.map((item) => (
        <li key={item.title} className="py-6">
          <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span
              className={cn(
                'text-[1.25rem] font-semibold tracking-[-0.025em]',
                dark ? 'text-cream' : 'text-ink',
              )}
            >
              {item.title}
            </span>
            {item.tag && <MonoLabel tone={dark ? 'dark' : 'light'}>{item.tag}</MonoLabel>}
          </p>
          <p className={cn('mt-2 leading-relaxed', dark ? 'text-cream/70' : 'text-muted')}>
            {item.text}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** A short story told in a few lines; the `ours` line is Similo's part. */
export function Timeline({
  items,
  tone = 'light',
}: {
  items: { when: string; text: ReactNode; ours?: boolean }[];
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <ol
      className={cn(
        'mt-8 divide-y border-y',
        dark ? 'divide-cream/20 border-cream/20' : 'divide-line-strong border-line-strong',
      )}
    >
      {items.map((item) => (
        <li key={item.when} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 py-4">
          <span
            className={cn(
              'text-micro pt-1',
              item.ours
                ? dark
                  ? 'text-accent-soft'
                  : 'text-accent-ink'
                : dark
                  ? 'text-cream/65'
                  : 'text-muted',
            )}
          >
            {item.when}
          </span>
          <span
            className={cn(
              'leading-relaxed',
              item.ours
                ? dark
                  ? 'font-medium text-cream'
                  : 'font-medium text-ink'
                : dark
                  ? 'text-cream/80'
                  : 'text-ink/80',
            )}
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
    <Section scaffold tone={tone}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHead label="Questions" title={title} {...(description ? { description } : {})} />
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
