import { Clock, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { Container, Eyebrow } from '@/components/ui/layout';
import { DemoRequestForm } from '@/features/demo-request/DemoRequestForm';
import { EASE_OUT } from '@/lib/motion';

const NEXT_STEPS = [
  {
    title: 'Tell us what you protect',
    text: 'Your brand names, main websites, apps or trademarks — whatever matters most to you.',
  },
  {
    title: 'A walkthrough built around you',
    text: 'We show how alerts, explanations and investigations would look for examples like yours.',
  },
  {
    title: 'Clear next steps',
    text: 'Which sources would apply to you, what they cover — and what they don’t.',
  },
];

export function ContactPage() {
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-dots mask-radial absolute inset-0 -z-10 opacity-70" />
      <div
        aria-hidden
        className="absolute top-24 -left-48 -z-10 size-[560px] rounded-full bg-coral/25 blur-[130px]"
      />
      <Container className="grid gap-14 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1fr_1.15fr] lg:gap-20 lg:pt-24 lg:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        >
          <Eyebrow>Request a demo</Eyebrow>
          <h1 className="text-headline mt-6 font-semibold text-balance">
            See Similo on <em>your</em> brand.
          </h1>
          <p className="text-lead mt-6 max-w-lg text-pretty text-muted">
            Tell us a little about what you protect. We’ll show you how Similo would watch for
            copycats and explain everything it finds.
          </p>

          <h2 className="mt-12 font-mono text-[12px] font-medium tracking-[0.08em] text-muted uppercase">
            What happens next
          </h2>
          <ol className="mt-5">
            {NEXT_STEPS.map((step, index) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.2 + index * 0.1 }}
                className="relative flex gap-5 pb-8 last:pb-0"
              >
                {/* Vertical line joining the steps */}
                {index < NEXT_STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute top-9 bottom-1 left-[17px] w-px bg-line-strong"
                  />
                )}
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white font-mono text-[13px] font-medium text-crimson-dark shadow-soft ring-1 ring-line">
                  {index + 1}
                </span>
                <div className="pt-1.5">
                  <h3 className="font-semibold tracking-[-0.01em]">{step.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{step.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>

          <div className="mt-12 flex gap-3.5 rounded-2xl bg-white/80 p-5 shadow-soft ring-1 ring-line">
            <Lock aria-hidden className="mt-0.5 size-5 shrink-0 text-crimson-dark" />
            <p className="text-[14.5px] leading-relaxed text-muted">
              Your details are used only to reply to your request. If our system can’t save it, the
              form will tell you straight away — nothing is lost silently.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 }}
          className="relative h-fit rounded-[28px] bg-white shadow-stage ring-1 ring-line"
        >
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5 sm:px-8">
            <p className="text-title font-semibold">Tell us about you</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[12.5px] text-muted ring-1 ring-line">
              <Clock aria-hidden className="size-3.5" />
              About a minute
            </span>
          </div>
          <DemoRequestForm />
        </motion.div>
      </Container>
    </section>
  );
}
