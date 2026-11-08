import { ArrowDown, ArrowRight, Globe, Smartphone, Stamp } from 'lucide-react';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { ButtonLink } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/button-styles';
import { Container, Eyebrow } from '@/components/ui/layout';
import { HeroScene } from './HeroScene';

const SOURCES = [
  { icon: Globe, label: 'Newly registered websites' },
  { icon: Smartphone, label: 'App store listings' },
  { icon: Stamp, label: 'Trademark journals' },
];

/**
 * Home hero (v4): night band, the SimilarityWave signature behind everything and the
 * product as the star — an animated alert scene in an app window. One main action
 * (Request a demo) and one secondary (Check your brand → #check). No stock photo.
 */
export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-night text-cream">
      <SimilarityWave tone="dark" density="full" className="-z-10" />
      {/* Keep the copy side calm: the ribbons fade out behind the headline. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-b from-night via-night/75 to-night/30 lg:bg-linear-to-r lg:from-night lg:via-night/80 lg:to-night/10"
      />
      <Container className="grid grid-cols-1 items-center gap-14 pt-14 pb-20 sm:pt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:pt-24 lg:pb-28">
        <div>
          <Eyebrow tone="dark">Brand protection for websites, apps and trademarks</Eyebrow>
          <h1 className="text-display mt-6 font-semibold text-balance text-cream">
            Find the copycats <em className="text-accent-soft">before your customers do.</em>
          </h1>
          <p className="text-lead mt-6 max-w-xl text-pretty text-cream/75">
            Similo watches for look-alike websites, apps and trademark filings. It shows exactly why
            each one looks like you, and a person on your team decides what happens next.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/contact" size="lg">
              Request a demo
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
            <a href="#check" className={buttonClasses({ variant: 'outline-dark', size: 'lg' })}>
              Check your brand
              <ArrowDown aria-hidden className="size-4" />
            </a>
          </div>
          <p className="mt-6 max-w-md text-[14px] leading-relaxed text-cream/65">
            Nothing is sent or taken down without a person’s approval.
          </p>
        </div>

        <div className="min-w-0 lg:pl-4">
          <HeroScene />
        </div>
      </Container>

      <div className="border-t border-cream/10">
        <Container className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:gap-10">
          <p className="text-[13px] font-medium text-cream/65">Similo watches</p>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {SOURCES.map((source) => (
              <li key={source.label} className="flex items-center gap-2 text-[14px] text-cream/85">
                <source.icon aria-hidden className="size-4 text-accent-soft" />
                {source.label}
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </section>
  );
}
