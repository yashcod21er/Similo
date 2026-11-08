import { ArrowRight } from 'lucide-react';
import { Section } from '@/components/marketing/sections';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';
import { ButtonLink } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';

const FAQ: AccordionItem[] = [
  {
    question: 'Does Similo take action by itself?',
    answer:
      'No. It finds and explains possible copycats. A person on your team reviews each alert and decides what happens. Takedown requests and legal letters are drafted for you to edit, and they are never sent automatically.',
  },
  {
    question: 'Is the risk score a legal decision?',
    answer:
      'No. The score shows how closely something matches your brand and why. It helps your team decide what to look at first, but it is not a legal finding of infringement. Your lawyers make that call.',
  },
  {
    question: 'What do I need to get started?',
    answer:
      'Your brand names, your logos and the trademarks you own. Similo uses them to know what to look for. You then invite your team and choose who can see and approve what.',
  },
  {
    question: 'Where does Similo look?',
    answer:
      'Newly registered website addresses, app store listings and official trademark journals. Each source has its own rules and limits, and we only use sources we are allowed to access.',
  },
  {
    question: 'Is the brand checker on this page real?',
    answer:
      'It runs real calculations in your browser, building the kinds of imitations copycats use. It does not check whether those names are actually registered. The full platform does that. Nothing you type is sent to us.',
  },
  {
    question: 'Can I see it working with my own brand?',
    answer:
      'Yes. Request a demo and we will walk you through monitoring, alerts and an investigation, from the first signal to a reviewed takedown draft.',
  },
];

/** Questions a non-expert actually asks, answered plainly. */
export function HomeFaq() {
  return (
    <Section>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="text-headline mt-3 font-semibold text-balance">
            Questions people ask first.
          </h2>
          <p className="text-lead mt-4 text-muted">Something else on your mind? Talk to us.</p>
          <ButtonLink to="/contact" variant="outline" className="mt-7">
            Ask the team <ArrowRight aria-hidden className="size-4" />
          </ButtonLink>
        </Reveal>
        <Reveal>
          <Accordion items={FAQ} />
        </Reveal>
      </div>
    </Section>
  );
}
