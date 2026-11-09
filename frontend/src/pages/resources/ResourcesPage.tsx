import {
  ArrowRight,
  Megaphone,
  Scale,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { HoverReveal, HoverRevealItem } from '@/components/motion/HoverReveal';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { useFinePointer } from '@/components/motion/useFinePointer';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { CtaBand, Section } from '@/components/marketing/sections';
import { Container, Eyebrow, SectionHeading } from '@/components/ui/layout';
import { Photo } from '@/components/ui/Photo';
import { Reveal } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import {
  findResource,
  RESOURCE_CATEGORIES,
  RESOURCES,
  type Resource,
  type ResourceCategory,
} from '@/content/resources';
import { cn } from '@/lib/cn';

const FEATURED_SLUG = 'lookalike-domains-explained';
const POPULAR = ['homoglyphs', 'RDAP', 'opposition', 'SHA-256'];
const COVER_SIZE = { width: 1600, height: 1067 } as const;

/** "Where to start", by the team a reader works in. Each slug is a guide that exists. */
const START_PATHS: { icon: LucideIcon; team: string; slug: string; why: string }[] = [
  {
    icon: ShieldCheck,
    team: 'Security team',
    slug: 'lookalike-domains-explained',
    why: 'Learn the tricks behind fake sign-in sites, so you can spot them early.',
  },
  {
    icon: Scale,
    team: 'Legal team',
    slug: 'trademark-watch-basics',
    why: 'See how trademark journals work and how long you have to object.',
  },
  {
    icon: Megaphone,
    team: 'Brand and marketing',
    slug: 'rogue-mobile-apps',
    why: 'Find out how copycat apps borrow your name, and what to collect.',
  },
];

function matches(resource: Resource, query: string, category: ResourceCategory | 'All') {
  if (category !== 'All' && resource.category !== category) return false;
  if (!query) return true;
  const haystack = [resource.title, resource.summary, ...resource.tags].join(' ').toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/**
 * One guide as a row of an index: a number, the title in large type, a one-line summary and
 * the topic and reading time. With a mouse the cover appears beside the cursor on hover
 * (`HoverReveal`); on touch screens the row carries a small thumbnail instead.
 */
function ResourceRow({ resource, number }: { resource: Resource; number: string }) {
  const fine = useFinePointer();
  return (
    <HoverRevealItem id={resource.slug} src={`${resource.cover.src}-800.webp`}>
      <Reveal y={14}>
        <Link
          to={`/resources/${resource.slug}`}
          data-cursor="Read"
          className="group/row grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-3 border-t border-line-strong/70 py-7 transition-opacity duration-300 sm:py-8 lg:grid-cols-[3rem_minmax(0,1fr)_14rem] lg:gap-x-8 lg:py-10 motion-reduce:transition-none [@media(hover:hover)]:[ul:hover_&]:opacity-45 [@media(hover:hover)]:[ul:hover_&:hover]:opacity-100"
        >
          {fine && (
            <span className="hidden pt-2 font-mono text-[12.5px] text-muted tabular-nums lg:block">
              {number}
            </span>
          )}
          <div className={cn('min-w-0', fine ? 'lg:col-start-2' : 'lg:col-span-2')}>
            <p className="text-[12.5px] font-medium tracking-[0.06em] text-accent-ink uppercase">
              {resource.category} · {resource.type}
            </p>
            <h3 className="mt-2.5 text-[clamp(1.375rem,1rem+1.3vw,2.25rem)] leading-[1.12] font-semibold tracking-[-0.03em] text-balance transition-transform duration-500 ease-out group-hover/row:translate-x-1.5 motion-reduce:transition-none motion-reduce:group-hover/row:translate-x-0">
              {resource.title}
            </h3>
            <p className="mt-3 line-clamp-2 max-w-2xl leading-relaxed text-muted">
              {resource.summary}
            </p>
          </div>
          {!fine && (
            <div className="w-24 overflow-hidden rounded-xl bg-cream-deep ring-1 ring-ink/[0.06] sm:w-36">
              <div className="aspect-[3/2]">
                <Photo
                  {...resource.cover}
                  {...COVER_SIZE}
                  sizes="144px"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="col-span-2 flex items-center gap-4 lg:col-span-1 lg:col-start-3 lg:justify-end lg:pt-2">
            <span className="text-[13px] text-muted">{resource.readMinutes} min read</span>
            <ArrowRight
              aria-hidden
              className="size-5 text-accent-ink transition-transform duration-300 group-hover/row:translate-x-1 motion-reduce:transition-none"
            />
          </div>
        </Link>
      </Reveal>
    </HoverRevealItem>
  );
}

/** The guide to read first, set on a raised dark card inside the hero. */
function FeaturedResource({ resource }: { resource: Resource }) {
  return (
    <Link
      to={`/resources/${resource.slug}`}
      data-cursor="Read"
      className="group block rounded-2xl bg-night-raised p-3 shadow-window-dark ring-1 ring-cream/10 transition-colors hover:ring-cream/25"
    >
      <PhotoFrame
        {...resource.cover}
        {...COVER_SIZE}
        ratio="aspect-[3/2]"
        imageClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        priority
        sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
      />
      <div className="px-3 pt-5 pb-3">
        <p className="text-[12.5px] font-medium tracking-[0.06em] text-accent-soft uppercase">
          Start here · {resource.type}
        </p>
        <h2 className="mt-2.5 text-[1.375rem] leading-snug font-semibold tracking-[-0.02em] text-balance text-cream">
          {resource.title}
        </h2>
        <p className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-cream">
          Read the guide
          <ArrowRight
            aria-hidden
            className="size-4 text-accent-soft transition-transform group-hover:translate-x-1"
          />
          <span className="text-[13px] font-normal text-cream/70">
            · {resource.readMinutes} min read
          </span>
        </p>
      </div>
    </Link>
  );
}

export function ResourcesPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ResourceCategory | 'All'>('All');
  const featured = RESOURCES.find((resource) => resource.slug === FEATURED_SLUG)!;
  const isFiltering = query.trim() !== '' || category !== 'All';

  const results = useMemo(
    () =>
      RESOURCES.filter(
        (resource) =>
          matches(resource, query.trim(), category) &&
          (isFiltering || resource.slug !== FEATURED_SLUG),
      ),
    [query, category, isFiltering],
  );

  return (
    <>
      <section className="relative isolate overflow-hidden bg-night text-cream">
        <SimilarityWave tone="dark" density="calm" className="-z-10 opacity-60" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-r from-night via-night/85 to-night/40"
        />
        <Container className="grid grid-cols-1 gap-12 py-16 sm:py-20 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16 lg:py-28">
          <div>
            <Eyebrow tone="dark">Guides and explainers</Eyebrow>
            <h1 className="text-display mt-5 font-semibold text-balance text-cream">
              Learn how copycats <em className="text-accent-soft">work.</em>
            </h1>
            <p className="text-lead mt-6 max-w-xl text-pretty text-cream/75">
              Clear, practical guides to fake websites, copycat apps, trademark watching and
              evidence, written for legal, security and brand teams.
            </p>

            <div className="mt-10 max-w-xl">
              <label htmlFor="resource-search" className="sr-only">
                Search resources
              </label>
              <div className="relative">
                <Search
                  aria-hidden
                  className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-cream/65"
                />
                <input
                  id="resource-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search guides"
                  className="h-13 w-full rounded-xl border border-cream/20 bg-cream/[0.07] pr-12 pl-12 text-base text-cream outline-none placeholder:text-cream/60 hover:border-cream/35 focus:border-accent-soft focus:ring-4 focus:ring-accent-soft/20"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 text-cream/70 hover:bg-cream/10 hover:text-cream"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                )}
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-cream/70">
                Popular:
                {POPULAR.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="font-medium text-cream underline decoration-cream/35 underline-offset-4 hover:decoration-accent-soft"
                  >
                    {term}
                  </button>
                ))}
              </p>
            </div>
          </div>

          <FeaturedResource resource={featured} />
        </Container>
      </section>

      <Section>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SplitReveal as="h2" className="text-headline font-semibold">
            {isFiltering ? 'Matching guides' : 'All guides'}
          </SplitReveal>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
            {(['All', ...RESOURCE_CATEGORIES] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium transition-colors',
                  category === item
                    ? 'border-ink bg-ink text-cream'
                    : 'border-line-strong bg-white text-ink/80 hover:border-ink/40',
                )}
              >
                {item === 'All' ? 'All topics' : item}
              </button>
            ))}
          </div>
        </div>
        <p aria-live="polite" className="mt-4 text-[13px] text-muted">
          {results.length} {results.length === 1 ? 'guide' : 'guides'}
        </p>

        {results.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-white p-10 text-center">
            <p className="font-semibold">No guides match your search.</p>
            <p className="mt-2 text-muted">Try a different word or clear the filters.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
              className="mt-5 font-medium text-accent-ink hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <HoverReveal>
            <ul className="mt-10 border-b border-line-strong/70">
              {results.map((resource, index) => (
                <ResourceRow
                  key={resource.slug}
                  resource={resource}
                  number={String(index + 1).padStart(2, '0')}
                />
              ))}
            </ul>
          </HoverReveal>
        )}
      </Section>

      <Section tone="white">
        <SectionHeading
          eyebrow="Where to start"
          title="Pick the guide closest to your day job."
          description="Each team meets copycats differently. These three guides open the subject from each side."
        />
        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {START_PATHS.map((path) => {
            const guide = findResource(path.slug);
            if (!guide) return null;
            return (
              <li key={path.slug}>
                <Reveal y={16} className="h-full">
                  <SpotlightCard as="div" className="h-full">
                    <Link
                      to={`/resources/${guide.slug}`}
                      data-cursor="Read"
                      className="group flex h-full flex-col p-6 sm:p-7"
                    >
                      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent/[0.08] text-accent ring-1 ring-accent/15">
                        <path.icon aria-hidden className="size-5" />
                      </span>
                      <p className="mt-6 text-[13px] font-medium text-accent-ink">{path.team}</p>
                      <h3 className="mt-2 text-[1.0625rem] leading-snug font-semibold tracking-[-0.015em]">
                        {guide.title}
                      </h3>
                      <p className="mt-3 flex-1 leading-relaxed text-muted">{path.why}</p>
                      <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium">
                        Read the guide
                        <ArrowRight
                          aria-hidden
                          className="size-4 text-accent-ink transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </Link>
                  </SpotlightCard>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Section>

      <CtaBand
        eyebrow="Put it into practice"
        title={
          <>
            From reading to <em className="text-accent-soft">watching.</em>
          </>
        }
        description="Similo applies these methods to your own brands, with every alert explained in plain words. Tell us what you have found and we will show you how Similo would look at it."
      />
    </>
  );
}
