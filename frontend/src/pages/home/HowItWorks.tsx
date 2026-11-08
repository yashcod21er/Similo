import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { ProcessSteps, Section } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';

const STEPS = [
  {
    title: 'Watch',
    description:
      'Similo looks at newly registered websites, app store listings and trademark journals for names that resemble yours.',
  },
  {
    title: 'Explain',
    description:
      'Anything suspicious gets a risk level and the reasons behind it, written so anyone on your team can follow.',
  },
  {
    title: 'You decide',
    description:
      'Your team reviews the evidence and chooses what happens next. Nothing is sent or taken down without approval.',
  },
];

/** How Similo helps: three plain steps. */
export function HowItWorks() {
  return (
    <Section>
      <SectionHeading
        eyebrow="How Similo helps"
        title="From the first signal to a decision, in three steps."
      />
      <div className="mt-12">
        <ProcessSteps steps={STEPS} />
      </div>
      <Reveal className="mt-10">
        <Link
          to="/platform"
          className="inline-flex items-center gap-1.5 text-[15px] font-medium text-accent-ink hover:underline"
        >
          See how the platform works <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Reveal>
    </Section>
  );
}
