import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { EASE_OUT } from '@/lib/motion';

export interface AccordionItem {
  question: string;
  answer: string;
}

/** FAQ list: one item open at a time, keyboard accessible (real <button>s with aria-expanded). */
export function Accordion({
  items,
  className,
  defaultOpen = 0,
}: {
  items: AccordionItem[];
  className?: string;
  /** Index open on first render, or null for all closed. */
  defaultOpen?: number | null;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);
  const baseId = useId();

  return (
    <ul className={cn('divide-y divide-line border-y border-line', className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;
        return (
          <li key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[1.0625rem] font-medium tracking-[-0.015em]"
              >
                {item.question}
                <span
                  aria-hidden
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center text-muted transition-[color,transform] duration-200 group-hover:text-ink',
                    isOpen && 'rotate-45 text-ink',
                  )}
                >
                  <Plus className="size-5" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pr-10 pb-6 leading-relaxed text-muted">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
