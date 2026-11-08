import { ArrowRight, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { CtaBand, Section } from '@/components/marketing/sections';
import { Container, Eyebrow } from '@/components/ui/layout';
import {
  RESOURCE_CATEGORIES,
  RESOURCES,
  type Resource,
  type ResourceCategory,
} from '@/content/resources';
import { cn } from '@/lib/cn';

const FEATURED_SLUG = 'lookalike-domains-explained';
const POPULAR = ['homoglyphs', 'RDAP', 'opposition', 'SHA-256'];
const COVER_SIZE = { width: 1600, height: 1067 } as const;

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

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link to={`/resources/${resource.slug}`} className="group flex h-full flex-col">
      <PhotoFrame
        {...resource.cover}
        {...COVER_SIZE}
        ratio="aspect-[3/2]"
        sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
      />
      <p className="mt-5 text-[13px] font-medium text-crimson-dark">
        {resource.category} · {resource.type}
      </p>
      <h3 className="mt-2 text-[1.1875rem] leading-snug font-semibold tracking-[-0.02em] group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
        {resource.title}
      </h3>
      <p className="mt-3 line-clamp-3 flex-1 leading-relaxed text-muted">{resource.summary}</p>
      <p className="mt-4 text-[13px] text-muted">{resource.readMinutes} min read</p>
    </Link>
  );
}

function FeaturedResource({ resource }: { resource: Resource }) {
  return (
    <Link
      to={`/resources/${resource.slug}`}
      className="group grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14"
    >
      <PhotoFrame
        {...resource.cover}
        {...COVER_SIZE}
        ratio="aspect-[3/2]"
        sizes="(min-width: 1280px) 600px, (min-width: 1024px) 45vw, 100vw"
      />
      <div>
        <Eyebrow>Start here · {resource.type}</Eyebrow>
        <h2 className="text-headline mt-4 font-semibold text-balance lg:text-[2.5rem]">
          {resource.title}
        </h2>
        <p className="text-lead mt-4 text-pretty text-muted">{resource.summary}</p>
        <p className="mt-6 inline-flex items-center gap-2 font-medium">
          Read the guide
          <ArrowRight
            aria-hidden
            className="size-4 text-crimson-dark transition-transform group-hover:translate-x-1"
          />
          <span className="text-[13px] font-normal text-muted">
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
      <section className="bg-white">
        <Container className="py-14 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <Eyebrow>Guides and explainers</Eyebrow>
            <h1 className="text-display mt-4 font-semibold text-balance">
              Learn how copycats work.
            </h1>
            <p className="text-lead mt-6 max-w-2xl text-pretty text-muted">
              Clear, practical guides to fake websites, copycat apps, trademark watching and
              evidence, written for legal, security and brand teams.
            </p>
          </div>

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
                className="h-12 w-full rounded-lg border border-line-strong bg-white pr-12 pl-12 text-base outline-none placeholder:text-muted/80 hover:border-ink/30 focus:border-crimson focus:ring-2 focus:ring-crimson/20"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2 text-muted hover:bg-paper"
                >
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
              Popular:
              {POPULAR.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-crimson"
                >
                  {term}
                </button>
              ))}
            </p>
          </div>
        </Container>
      </section>

      {!isFiltering && (
        <Section>
          <FeaturedResource resource={featured} />
        </Section>
      )}

      <Section tone={isFiltering ? 'light' : 'white'}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-title font-semibold sm:text-[1.75rem]">
            {isFiltering ? 'Matching guides' : 'All guides'}
          </h2>
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
                    ? 'border-ink bg-ink text-white'
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
          <div className="mt-8 rounded-xl border border-dashed border-line-strong bg-white p-10 text-center">
            <p className="font-semibold">No guides match your search.</p>
            <p className="mt-2 text-muted">Try a different word or clear the filters.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
              className="mt-5 font-medium text-crimson-dark hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((resource) => (
              <li key={resource.slug}>
                <ResourceCard resource={resource} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CtaBand
        eyebrow="Put it into practice"
        title="From reading to watching."
        description="Similo applies these methods to your own brands, with every alert explained in plain words. Tell us what you have found and we will show you how Similo would look at it."
      />
    </>
  );
}
