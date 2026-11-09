import { ArrowRight } from 'lucide-react';
import { SplitReveal } from '@/components/motion/SplitReveal';
import { Accordion, type AccordionItem } from '@/components/ui/Accordion';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Band, PlateLine } from './band';

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

/** FIG. 09: questions a non-expert actually asks, answered plainly (cream band). */
export function HomeFaq() {
  return (
    <Band tone="cream" labelledBy="faq-title" className="py-20 sm:py-24 lg:py-28">
      <PlateLine tone="cream" index="09" title="Questions" note={`${FAQ.length} answers`} />
      <div className="mt-12 grid grid-cols-1 gap-10 lg:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SplitReveal
            as="h2"
            id="faq-title"
            className="text-[clamp(2.25rem,1rem+3.6vw,4.25rem)] leading-[1] font-semibold tracking-[-0.045em] text-balance"
          >
            Questions people ask first.
          </SplitReveal>
          <Reveal delay={0.2}>
            <ButtonLink to="/contact" variant="outline" className="mt-8">
              Ask the team <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </Reveal>
        </div>
        <Reveal>
          <Accordion items={FAQ} />
        </Reveal>
      </div>
    </Band>
  );
}
