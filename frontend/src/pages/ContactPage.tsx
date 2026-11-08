import { Lock } from 'lucide-react';
import { SimilarityWave } from '@/components/motion/SimilarityWave';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { Container, Eyebrow } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { DemoRequestForm } from '@/features/demo-request/DemoRequestForm';
import { PAGE_PHOTOS } from '@/pages/solutions/photos';

const NEXT_STEPS = [
  {
    title: 'You send the form',
    text: 'Tell us what you protect: your brand names, main websites, apps or trademarks, whatever matters most to you.',
  },
  {
    title: 'We reply by email',
    text: 'We read every request and write back to arrange a time. We do not promise a fixed response time.',
  },
  {
    title: 'A walkthrough built around you',
    text: 'We show how alerts, explanations and investigations would look for examples like yours, which sources would apply and what they don’t cover.',
  },
];

/**
 * Contact: a dark band with the headline, and the form card lifted over its lower edge onto
 * the cream page. On a phone the form comes straight after the headline; on large screens it
 * sits on the right and "what happens next" on the left.
 */
export function ContactPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-night text-cream">
        <SimilarityWave tone="dark" density="calm" className="-z-10 opacity-60" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-linear-to-r from-night via-night/75 to-night/10"
        />
        <Container className="pt-14 pb-40 sm:pt-20 lg:pt-28 lg:pb-56">
          <Eyebrow tone="dark">Request a demo</Eyebrow>
          <h1 className="text-display mt-5 max-w-xl font-semibold text-balance text-cream">
            See Similo on <em className="text-accent-soft">your brand.</em>
          </h1>
          <p className="text-lead mt-6 max-w-lg text-pretty text-cream/75">
            Tell us a little about what you protect. We’ll show you how Similo would watch for
            copycats and explain everything it finds.
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-20 lg:pb-28">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="relative z-10 -mt-28 h-fit rounded-2xl bg-white shadow-window ring-1 ring-ink/[0.07] sm:-mt-32 lg:col-start-2 lg:row-start-1 lg:-mt-48">
            <div className="border-b border-line px-6 py-5 sm:px-8">
              <h2 className="text-title font-semibold">Tell us about you</h2>
              <p className="mt-1 text-sm text-muted">It takes about a minute.</p>
            </div>
            <DemoRequestForm />
          </div>

          <div className="lg:col-start-1 lg:row-start-1 lg:pt-14">
            <h2 className="text-headline font-semibold text-balance">What happens next</h2>
            <ol className="mt-8">
              {NEXT_STEPS.map((step, index) => (
                <li key={step.title} className="relative flex gap-5 pb-8 last:pb-0">
                  {index < NEXT_STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute top-9 bottom-1 left-[15px] w-px bg-line-strong"
                    />
                  )}
                  <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-night text-[13px] font-medium text-cream">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="pt-1 font-semibold tracking-[-0.01em]">{step.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex gap-3.5 rounded-2xl bg-white p-5 shadow-card ring-1 ring-line">
              <Lock aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
              <p className="text-[14.5px] leading-relaxed text-muted">
                Your details are used only to reply to your request. If our system can’t save the
                form, it will tell you straight away, so nothing is lost silently.
              </p>
            </div>

            {/* Large screens only: on a phone the form should come straight after the text. */}
            <Reveal className="mt-10 hidden lg:block">
              <PhotoFrame
                {...PAGE_PHOTOS.contact}
                ratio="aspect-[3/2]"
                sizes="(min-width: 1280px) 520px, 45vw"
              />
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
