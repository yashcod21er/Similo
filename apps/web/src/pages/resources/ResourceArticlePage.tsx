import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { motion, useScroll } from 'motion/react';
import { Link, useParams } from 'react-router';
import { ResourceCover } from '@/components/marketing/ResourceCover';
import { CtaBand } from '@/components/marketing/sections';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/layout';
import { EASE_OUT } from '@/lib/motion';
import { findResource, RESOURCES } from '@/content/resources';
import { NotFoundPage } from '@/pages/NotFoundPage';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function ResourceArticlePage() {
  const { slug = '' } = useParams();
  const resource = findResource(slug);
  // Reading progress bar along the top of the article.
  const { scrollYProgress } = useScroll();

  if (!resource) return <NotFoundPage />;

  const related = RESOURCES.filter((item) => item.slug !== resource.slug)
    .sort(
      (a, b) => Number(b.category === resource.category) - Number(a.category === resource.category),
    )
    .slice(0, 2);

  return (
    <>
      <motion.div
        aria-hidden
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-crimson"
      />
      <article>
        <header className="relative isolate overflow-hidden border-b border-line">
          <div aria-hidden className="bg-dots mask-radial absolute inset-0 -z-10 opacity-60" />
          <div
            aria-hidden
            className="absolute -top-48 right-[-10%] -z-10 size-[520px] rounded-full bg-coral/20 blur-[120px]"
          />
          <Container className="py-12 sm:py-20">
            <Link
              to="/resources"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft aria-hidden className="size-4" /> All guides
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
              className="mt-8 max-w-3xl"
            >
              <p className="font-mono text-[12px] tracking-[0.06em] text-crimson-dark uppercase">
                {resource.category} · {resource.type}
              </p>
              <h1 className="text-headline mt-5 font-semibold text-balance">{resource.title}</h1>
              <p className="text-lead mt-5 text-muted">{resource.summary}</p>
              <p className="mt-6 flex items-center gap-1.5 text-sm text-muted">
                <Clock aria-hidden className="size-4" /> {resource.readMinutes} min read
              </p>
            </motion.div>
          </Container>
        </header>

        <Container className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[220px_1fr_260px]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="font-mono text-[11px] tracking-wider text-muted uppercase">
                On this page
              </p>
              <ul className="mt-4 space-y-2.5 border-l border-line">
                {resource.sections.map((section) => (
                  <li key={section.heading}>
                    <a
                      href={`#${slugify(section.heading)}`}
                      className="-ml-px block border-l border-transparent pl-4 text-sm text-muted hover:border-crimson hover:text-ink"
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
                          className="mt-3 size-1.5 shrink-0 rounded-full bg-crimson"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <div className="mt-14 flex flex-wrap gap-2 border-t border-line pt-6">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-3 py-1 font-mono text-xs text-ink/80 ring-1 ring-line"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="relative isolate overflow-hidden rounded-3xl bg-midnight p-6 text-white shadow-stage lg:sticky lg:top-28">
              <div
                aria-hidden
                className="absolute -right-10 -bottom-12 -z-10 size-40 rounded-full bg-crimson/50 blur-3xl"
              />
              <p className="font-semibold">See this in Similo</p>
              <p className="mt-2 text-sm text-white/65">
                We will show you how the platform spots and explains these warning signs.
              </p>
              <ButtonLink to="/contact" size="sm" className="mt-5 w-full">
                Request a demo
              </ButtonLink>
            </div>
          </aside>
        </Container>

        <section className="border-t border-line">
          <Container className="py-16 sm:py-20">
            <h2 className="text-title font-semibold">Keep reading</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/resources/${item.slug}`}
                  className="group flex gap-5 rounded-3xl border border-line bg-white p-4 transition-[box-shadow,border-color] hover:border-ink/15 hover:shadow-lifted"
                >
                  <ResourceCover
                    category={item.category}
                    label={item.type}
                    className="hidden w-32 shrink-0 rounded-2xl ring-1 ring-line sm:block"
                  />
                  <div className="py-1">
                    <p className="font-mono text-[10.5px] tracking-wider text-crimson-dark uppercase">
                      {item.category}
                    </p>
                    <p className="mt-2 font-semibold leading-snug">{item.title}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-crimson-dark">
                      Read{' '}
                      <ArrowRight
                        aria-hidden
                        className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </article>
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
