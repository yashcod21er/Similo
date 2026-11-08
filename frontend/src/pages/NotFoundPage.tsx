import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/layout';

const USEFUL_LINKS = [
  { label: 'Domain Intelligence', to: '/solutions/domain-intelligence' },
  { label: 'App Intelligence', to: '/solutions/app-intelligence' },
  { label: 'Trademark Intelligence', to: '/solutions/trademark-intelligence' },
  { label: 'Investigation & Evidence', to: '/solutions/investigation-evidence' },
  { label: 'Guides and explainers', to: '/resources' },
  { label: 'Contact us', to: '/contact' },
];

export function NotFoundPage() {
  return (
    <section className="bg-white">
      <Container className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium text-crimson-dark">Error 404</p>
          <h1 className="text-headline mt-5 font-semibold text-balance">
            We can’t find that page.
          </h1>
          <p className="text-lead mt-5 max-w-lg text-pretty text-muted">
            The link may be broken, or the page may have moved. Try one of these instead.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/" size="lg">
              <ArrowLeft aria-hidden className="size-4" /> Back to home
            </ButtonLink>
            <ButtonLink to="/resources" variant="outline" size="lg">
              Browse guides
            </ButtonLink>
          </div>
          <ul className="mt-12 max-w-sm divide-y divide-line border-y border-line">
            {USEFUL_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="block py-3 text-[15px] font-medium text-ink hover:text-crimson-dark"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
