import { Lock } from 'lucide-react';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { Container, Eyebrow } from '@/components/ui/layout';
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

export function ContactPage() {
  return (
    <section className="bg-paper">
      <Container className="grid grid-cols-1 gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:py-24">
        <div>
          <Eyebrow>Request a demo</Eyebrow>
          <h1 className="text-display mt-4 font-semibold text-balance">
            See Similo on your brand.
          </h1>
          <p className="text-lead mt-5 max-w-lg text-pretty text-muted">
            Tell us a little about what you protect. We’ll show you how Similo would watch for
            copycats and explain everything it finds.
          </p>

          <h2 className="mt-12 text-[1.0625rem] font-semibold tracking-[-0.015em]">
            What happens next
          </h2>
          <ol className="mt-5 space-y-5">
            {NEXT_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-medium text-crimson-dark ring-1 ring-line-strong">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold tracking-[-0.01em]">{step.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex gap-3.5 rounded-xl border border-line bg-white p-5">
            <Lock aria-hidden className="mt-0.5 size-5 shrink-0 text-crimson" />
            <p className="text-[14.5px] leading-relaxed text-muted">
              Your details are used only to reply to your request. If our system can’t save the
              form, it will tell you straight away, so nothing is lost silently.
            </p>
          </div>

          {/* Large screens only: on a phone the form should come straight after the text. */}
          <PhotoFrame
            {...PAGE_PHOTOS.contact}
            ratio="aspect-[3/2]"
            sizes="(min-width: 1280px) 520px, 45vw"
            className="mt-10 hidden lg:block"
          />
        </div>

        <div className="h-fit rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-5 sm:px-8">
            <h2 className="text-title font-semibold">Tell us about you</h2>
            <p className="mt-1 text-sm text-muted">It takes about a minute.</p>
          </div>
          <DemoRequestForm />
        </div>
      </Container>
    </section>
  );
}
