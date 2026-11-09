import { Megaphone, Scale, ShieldAlert, type LucideIcon } from 'lucide-react';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import { Section } from '@/components/marketing/sections';
import { Parallax } from '@/components/motion/scroll';
import { Eyebrow } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';

const TEAMS: { icon: LucideIcon; team: string; text: string }[] = [
  {
    icon: Scale,
    team: 'Legal teams',
    text: 'See look-alike trademarks while there is still time to object, with the evidence already collected.',
  },
  {
    icon: ShieldAlert,
    team: 'Security teams',
    text: 'Spot fake sign-in pages early and keep the proof you need for a takedown request.',
  },
  {
    icon: Megaphone,
    team: 'Brand and marketing teams',
    text: 'Know when someone uses your name, logo or products without permission, in apps and online.',
  },
];

/** Who it is for: the three teams that share the problem. */
export function TeamsSection() {
  return (
    <Section tone="white">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <Parallax strength={36}>
            <PhotoFrame
              src="/images/core/document-review"
              alt="Three colleagues reading a document together"
              width={1600}
              height={1200}
            />
          </Parallax>
        </Reveal>
        <Reveal delay={0.05}>
          <Eyebrow>Who it is for</Eyebrow>
          <h2 className="text-headline mt-3 font-semibold text-balance">
            Built for the teams that share the problem.
          </h2>
          <p className="text-lead mt-4 text-pretty text-muted">
            Brand protection sits between legal, security and marketing. Everyone works from the
            same evidence, with the view that suits their job.
          </p>
          <ul className="mt-8 divide-y divide-line border-y border-line">
            {TEAMS.map((team) => (
              <li key={team.team} className="flex gap-4 py-5">
                <team.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
                <div>
                  <h3 className="font-semibold">{team.team}</h3>
                  <p className="mt-1 leading-relaxed text-muted">{team.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
