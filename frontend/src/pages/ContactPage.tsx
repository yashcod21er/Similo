import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { LogoSymbol } from '@/components/ui/Logo';
import { Container } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { CornerBrackets, MonoLabel } from '@/components/ui/specimen';
import { DemoRequestForm } from '@/features/demo-request/DemoRequestForm';
import { PAGE_PHOTOS } from '@/pages/solutions/photos';
import { H1_CLASS, H3_CLASS } from './solutions/page-kit';

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
 * Contact: the page's one burnt-orange band carries the headline, and the form card lifts over
 * its lower edge onto the cream page. On a phone the form comes straight after the headline;
 * on large screens it sits on the right and "what happens next" on the left.
 */
export function ContactPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-accent text-white">
        <LogoSymbol className="pointer-events-none absolute -right-[6%] -bottom-[10%] -z-10 hidden h-[110%] w-auto text-white/[0.09] lg:block" />
        <Container className="pt-14 pb-40 sm:pt-20 lg:pt-28 lg:pb-56">
          <MonoLabel tone="orange">Request a demo</MonoLabel>
          <h1 className={`${H1_CLASS} serif-em-accent mt-6 max-w-2xl text-white`}>
            See Similo on <em>your brand.</em>
          </h1>
          <p className="text-lead mt-7 max-w-lg text-pretty text-white">
            Tell us a little about what you protect. We’ll show you how Similo would watch for
            copycats and explain everything it finds.
          </p>
        </Container>
      </section>

      <section className="bg-cream pb-20 lg:pb-28">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="relative z-10 -mt-28 h-fit rounded-2xl bg-white shadow-window ring-1 ring-ink/[0.07] sm:-mt-32 lg:col-start-2 lg:row-start-1 lg:-mt-48">
            <div className="border-b border-line px-6 py-5 sm:px-8">
              <MonoLabel>Form · about one minute</MonoLabel>
              <h2 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em]">
                Tell us about you
              </h2>
            </div>
            <DemoRequestForm />
          </div>

          <div className="lg:col-start-1 lg:row-start-1 lg:pt-14">
            <MonoLabel>What happens next</MonoLabel>
            <ol className="mt-6 divide-y divide-line-strong border-y border-line-strong">
              {NEXT_STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-4 py-6"
                >
                  <span
                    aria-hidden
                    className="text-[2.25rem] leading-[0.95] font-semibold tracking-[-0.06em] text-accent tabular-nums"
                  >
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className={`${H3_CLASS} text-[1.375rem] tracking-[-0.03em]`}>
                      {step.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-8 max-w-lg border-l-2 border-accent pl-4 text-[14.5px] leading-relaxed text-muted">
              Your details are used only to reply to your request. If our system can’t save the
              form, it will tell you straight away, so nothing is lost silently.
            </p>

            {/* Large screens only: on a phone the form should come straight after the text. */}
            <Reveal className="relative mt-10 hidden lg:block">
              <PhotoFrame
                {...PAGE_PHOTOS.contact}
                ratio="aspect-[3/2]"
                sizes="(min-width: 1280px) 520px, 45vw"
              />
              <CornerBrackets className="-inset-3" />
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
