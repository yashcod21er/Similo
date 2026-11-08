import { Globe, Smartphone, Stamp, type LucideIcon } from 'lucide-react';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { Section } from '@/components/marketing/sections';
import { Eyebrow } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';

const KINDS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Globe,
    title: 'A fake website',
    text: 'Someone registers a name close to yours, copies your sign-in page and sends your customers a link.',
  },
  {
    icon: Smartphone,
    title: 'A copycat app',
    text: 'An app uses your logo and colours. People install it because they think it is yours.',
  },
  {
    icon: Stamp,
    title: 'A look-alike trademark',
    text: 'A company files a name that sounds like yours. If nobody objects in time, it can be registered.',
  },
];

/** The problem in plain words: why copycats work and the three forms they take. */
export function ProblemSection() {
  return (
    <Section>
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="lg:order-2">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="text-headline mt-3 font-semibold text-balance">
            Copycats do not look fake. That is why they work.
          </h2>
          <p className="text-lead mt-4 text-pretty text-muted">
            They borrow your name, your logo and your look. Your customers cannot tell the
            difference, and by the time someone notices, the damage is done.
          </p>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {KINDS.map((kind) => (
              <li key={kind.title} className="flex gap-4 py-5">
                <kind.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-crimson" />
                <div>
                  <h3 className="font-semibold">{kind.title}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{kind.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal className="lg:order-1">
          <PhotoFrame
            src="/images/core/online-payment"
            alt="A woman at her desk holding a phone and a payment card"
            width={1600}
            height={1067}
            ratio="aspect-[3/2]"
          />
        </Reveal>
      </div>
    </Section>
  );
}
