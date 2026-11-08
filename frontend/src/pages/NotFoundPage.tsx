import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { ButtonLink } from '@/components/ui/Button';
import { Container, Eyebrow } from '@/components/ui/layout';

const USEFUL_LINKS = [
  { label: 'Domain Intelligence', to: '/solutions/domain-intelligence' },
  { label: 'App Intelligence', to: '/solutions/app-intelligence' },
  { label: 'Trademark Intelligence', to: '/solutions/trademark-intelligence' },
  { label: 'Investigation & Evidence', to: '/solutions/investigation-evidence' },
  { label: 'Guides and explainers', to: '/resources' },
  { label: 'Contact us', to: '/contact' },
];

/**
 * A "404" drawn as an original (outline) and a copy (orange) a little way apart: the same
 * idea as the logo and the wave. Decorative; the heading below says what happened.
 */
function CopyOfFourOhFour() {
  return (
    <p
      aria-hidden
      className="relative inline-block text-[clamp(6.5rem,2.5rem+17vw,13rem)] leading-[0.9] font-semibold tracking-[-0.06em] select-none"
    >
      <span className="absolute inset-0 translate-x-[0.06em] translate-y-[0.05em] text-accent">
        404
      </span>
      <span className="relative text-transparent [-webkit-text-stroke:2px_rgb(246_240_230/0.92)]">
        404
      </span>
    </p>
  );
}

export function NotFoundPage() {
  return (
    <section className="relative isolate overflow-hidden bg-night text-cream">
      <SimilarityWave tone="dark" density="full" className="-z-10 opacity-60" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-r from-night via-night/80 to-night/30"
      />
      <Container className="grid grid-cols-1 items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-32">
        <div>
          <CopyOfFourOhFour />
          <Eyebrow tone="dark" className="mt-8">
            Error 404
          </Eyebrow>
          <h1 className="text-headline mt-4 font-semibold text-balance text-cream">
            We can’t find that page.
          </h1>
          <p className="text-lead mt-5 max-w-lg text-pretty text-cream/75">
            The link may be broken, or the page may have moved. Try one of these instead.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/" size="lg">
              <ArrowLeft aria-hidden className="size-4" /> Back to home
            </ButtonLink>
            <ButtonLink to="/resources" variant="outline-dark" size="lg">
              Browse guides
            </ButtonLink>
          </div>
        </div>

        <nav aria-label="Pages you may want">
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {USEFUL_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="group flex items-center justify-between gap-3 rounded-xl bg-cream/[0.06] px-4 py-3.5 text-[15px] font-medium text-cream ring-1 ring-cream/10 transition-colors hover:bg-cream/10 hover:ring-cream/25"
                >
                  {link.label}
                  <ArrowRight
                    aria-hidden
                    className="size-4 shrink-0 text-accent-soft transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </section>
  );
}
