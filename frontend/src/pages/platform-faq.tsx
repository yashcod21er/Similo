import { Accordion, type AccordionItem } from '@/components/ui/Accordion';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import type { ReactNode } from 'react';

/**
 * FAQ block shared by the "How it works" pages: heading on the left (sticky on
 * large screens), questions on the right.
 */
export function FaqBlock({
  index,
  title,
  description,
  items,
}: {
  index: string;
  title: ReactNode;
  description?: ReactNode;
  items: AccordionItem[];
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <SectionHeading index={index} eyebrow="Questions" title={title} description={description} />
      </div>
      <Reveal delay={0.1}>
        <Accordion items={items} defaultOpen={null} />
      </Reveal>
    </div>
  );
}
