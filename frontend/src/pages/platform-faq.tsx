import { Accordion, type AccordionItem } from '@/components/ui/Accordion';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import type { ReactNode } from 'react';

/**
 * FAQ block shared by the "How it works" pages: heading on the left (sticky on
 * large screens), questions on the right.
 */
export function FaqBlock({
  title,
  description,
  items,
}: {
  title: ReactNode;
  description?: ReactNode;
  items: AccordionItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <SectionHeading eyebrow="Questions" title={title} description={description} />
      </div>
      <Reveal delay={0.05}>
        <Accordion items={items} defaultOpen={null} />
      </Reveal>
    </div>
  );
}
