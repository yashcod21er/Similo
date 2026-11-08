import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { CtaBand, Section } from '@/components/marketing/sections';
import { Container, Eyebrow } from '@/components/ui/layout';
import { findResource, RESOURCES } from '@/content/resources';
import { NotFoundPage } from '@/pages/NotFoundPage';

const COVER_SIZE = { width: 1600, height: 1067 } as const;

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function ResourceArticlePage() {
  const { slug = '' } = useParams();
  const resource = findResource(slug);

  if (!resource) return <NotFoundPage />;

  const related = RESOURCES.filter((item) => item.slug !== resource.slug)
    .sort(
      (a, b) => Number(b.category === resource.category) - Number(a.category === resource.category),
    )
    .slice(0, 3);

  return (
    <>
      <article>
        <header className="bg-white">
          <Container className="grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
            <div>
              <Link
                to="/resources"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
              >
                <ArrowLeft aria-hidden className="size-4" /> All guides
              </Link>
              <Eyebrow className="mt-8">
                {resource.category} · {resource.type}
              </Eyebrow>
              <h1 className="text-headline mt-4 font-semibold text-balance">{resource.title}</h1>
              <p className="text-lead mt-5 text-pretty text-muted">{resource.summary}</p>
              <p className="mt-6 text-sm text-muted">{resource.readMinutes} min read</p>
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

        <div className="border-t border-line bg-white">
          <Container className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)_260px] lg:gap-14">
            <nav aria-label="On this page" className="hidden lg:block">
              <div className="sticky top-28">
                <p className="text-[13px] font-medium text-ink">On this page</p>
                <ul className="mt-4 space-y-2.5 border-l border-line">
                  {resource.sections.map((section) => (
                    <li key={section.heading}>
                      <a
                        href={`#${slugify(section.heading)}`}
                        className="-ml-px block border-l border-transparent pl-4 text-sm text-muted hover:border-accent hover:text-ink"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="max-w-2xl">
              {resource.sections.map((section) => (
                <section
                  key={section.heading}
                  id={slugify(section.heading)}
                  className="scroll-mt-28 not-first:mt-12"
                >
                  <h2 className="text-title font-semibold sm:text-[1.75rem]">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="mt-4 text-[17px] leading-[1.75] text-ink/85"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets && (
                    <ul className="mt-4 space-y-2.5">
                      {section.bullets.map((bullet) => (
                        <li
                          key={bullet.slice(0, 40)}
                          className="flex gap-3 text-[17px] leading-[1.7] text-ink/85"
                        >
                          <span
                            aria-hidden
                            className="mt-3 size-1.5 shrink-0 rounded-full bg-accent"
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
                className="mt-14 flex flex-wrap gap-2 border-t border-line pt-6"
              >
                {resource.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line px-3 py-1 text-[13px] text-ink/80"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>

            <aside>
              <div className="rounded-xl border border-line bg-cream p-6 lg:sticky lg:top-28">
                <p className="font-semibold">See this in Similo</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  We will show you how the platform spots and explains these warning signs.
                </p>
                <ButtonLink to="/contact" size="sm" className="mt-5 w-full">
                  Request a demo
                </ButtonLink>
              </div>
            </aside>
          </Container>
        </div>
      </article>

      <Section>
        <h2 className="text-title font-semibold sm:text-[1.75rem]">Keep reading</h2>
        <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <li key={item.slug}>
              <Link to={`/resources/${item.slug}`} className="group flex h-full flex-col">
                <PhotoFrame
                  {...item.cover}
                  {...COVER_SIZE}
                  ratio="aspect-[3/2]"
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"
                />
                <p className="mt-5 text-[13px] font-medium text-accent-ink">{item.category}</p>
                <p className="mt-2 font-semibold leading-snug group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
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
        title="From reading to watching."
        description="Similo applies these methods to your own brands, with every alert explained in plain words."
      />
    </>
  );
}
