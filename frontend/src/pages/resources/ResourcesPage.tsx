import { ArrowRight, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { HoverReveal, HoverRevealItem } from '@/components/motion/HoverReveal';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { useFinePointer } from '@/components/motion/useFinePointer';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { Section } from '@/components/marketing/sections';
import { Container } from '@/components/ui/layout';
import { Photo } from '@/components/ui/Photo';
import { Reveal } from '@/components/ui/Reveal';
import { CornerBrackets, MonoLabel } from '@/components/ui/specimen';
import {
  findResource,
  RESOURCE_CATEGORIES,
  RESOURCES,
  type Resource,
  type ResourceCategory,
} from '@/content/resources';
import { cn } from '@/lib/cn';
import { H1_CLASS, OrangeBand, SectionHead } from '@/pages/solutions/page-kit';

const FEATURED_SLUG = 'lookalike-domains-explained';
const POPULAR = ['homoglyphs', 'RDAP', 'opposition', 'SHA-256'];
const COVER_SIZE = { width: 1600, height: 1067 } as const;

/** "Where to start", by the team a reader works in. Each slug is a guide that exists. */
const START_PATHS: { team: string; slug: string; why: string }[] = [
  {
    team: 'Security team',
    slug: 'lookalike-domains-explained',
    why: 'Learn the tricks behind fake sign-in sites, so you can spot them early.',
  },
  {
    team: 'Legal team',
    slug: 'trademark-watch-basics',
    why: 'See how trademark journals work and how long you have to object.',
  },
  {
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
          className="group/row grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-6 gap-y-3 border-t border-line-strong py-7 transition-opacity duration-300 sm:py-8 lg:grid-cols-[3.5rem_minmax(0,1fr)_14rem] lg:gap-x-8 lg:py-10 motion-reduce:transition-none [@media(hover:hover)]:[ul:hover_&]:opacity-45 [@media(hover:hover)]:[ul:hover_&:hover]:opacity-100"
        >
          {fine && (
            <span className="text-micro hidden pt-2.5 text-muted tabular-nums lg:block">
              {number}
            </span>
          )}
          <div className={cn('min-w-0', fine ? 'lg:col-start-2' : 'lg:col-span-2')}>
            <MonoLabel className="text-accent-ink">
              {resource.category} · {resource.type}
            </MonoLabel>
            <h3 className="mt-3 text-[clamp(1.5rem,1rem+1.6vw,2.5rem)] leading-[1.06] font-semibold tracking-[-0.04em] text-balance transition-transform duration-500 ease-out group-hover/row:translate-x-1.5 motion-reduce:transition-none motion-reduce:group-hover/row:translate-x-0">
              {resource.title}
            </h3>
            <p className="mt-3 line-clamp-2 max-w-2xl leading-relaxed text-muted">
              {resource.summary}
            </p>
          </div>
          {!fine && (
            <div className="w-24 overflow-hidden rounded-xl bg-night ring-1 ring-ink/[0.06] sm:w-36">
              <div className="aspect-[3/2]">
                <Photo
                  {...resource.cover}
                  {...COVER_SIZE}
                  sizes="144px"
                  treatment="duotone"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
          <div className="col-span-2 flex items-center gap-4 lg:col-span-1 lg:col-start-3 lg:justify-end lg:pt-2">
            <MonoLabel>{resource.readMinutes} min read</MonoLabel>
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

/** The guide to read first: its cover in corner brackets, labelled like an exhibit. */
function FeaturedResource({ resource }: { resource: Resource }) {
  return (
    <Link to={`/resources/${resource.slug}`} data-cursor="Read" className="group block">
      <p className="mb-4 flex items-center gap-2">
        <span aria-hidden className="size-1.5 bg-accent" />
        <MonoLabel>Start here · {resource.type}</MonoLabel>
      </p>
      <div className="relative">
        <PhotoFrame
          {...resource.cover}
          {...COVER_SIZE}
          ratio="aspect-[3/2]"
          imageClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          priority
          sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
        />
        <CornerBrackets className="-inset-3" />
      </div>
      <h2 className="mt-6 text-[1.5rem] leading-[1.1] font-semibold tracking-[-0.035em] text-balance">
        {resource.title}
      </h2>
      <p className="mt-4 inline-flex items-center gap-2 text-[15px] font-medium text-accent-ink">
        Read the guide
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
        />
        <MonoLabel className="ml-1">{resource.readMinutes} min read</MonoLabel>
      </p>
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
      <section className="relative isolate overflow-hidden bg-cream">
        <Container className="grid grid-cols-1 gap-14 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:py-28">
          <div>
            <MonoLabel>Guides and explainers</MonoLabel>
            <h1 className={cn(H1_CLASS, 'serif-em-accent mt-6 text-ink')}>
              Learn how copycats <em>work.</em>
            </h1>
            <p className="text-lead mt-7 max-w-md text-pretty text-muted">
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
                  className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted"
                />
                <input
                  id="resource-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search guides"
                  className="h-13 w-full rounded-xl border border-line-strong bg-white pr-12 pl-12 text-base text-ink outline-none placeholder:text-muted hover:border-ink/30 focus:border-accent focus:ring-4 focus:ring-accent/15"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 text-muted hover:bg-ink/5 hover:text-ink"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                )}
              </div>
              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                Popular:
                {POPULAR.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-accent"
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

      <Section scaffold tone="white">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SplitReveal
            as="h2"
            className="text-[clamp(2.125rem,1.1rem+3.6vw,4.5rem)] leading-[1] font-semibold tracking-[-0.045em]"
          >
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
                  'rounded-full border px-3.5 py-1.5 text-[13.5px] font-medium transition-colors duration-150',
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
        <p aria-live="polite" className="mt-4">
          <MonoLabel>
            {results.length} {results.length === 1 ? 'guide' : 'guides'}
          </MonoLabel>
        </p>

        {results.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-line-strong bg-cream p-10 text-center">
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
            <ul className="mt-10 border-b border-line-strong">
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

      <Section scaffold>
        <SectionHead
          label="Where to start"
          title="Pick the guide closest to your day job."
          description="Each team meets copycats differently. These three guides open the subject from each side."
        />
        <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden border border-line-strong bg-line-strong lg:mt-20 lg:grid-cols-3">
          {START_PATHS.map((path, index) => {
            const guide = findResource(path.slug);
            if (!guide) return null;
            return (
              <li key={path.slug} className="bg-cream">
                <Link
                  to={`/resources/${guide.slug}`}
                  data-cursor="Read"
                  className="group flex h-full flex-col p-7 transition-colors duration-200 hover:bg-white lg:p-9"
                >
                  <span
                    aria-hidden
                    className="text-[4rem] leading-[0.85] font-semibold tracking-[-0.06em] text-accent tabular-nums"
                  >
                    0{index + 1}
                  </span>
                  <MonoLabel className="mt-8">{path.team}</MonoLabel>
                  <h3 className="mt-3 text-[1.375rem] leading-[1.12] font-semibold tracking-[-0.03em] text-balance">
                    {guide.title}
                  </h3>
                  <p className="mt-3 flex-1 leading-relaxed text-muted">{path.why}</p>
                  <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink">
                    Read the guide
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <OrangeBand
        label="Put it into practice"
        title="From reading to watching."
        description="Similo applies these methods to your own brands, with every alert explained in plain words. Tell us what you have found and we will show you how Similo would look at it."
        secondary={null}
      />
    </>
  );
}
