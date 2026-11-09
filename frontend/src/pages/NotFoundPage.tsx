import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/layout';
import { MonoLabel } from '@/components/ui/specimen';

const USEFUL_LINKS = [
  { label: 'Domain Intelligence', to: '/solutions/domain-intelligence' },
  { label: 'App Intelligence', to: '/solutions/app-intelligence' },
  { label: 'Trademark Intelligence', to: '/solutions/trademark-intelligence' },
  { label: 'Investigation & Evidence', to: '/solutions/investigation-evidence' },
  { label: 'Guides and explainers', to: '/resources' },
  { label: 'Contact us', to: '/contact' },
];

/**
 * "404" and a copy of it a little way apart: the same idea as the logo and the whole site,
 * one original and one look-alike (the copy has a letter O where the zero is). Decorative;
 * the heading beside it says what happened.
 */
function CopyOfFourOhFour() {
  const big =
    'text-[clamp(7rem,2.5rem+20vw,15rem)] leading-[0.86] font-semibold tracking-[-0.07em] select-none';
  return (
    <p aria-hidden className="relative inline-block">
      <span
        className={`${big} absolute inset-0 translate-x-[0.05em] translate-y-[0.04em] text-transparent [-webkit-text-stroke:2px_rgb(255_255_255/0.9)]`}
      >
        4O4
      </span>
      <span className={`${big} relative text-white`}>404</span>
    </p>
  );
}

export function NotFoundPage() {
  return (
    <section className="relative isolate overflow-hidden bg-accent text-white">
      <Container className="grid grid-cols-1 items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-32">
        <div>
          <MonoLabel tone="orange">Error 404 · Case not found</MonoLabel>
          <div className="mt-6">
            <CopyOfFourOhFour />
          </div>
          <h1 className="mt-8 text-[clamp(2.125rem,1.1rem+3.6vw,4rem)] leading-[1] font-semibold tracking-[-0.045em] text-balance text-white">
            We can’t find that page.
          </h1>
          <p className="text-lead mt-5 max-w-lg text-pretty text-white">
            The link may be broken, or the page may have moved. Try one of these instead.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/" variant="dark" size="lg" className="focus-visible:outline-white">
              <ArrowLeft aria-hidden className="size-4" /> Back to home
            </ButtonLink>
            <Link
              to="/resources"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/70 px-6 text-base font-medium tracking-[-0.01em] whitespace-nowrap text-white transition-colors duration-200 hover:border-white hover:bg-white/10 focus-visible:outline-white"
            >
              Browse guides
            </Link>
          </div>
        </div>

        <nav aria-label="Pages you may want">
          <ul className="divide-y divide-white/40 border-y border-white/40">
            {USEFUL_LINKS.map((link, index) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 py-4 text-[1.0625rem] font-medium tracking-[-0.01em] text-white focus-visible:outline-white"
                >
                  <MonoLabel tone="orange">0{index + 1}</MonoLabel>
                  <span className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
                    {link.label}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
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
