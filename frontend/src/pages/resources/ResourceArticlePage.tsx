import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, useScroll, useSpring } from 'motion/react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useParams } from 'react-router';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { CtaBand, Section } from '@/components/marketing/sections';
import { ButtonLink } from '@/components/ui/Button';
import { Container, Eyebrow } from '@/components/ui/layout';
import { findResource, RESOURCES } from '@/content/resources';
import { cn } from '@/lib/cn';
import { NotFoundPage } from '@/pages/NotFoundPage';

const COVER_SIZE = { width: 1600, height: 1067 } as const;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** A thin orange line at the top of the window that fills as the article is read. */
function ReadingProgress({ target }: { target: RefObject<HTMLElement | null> }) {
  const { scrollYProgress } = useScroll({
    target,
    offset: ['start start', 'end end'],
  });
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[55] h-[3px] origin-left bg-accent"
    />
  );
}

/** The id of the section being read, for the "On this page" list. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('|');
  useEffect(() => {
    if (!key || typeof IntersectionObserver === 'undefined') return;
    const sections = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries.find((entry) => entry.isIntersecting);
        if (first) setActive(first.target.id);
      },
      { rootMargin: '-96px 0px -60% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [key]);
  return active;
}

export function ResourceArticlePage() {
  const { slug = '' } = useParams();
  const resource = findResource(slug);
  const articleRef = useRef<HTMLElement>(null);
  const active = useActiveSection(
    resource ? resource.sections.map((section) => slugify(section.heading)) : [],
  );

  if (!resource) return <NotFoundPage />;

  const related = RESOURCES.filter((item) => item.slug !== resource.slug)
    .sort(
      (a, b) => Number(b.category === resource.category) - Number(a.category === resource.category),
    )
    .slice(0, 3);

  return (
    <>
      <article ref={articleRef}>
        <ReadingProgress target={articleRef} />
        <header className="relative isolate overflow-hidden bg-night text-cream">
          <SimilarityWave tone="dark" density="calm" className="-z-10 opacity-50" />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-r from-night via-night/85 to-night/40"
          />
          <Container className="grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
            <div>
              <Link
                to="/resources"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-cream/75 transition-colors hover:text-cream"
              >
                <ArrowLeft aria-hidden className="size-4" /> All guides
              </Link>
              <Eyebrow tone="dark" className="mt-8">
                {resource.category} · {resource.type}
              </Eyebrow>
              <h1 className="text-headline mt-5 font-semibold text-balance text-cream">
                {resource.title}
              </h1>
              <p className="text-lead mt-5 text-pretty text-cream/75">{resource.summary}</p>
              <p className="mt-6 text-sm text-cream/70">{resource.readMinutes} min read</p>
            </div>
            <div className="min-w-0">
              <PhotoFrame
                {...resource.cover}
                {...COVER_SIZE}
                ratio="aspect-[3/2]"
                priority
                sizes="(min-width: 1280px) 600px, (min-width: 1024px) 45vw, 100vw"
              />
            </div>
          </Container>
        </header>

        <div className="bg-white">
          <Container className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)_280px] lg:gap-14 lg:py-20">
            <nav aria-label="On this page" className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-[13px] font-medium text-ink">On this page</p>
                <ul className="mt-4 space-y-1 border-l border-line">
                  {resource.sections.map((section) => {
                    const id = slugify(section.heading);
                    const current = active === id;
                    return (
                      <li key={section.heading}>
                        <a
                          href={`#${id}`}
                          aria-current={current ? 'location' : undefined}
                          className={cn(
                            '-ml-px block border-l py-1.5 pl-4 text-sm transition-colors',
                            current
                              ? 'border-accent font-medium text-ink'
                              : 'border-transparent text-muted hover:border-line-strong hover:text-ink',
                          )}
                        >
                          {section.heading}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </nav>

            <div className="max-w-2xl">
              {resource.sections.map((section) => (
                <section
                  key={section.heading}
                  id={slugify(section.heading)}
                  className="scroll-mt-28 not-first:mt-14"
                >
                  <h2 className="text-headline font-semibold text-balance">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="mt-5 text-[17px] leading-[1.75] text-ink/85"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-5 space-y-3">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet.slice(0, 40)}
                          className="flex gap-3.5 text-[17px] leading-[1.7] text-ink/85"
                        >
                          <span
                            aria-hidden
                            className="mt-[0.8rem] h-0.5 w-3.5 shrink-0 rounded-full bg-accent"
                          />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
              <ul
                aria-label="Topics"
                className="mt-16 flex flex-wrap gap-2 border-t border-line pt-6"
              >
                {resource.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-cream px-3 py-1 text-[13px] text-ink/80 ring-1 ring-line"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>

            <aside>
              <div className="relative isolate overflow-hidden rounded-2xl bg-night p-6 text-cream shadow-card lg:sticky lg:top-28">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 [mask-image:linear-gradient(to_top,black,transparent)]"
                >
                  <SimilarityWave tone="dark" density="calm" className="opacity-60" />
                </div>
                <p className="text-[1.0625rem] font-semibold tracking-[-0.01em]">
                  See this in Similo
                </p>
                <p className="mt-2 text-sm leading-relaxed text-cream/75">
                  We will show you how the platform spots and explains these warning signs.
                </p>
                <ButtonLink to="/contact" size="sm" className="mt-5 w-full">
                  Request a demo
                </ButtonLink>
                <div className="h-16" aria-hidden />
              </div>
            </aside>
          </Container>
        </div>
      </article>

      <Section>
        <h2 className="text-headline font-semibold">Keep reading</h2>
        <ul className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <li key={item.slug}>
              <Link to={`/resources/${item.slug}`} className="group flex h-full flex-col">
                <PhotoFrame
                  {...item.cover}
                  {...COVER_SIZE}
                  ratio="aspect-[3/2]"
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
                  className="transition-transform duration-300 ease-out group-hover:-translate-y-1 motion-reduce:group-hover:translate-y-0"
                />
                <p className="mt-5 text-[13px] font-medium text-accent-ink">{item.category}</p>
                <p className="mt-2 leading-snug font-semibold group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                  {item.title}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-ink">
                  Read
                  <ArrowRight
                    aria-hidden
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        eyebrow="Put it into practice"
        title={
          <>
            From reading to <em className="text-accent-soft">watching.</em>
          </>
        }
        description="Similo applies these methods to your own brands, with every alert explained in plain words."
      />
    </>
  );
}
