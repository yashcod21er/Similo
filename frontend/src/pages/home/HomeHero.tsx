import { ArrowDown } from 'lucide-react';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { ButtonLink } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { Container, Eyebrow } from '@/components/ui/layout';

/**
 * Home hero: one message, one main action, one secondary action and a real
 * photo. Nothing animates on load, so the headline is readable at once.
 */
export function HomeHero() {
  return (
    <section className="bg-white">
      <Container className="grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div>
          <Eyebrow>Brand protection for websites, apps and trademarks</Eyebrow>
          <h1 className="text-display mt-4 font-semibold text-balance">
            Find the copycats before your customers do.
          </h1>
          <p className="text-lead mt-5 max-w-xl text-pretty text-muted">
            Similo watches for websites, apps and trademark filings that imitate your brand. It
            explains why each one looks risky, so your team can decide what to do.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/contact" size="lg">
              Request a demo
            </ButtonLink>
            <a href="#check" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
              Try the brand checker
              <ArrowDown aria-hidden className="size-4" />
            </a>
          </div>
          <p className="mt-6 max-w-md text-[14px] text-muted">
            Your team reviews every alert. Nothing is sent or taken down without a person’s
            approval.
          </p>
        </div>
        <PhotoFrame
          src="/images/core/team-review"
          alt="Four colleagues around a table, looking through printed pages together"
          width={1600}
          height={1200}
          sizes="(min-width: 1280px) 600px, (min-width: 1024px) 45vw, 100vw"
          priority
        />
      </Container>
    </section>
  );
}
