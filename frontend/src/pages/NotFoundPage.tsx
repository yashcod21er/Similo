import { ArrowLeft } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Container, Eyebrow } from '@/components/ui/layout';

export function NotFoundPage() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-dots mask-radial absolute inset-0 -z-10 opacity-70" />
      <div
        aria-hidden
        className="absolute -top-56 left-1/2 -z-10 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-coral/25 blur-[130px]"
      />
      <Container className="flex flex-col items-center py-28 text-center sm:py-36">
        <Eyebrow>Error 404</Eyebrow>
        <h1 className="text-headline mt-6 font-semibold text-balance">
          Close — but not the <em className="text-crimson">real</em> page.
        </h1>
        <p className="text-lead mt-5 max-w-md text-muted">
          This link is broken or the page has moved. A bit like a lookalike website: it looks right,
          but it is not what you were after.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/" size="lg">
            <ArrowLeft aria-hidden className="size-4" /> Back to home
          </ButtonLink>
          <ButtonLink to="/resources" variant="outline" size="lg">
            Browse guides
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
