import { ScrollWords } from '@/components/motion/scroll';
import { Container, Eyebrow } from '@/components/ui/layout';

/** A full-width statement that lights up word by word as it scrolls into view. */
export function StatementSection() {
  return (
    <section aria-labelledby="statement-title" className="bg-white py-28 sm:py-36">
      <Container>
        <h2 id="statement-title" className="sr-only">
          Why copycats work
        </h2>
        <Eyebrow>Why it matters</Eyebrow>
        <ScrollWords
          className="text-statement-xl mt-8 max-w-[22ch] font-semibold text-ink"
          text="Copycats don't look fake. They borrow your name, your logo and your look, and by the time anyone notices, your customers have already been fooled."
          highlight={['fake', 'fooled']}
        />
      </Container>
    </section>
  );
}
