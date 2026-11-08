import { Section } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { LookalikeChecker } from './LookalikeChecker';

/**
 * The working brand checker: the page's interactive centrepiece, right after the hero, on
 * the cream canvas. Keeps the `#check` anchor that the header and hero link to.
 */
export function CheckerSection() {
  return (
    <Section id="check">
      <SectionHeading
        align="split"
        eyebrow="Try it now"
        title="See how a copycat could imitate your name."
        description="Type your brand name. Similo builds the look-alike names copycats really use and highlights exactly what changed. It works right here, without an account."
      />
      <Reveal className="mt-12 lg:mt-16">
        <LookalikeChecker />
      </Reveal>
    </Section>
  );
}
