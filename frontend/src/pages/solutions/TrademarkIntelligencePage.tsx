import { AudioLines, BookOpenText, Layers3, Shapes } from 'lucide-react';
import { CtaBand, FeatureCard, Section, SplitHero } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import {
  OppositionWindows,
  TmComparePanel,
  TmDecidePanel,
  TmReadPanel,
  TmRecordPanel,
  TrademarkScene,
} from '@/components/visuals/trademark';
import { CardGrid, FaqBlock, SplitSection, StoryBand, type StoryItem } from './page-kit';

const RISKS = [
  'Miss the window, and a confusingly similar mark can be registered.',
  'Objecting later is usually slower, harder and more expensive.',
  'Reading every journal by hand takes hours each week.',
];

const STORY_ITEMS: StoryItem[] = [
  {
    label: 'Read',
    title: 'Every new journal, read for you.',
    description:
      'Each new issue of an official trademark journal is read automatically, scanned pages included, and every entry keeps its page number.',
    detail: 'Under the hood: OCR with layout parsing',
    visual: <TmReadPanel />,
  },
  {
    label: 'Extract',
    title: 'Each entry becomes a tidy record.',
    description:
      'The mark, the applicant, the kinds of products and the key dates are turned into a tidy record that can be compared.',
    detail: 'Under the hood: field extraction and normalisation',
    visual: <TmRecordPanel />,
  },
  {
    label: 'Compare',
    title: 'Sound, spelling and product class, one by one.',
    description:
      'New marks are checked against yours for spelling, sound, products and logo. Close ones are ranked by how little time is left.',
    detail: 'Under the hood: edit distance, phonetic keys, Nice classes',
    visual: <TmComparePanel />,
  },
  {
    label: 'You decide',
    title: 'A professional reviews it before the deadline.',
    description:
      'A professional reviews each match before the deadline. AI can draft opposition notes for them to edit. Nothing is filed for you.',
    detail: 'Under the hood: human approval required',
    visual: <TmDecidePanel />,
  },
];

const SIGNALS = [
  {
    icon: AudioLines,
    title: 'Looks or sounds alike',
    text: 'Names that are spelled differently but read or sound the same as yours.',
    under: 'phonetic keys (Double Metaphone) and edit distance, kept separate',
  },
  {
    icon: Layers3,
    title: 'Same kind of products',
    text: 'Marks are registered for kinds of goods and services, grouped into 45 classes. A similar name matters most when the products overlap.',
    under: 'Nice Classification',
  },
  {
    icon: Shapes,
    title: 'Similar logo',
    text: 'Logos in new applications compared with your registered logo marks.',
    under: 'perceptual hashing, image embeddings',
  },
  {
    icon: BookOpenText,
    title: 'Read from the source',
    text: 'Every match links back to the exact journal page it came from, so anyone can check it.',
    under: 'OCR with a confidence value per page',
  },
];

const FAQ = [
  {
    question: 'What is a trademark opposition?',
    answer:
      'When an office publishes a new trademark application, there is a fixed period in which anyone who thinks it conflicts with their own mark can formally object. That objection is an opposition. If nobody objects in time, the mark usually goes on to registration.',
  },
  {
    question: 'How long do I have to object?',
    answer:
      'It depends on the office. In India it is four months from publication in the Trade Marks Journal. At the EUIPO it is three months. At the USPTO it is 30 days, and you can ask for an extension. Similo tracks the date for you, but always confirm the exact deadline with your trademark attorney.',
  },
  {
    question: 'Which trademark offices do you watch?',
    answer:
      'Sources are added one office at a time, starting with official journals such as the Indian Trade Marks Journal, and only where their terms allow automated processing. Your workspace always lists exactly which sources are active.',
  },
  {
    question: 'Does Similo file the opposition for me?',
    answer:
      'No. It finds and ranks marks that may conflict with yours and can draft notes for your legal team. Deciding whether to oppose, and filing, stays with qualified professionals.',
  },
  {
    question: 'Is a match proof that someone copied my mark?',
    answer:
      'No. A match is a reason to look closer. Only a trademark office or court decides whether two marks actually conflict.',
  },
  {
    question: 'What if a scanned page is hard to read?',
    answer:
      'Every record keeps a confidence value and a link to the original page. Anything read with low confidence is flagged for a person to check.',
  },
];

export function TrademarkIntelligencePage() {
  return (
    <>
      <SplitHero
        eyebrow="Trademark Intelligence"
        title={
          <>
            Catch lookalike trademarks <em className="text-accent-soft">in time to object.</em>
          </>
        }
        description="Every week, trademark offices publish new applications. If one is too close to yours, you only have a short window to object. Similo reads those journals for you and flags the ones worth a closer look."
        secondaryCta={{ label: 'Read the watch guide', to: '/resources/trademark-watch-basics' }}
        visual={<TrademarkScene />}
      />

      <Section>
        <SplitSection
          text={
            <>
              <SectionHeading
                eyebrow="The problem"
                title="A lookalike mark can slip through quietly."
                description="Trademark offices publish every new application so that anyone who thinks it is too close to their own mark can object. The catch: the window is short, the journals are long, and many pages are scanned images."
              />
              <ul className="mt-8 space-y-3">
                {RISKS.map((risk) => (
                  <li key={risk} className="flex gap-3 leading-relaxed text-ink/85">
                    <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    {risk}
                  </li>
                ))}
              </ul>
            </>
          }
          media={<OppositionWindows />}
        />
      </Section>

      <StoryBand
        eyebrow="How it works"
        title={
          <>
            From new filing to your decision, <em>in four steps.</em>
          </>
        }
        description="Similo does the slow first pass, so your team spends its time on judgement instead of reading."
        items={STORY_ITEMS}
      />

      <Section tone="white">
        <SectionHeading
          eyebrow="What we compare"
          title="Four ways a mark can be too close."
          description="Conflicts rarely come from exact copies. Similo checks four things separately and shows you each one, so you can see exactly why a mark was flagged."
        />
        <CardGrid columns={4} className="mt-12">
          {SIGNALS.map((signal) => (
            <FeatureCard
              key={signal.title}
              icon={<signal.icon aria-hidden className="size-5" />}
              title={signal.title}
              description={signal.text}
            >
              <p className="text-[13px] text-muted">Under the hood: {signal.under}</p>
            </FeatureCard>
          ))}
        </CardGrid>
      </Section>

      <FaqBlock
        tone="light"
        title="Trademark watch, answered."
        description="New to oppositions? Start here."
        items={FAQ}
        link={{ label: 'Read the trademark watch guide', to: '/resources/trademark-watch-basics' }}
      />

      <CtaBand
        eyebrow="Trademark watch"
        title={
          <>
            Never miss a <em>deadline</em> to object.
          </>
        }
        description="Tell us the marks and countries you care about, and we will show you how a watch would work for them."
        primary={{ label: 'Book a trademark briefing', to: '/contact' }}
        secondary={{ label: 'Read the watch guide', to: '/resources/trademark-watch-basics' }}
      />
    </>
  );
}
