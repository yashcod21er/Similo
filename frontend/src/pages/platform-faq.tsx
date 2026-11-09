import { Accordion, type AccordionItem } from '@/components/ui/Accordion';
import { Reveal } from '@/components/ui/Reveal';
import type { ReactNode } from 'react';
import { SectionHead } from './solutions/page-kit';

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
        <SectionHead label="Questions" title={title} description={description} />
      </div>
      <Reveal delay={0.05}>
        <Accordion items={items} defaultOpen={null} />
      </Reveal>
    </div>
  );
}
