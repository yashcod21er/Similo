import { Bot, FileText, User } from 'lucide-react';
import { motion } from 'motion/react';
import { EASE_OUT } from '@/lib/motion';
import { ProductWindow } from './primitives';

const SOURCES = [
  { id: 1, label: 'Finding F-2291 · acrne-login.com' },
  { id: 2, label: 'Evidence · page-capture-full.png' },
  { id: 3, label: 'RDAP response · captured Day 2' },
];

/** RAG assistant preview: a grounded answer that cites retrieved records. */
export function AssistantPreview() {
  return (
    <ProductWindow title="assistant · case 0142" className="mx-auto w-full max-w-lg">
      <div className="space-y-4 p-4 sm:p-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex justify-end gap-2"
        >
          <p className="max-w-[80%] rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-[13px]">
            Why was acrne-login.com flagged against our brand?
          </p>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10">
            <User className="size-3.5" />
          </span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: 0.4 }}
          className="flex gap-2"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft/20 text-accent-soft">
            <Bot className="size-3.5" />
          </span>
          <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3 text-[13px] leading-relaxed ring-1 ring-white/10">
            <p>
              It replaces “m” with “rn”, which looks identical in many fonts
              <sup className="text-accent-soft">[1]</sup>. The page copies your sign-in screen and posts
              credentials to an external host<sup className="text-accent-soft">[2]</sup>. It was
              registered two days before detection<sup className="text-accent-soft">[3]</sup>.
            </p>
            <p className="mt-2.5 border-t border-white/10 pt-2.5 text-white/55">
              Not found in the case records: who operates the domain.
            </p>
          </div>
        </motion.div>
        <motion.ul
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="space-y-1.5 border-t border-white/10 pt-4"
        >
          <li className="pb-1 font-mono text-[10.5px] tracking-[0.08em] text-white/60 uppercase">
            Sources
          </li>
          {SOURCES.map((source) => (
            <li
              key={source.id}
              className="flex items-center gap-2 font-mono text-[11px] text-white/60"
            >
              <span className="text-accent-soft">[{source.id}]</span>
              <FileText className="size-3" />
              {source.label}
            </li>
          ))}
        </motion.ul>
      </div>
    </ProductWindow>
  );
}
