import { ArrowRight, Clock, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ResourceCover } from '@/components/marketing/ResourceCover';
import { CtaBand, Section } from '@/components/marketing/sections';
import { ButtonLink } from '@/components/ui/Button';
import { Container, Eyebrow } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { EASE_OUT } from '@/lib/motion';
import {
  RESOURCE_CATEGORIES,
  RESOURCES,
  type Resource,
  type ResourceCategory,
} from '@/content/resources';
import { cn } from '@/lib/cn';

const FEATURED_SLUG = 'lookalike-domains-explained';
const POPULAR = ['homoglyphs', 'RDAP', 'opposition', 'SHA-256'];

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
    <SpotlightCard className="h-full">
      <Link to={`/resources/${resource.slug}`} className="flex h-full flex-col">
        <ResourceCover
          category={resource.category}
          label={resource.type}
          className="h-44 border-b border-line"
        />
        <div className="flex flex-1 flex-col p-6">
          <p className="font-mono text-[11.5px] tracking-[0.06em] text-crimson-dark uppercase">
            {resource.category}
          </p>
          <h3 className="mt-3 text-[1.1875rem] leading-snug font-semibold tracking-[-0.02em]">
            {resource.title}
          </h3>
          <p className="mt-3 line-clamp-3 flex-1 leading-relaxed text-muted">{resource.summary}</p>
          <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden className="size-3.5" /> {resource.readMinutes} min read
            </span>
            <span className="flex items-center gap-1 font-medium text-ink">
              Read
              <ArrowRight
                aria-hidden
                className="size-3.5 transition-transform group-hover/spot:translate-x-0.5"
              />
            </span>
          </div>
        </div>
      </Link>
    </SpotlightCard>
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
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="bg-dots mask-radial absolute inset-0 -z-10 opacity-70" />
        <div
          aria-hidden
          className="absolute -top-56 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-coral/25 blur-[130px]"
        />
        <Container className="pt-16 pb-12 text-center sm:pt-24 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
            className="mx-auto max-w-3xl"
          >
            <Eyebrow>Guides & explainers</Eyebrow>
            <h1 className="text-headline mt-6 font-semibold text-balance lg:text-[4rem]">
              Learn how copycats <em className="text-crimson">work</em>.
            </h1>
            <p className="text-lead mx-auto mt-6 max-w-2xl text-pretty text-muted">
              Clear, practical guides to fake websites, copycat apps, trademark watching and
              evidence — written for legal, security and brand teams.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.1 }}
            className="mx-auto mt-10 max-w-2xl"
          >
            <label htmlFor="resource-search" className="sr-only">
              Search resources
            </label>
            <div className="relative">
              <Search
                aria-hidden
                className="absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted"
              />
              <input
                id="resource-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search guides — try “homoglyphs” or “opposition”"
                className="h-14 w-full rounded-full border border-line-strong bg-white pr-14 pl-13 text-base shadow-soft outline-none placeholder:text-muted/80 focus:border-ink/40 focus:ring-4 focus:ring-crimson/10"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-2 text-muted hover:bg-paper"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[13px]">
              <span className="text-muted">Popular:</span>
              {POPULAR.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="rounded-full bg-white px-3 py-1 font-medium text-ink/80 ring-1 ring-line transition-colors hover:text-crimson hover:ring-crimson/40"
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Floating category switcher, sitting just under the floating header. */}
      <div className="sticky top-[80px] z-30">
        <Container className="flex justify-center">
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-white/85 p-1 shadow-soft ring-1 ring-line backdrop-blur-xl [scrollbar-width:none]">
            {(['All', ...RESOURCE_CATEGORIES] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={cn(
                  'relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  category === item ? 'text-white' : 'text-ink/70 hover:text-ink',
                )}
              >
                {category === item && (
                  <motion.span
                    layoutId="resource-category"
                    className="absolute inset-0 rounded-full bg-midnight"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                  />
                )}
                <span className="relative">{item === 'All' ? 'All guides' : item}</span>
              </button>
            ))}
          </div>
        </Container>
      </div>

      {!isFiltering && (
        <Section className="pb-0 sm:pb-0 lg:pb-0">
          <Reveal>
            <SpotlightCard className="overflow-hidden">
              <Link to={`/resources/${featured.slug}`} className="grid lg:grid-cols-[1fr_1.1fr]">
                <ResourceCover
                  category={featured.category}
                  label={`Featured · ${featured.readMinutes} min read`}
                  className="min-h-64 border-b border-line lg:border-r lg:border-b-0"
                />
                <div className="flex flex-col justify-center p-8 sm:p-12">
                  <p className="font-mono text-[11.5px] tracking-[0.06em] text-crimson-dark uppercase">
                    Start here · {featured.type}
                  </p>
                  <h2 className="text-headline mt-5 font-semibold text-balance lg:text-[2.6rem]">
                    {featured.title}
                  </h2>
                  <p className="text-lead mt-4 text-muted">{featured.summary}</p>
                  <span className="mt-8 inline-flex items-center gap-2 font-medium">
                    Read the guide
                    <ArrowRight
                      aria-hidden
                      className="size-4 text-crimson-dark transition-transform group-hover/spot:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </SpotlightCard>
          </Reveal>
        </Section>
      )}

      <Section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Library</Eyebrow>
            <h2 className="text-title mt-4 font-semibold sm:text-3xl">
              {isFiltering ? 'Matching guides' : 'Guides, explainers & playbooks'}
            </h2>
          </div>
          <p aria-live="polite" className="font-mono text-[13px] text-muted">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-line-strong bg-white p-12 text-center">
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
          <motion.ul layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {results.map((resource) => (
                <motion.li
                  key={resource.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                  <ResourceCard resource={resource} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

        <Reveal className="mt-16">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-white p-8 ring-1 ring-line sm:flex-row sm:items-center sm:p-10">
            <div>
              <h2 className="text-title font-semibold">Worried about a specific website or app?</h2>
              <p className="mt-2 max-w-xl text-muted">
                Tell us what you have found and we will show you how Similo would look at it.
              </p>
            </div>
            <ButtonLink to="/contact" variant="dark" size="lg">
              Talk to the team
            </ButtonLink>
          </div>
        </Reveal>
      </Section>

      <CtaBand
        eyebrow="Put it into practice"
        title={
          <>
            From reading to <em className="text-coral">watching</em>.
          </>
        }
        description="Similo applies these methods to your own brands, with every alert explained in plain words."
      />
    </>
  );
}
