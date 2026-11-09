import { Section } from '@/components/marketing/sections';
import { Reveal } from '@/components/ui/Reveal';
import { JournalLoupeExhibit, OppositionNumbers } from '@/components/visuals/exhibits';
import { TrademarkScene } from '@/components/visuals/trademark';
import {
  FaqBlock,
  OrangeBand,
  PageHero,
  SectionHead,
  SpecimenGrid,
  StepsWithScene,
  type SpecimenData,
  type Step,
} from './page-kit';

const RISKS = [
  'Miss the window, and a confusingly similar mark can be registered.',
  'Objecting later is usually slower, harder and more expensive.',
  'Reading every journal by hand takes hours each week.',
];

const STEPS: Step[] = [
  {
    title: 'Read every new journal, scanned pages included.',
    text: 'Each new issue of an official trademark journal is read automatically, and every entry keeps its page number.',
    hood: 'OCR with layout parsing.',
  },
  {
    title: 'Turn each entry into a tidy record.',
    text: 'The mark, the applicant, the kinds of products and the key dates become a record that can be compared.',
    hood: 'Field extraction and normalisation.',
  },
  {
    title: 'Compare sound, spelling and product class, one by one.',
    text: 'New marks are checked against yours for spelling, sound, products and logo. Close ones are ranked by how little time is left.',
    hood: 'Edit distance, phonetic keys, Nice classes.',
  },
  {
    title: 'A professional reviews it before the deadline.',
    text: 'AI can draft opposition notes for them to edit. Nothing is filed for you.',
    hood: 'Human approval required.',
  },
];

const SIGNALS: SpecimenData[] = [
  {
    title: 'Looks or sounds alike',
    text: 'Names that are spelled differently but read or sound the same as yours.',
    hood: 'Phonetic keys (Double Metaphone) and edit distance, kept separate.',
  },
  {
    title: 'Same kind of products',
    text: 'Marks are registered for kinds of goods and services, grouped into 45 classes. A similar name matters most when the products overlap.',
    hood: 'Nice Classification.',
  },
  {
    title: 'Similar logo',
    text: 'Logos in new applications compared with your registered logo marks.',
    hood: 'Perceptual hashing, image embeddings.',
  },
  {
    title: 'Read from the source',
    text: 'Every match links back to the exact journal page it came from, so anyone can check it.',
    hood: 'OCR with a confidence value per page.',
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
      <PageHero
        tone="dark"
        label="Case 03 · Trademarks"
        title={
          <>
            Catch lookalike trademarks <em>in time to object.</em>
          </>
        }
        description="Trademark offices publish new applications every week. If one is too close to yours, the window to object is short. Similo reads the journals for you."
        secondary={{ label: 'Read the watch guide', to: '/resources/trademark-watch-basics' }}
        visual={<OppositionNumbers tone="dark" />}
      />

      <Section scaffold>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <SectionHead
              label="The problem"
              title="A lookalike mark can slip through quietly."
              description="The window is short, the journals are long, and many pages are scanned images."
            />
            <Reveal delay={0.1}>
              <ul className="mt-10 divide-y divide-line-strong border-y border-line-strong">
                {RISKS.map((risk, index) => (
                  <li key={risk} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-4">
                    <span className="text-micro pt-1 text-muted">0{index + 1}</span>
                    <span className="leading-relaxed text-ink/85">{risk}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal className="min-w-0">
            <JournalLoupeExhibit index="02" />
          </Reveal>
        </div>
      </Section>

      <Section scaffold tone="dark">
        <SectionHead
          tone="dark"
          label="How it works"
          title="From new filing to your decision, in four steps."
          description="Similo does the slow first pass, so your team spends its time on judgement instead of reading."
        />
        <div className="mt-14 lg:mt-20">
          <StepsWithScene
            tone="dark"
            steps={STEPS}
            scene={<TrademarkScene tone="dark" index="03" />}
          />
        </div>
      </Section>

      <Section scaffold tone="white">
        <SectionHead
          label="What we compare"
          title="Four ways a mark can be too close."
          description="Conflicts rarely come from exact copies. Similo checks four things separately and shows you each one."
        />
        <div className="mt-14 lg:mt-20">
          <SpecimenGrid items={SIGNALS} columns={4} />
        </div>
      </Section>

      <FaqBlock
        tone="light"
        title="Trademark watch, answered."
        description="New to oppositions? Start here."
        items={FAQ}
        link={{ label: 'Read the trademark watch guide', to: '/resources/trademark-watch-basics' }}
      />

      <OrangeBand
        label="Trademark watch"
        title="Never miss a deadline to object."
        description="Tell us the marks and countries you care about, and we will show you how a watch would work for them."
        primary={{ label: 'Book a trademark briefing', to: '/contact' }}
        secondary={{ label: 'Read the watch guide', to: '/resources/trademark-watch-basics' }}
      />
    </>
  );
}
