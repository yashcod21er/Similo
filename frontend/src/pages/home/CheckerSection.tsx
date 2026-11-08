import { Section } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { LookalikeChecker } from './LookalikeChecker';

/** The working brand checker, with the `#check` anchor that the header and hero link to. */
export function CheckerSection() {
  return (
    <Section tone="white" id="check">
      <SectionHeading
        eyebrow="Brand checker"
        title="See how a copycat could imitate your name."
        description="Type your brand name. Similo builds the look-alike names that copycats really use and highlights what changed."
      />
      <Reveal className="mt-10">
        <LookalikeChecker />
      </Reveal>
    </Section>
  );
}
