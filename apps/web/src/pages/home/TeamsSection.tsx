import {
  ClipboardCheck,
  Megaphone,
  Scale,
  ShieldAlert,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import { Section } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

const TEAMS: { icon: LucideIcon; team: string; text: string; gets: string[] }[] = [
  {
    icon: Scale,
    team: 'Legal teams',
    text: 'See look-alike trademarks while there is still time to object, with the evidence already collected.',
    gets: ['Objection deadlines tracked', 'Drafts to edit, never auto-sent'],
  },
  {
    icon: ShieldAlert,
    team: 'Security teams',
    text: 'Spot fake sign-in pages early and keep the proof you need for a takedown request.',
    gets: ['New websites flagged with reasons', 'Screenshots with fingerprints'],
  },
  {
    icon: Megaphone,
    team: 'Brand & marketing',
    text: 'Know when someone uses your name, logo or products without permission — in apps and online.',
    gets: ['Copycat apps and logos', 'Clear reports for leadership'],
  },
];

const CONTROL = [
  {
    icon: UserCheck,
    title: 'A person always decides',
    text: 'Nothing is sent, reported or taken down without someone on your team approving it.',
  },
  {
    icon: ClipboardCheck,
    title: 'Every action is recorded',
    text: 'Who looked at what, who changed a status and who approved it — with the time.',
  },
  {
    icon: Scale,
    title: 'Scores guide, people judge',
    text: 'A risk level helps you decide what to look at first. It is not a legal finding.',
  },
];

/** 04 — Who it's for: the three teams, then the "you stay in control" promises. */
export function TeamsSection() {
  return (
    <Section tone="white">
      <SectionHeading
        align="split"
        index="04"
        eyebrow="Who it’s for"
        title={
          <>
            Built for the people who <em className="text-crimson">protect</em> your brand.
          </>
        }
        description="Brand protection sits between legal, security and marketing. Each team sees the same evidence, with the view that suits its job."
      />

      <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3">
        {TEAMS.map((team) => (
          <RevealItem key={team.team}>
            <SpotlightCard className="flex h-full flex-col p-6 sm:p-7">
              <span className="flex size-11 items-center justify-center rounded-xl bg-paper text-crimson-dark ring-1 ring-line transition-colors duration-300 group-hover/spot:bg-crimson group-hover/spot:text-white group-hover/spot:ring-crimson">
                <team.icon aria-hidden className="size-5" />
              </span>
              <h3 className="text-title mt-6 font-semibold">{team.team}</h3>
              <p className="mt-2.5 leading-relaxed text-muted">{team.text}</p>
              <ul className="mt-auto space-y-2 border-t border-line pt-5 text-[14.5px]">
                {team.gets.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span aria-hidden className="size-1.5 rounded-full bg-crimson" />
                    {item}
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal className="mt-5">
        <div className="grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line md:grid-cols-3">
          {CONTROL.map((item) => (
            <div key={item.title} className="flex gap-4 bg-paper p-6 sm:p-7">
              <item.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-crimson-dark" />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
