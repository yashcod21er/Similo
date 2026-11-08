import { Section } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { AlertCard, type AlertKind, type AlertLevel } from '@/components/visuals/AlertCard';

interface Story {
  kind: AlertKind;
  title: string;
  story: string;
  alert: { name: string; facts: string[]; level: AlertLevel };
}

const STORIES: Story[] = [
  {
    kind: 'website',
    title: 'A fake website',
    story:
      'Someone registers acme-login.com, copies your sign-in page and emails your customers a link. They type in their password — and the attacker has it.',
    alert: {
      name: 'acme-login.com',
      facts: ['Uses your brand name', 'Registered 2 days ago', 'Has a password form'],
      level: 'high',
    },
  },
  {
    kind: 'app',
    title: 'A copycat app',
    story:
      'An app called “Acme Pro” uses your logo and colours. People install it thinking it is yours, and it asks for their card details.',
    alert: {
      name: 'Acme Pro',
      facts: ['Logo looks like yours', 'Published by another company', 'Asks for payment details'],
      level: 'high',
    },
  },
  {
    kind: 'trademark',
    title: 'A look-alike trademark',
    story:
      'A company files “ACMEE” for the same kind of products. If nobody objects in time, it can be registered — and used legally.',
    alert: {
      name: 'ACMEE',
      facts: ['Sounds like your trademark', 'Same product category', '18 days left to object'],
      level: 'medium',
    },
  },
];

/** 01 — The problem: three everyday stories, each with the alert Similo would raise. */
export function ProblemSection() {
  return (
    <Section>
      <SectionHeading
        align="split"
        index="01"
        eyebrow="The problem"
        title={
          <>
            Copycats don’t look fake. That’s the <em className="text-crimson">problem</em>.
          </>
        }
        description="They use your name, your logo and your look, so your customers can’t tell the difference. These are the three kinds we see most."
      />
      <RevealGroup className="mt-14 grid gap-5 lg:grid-cols-3">
        {STORIES.map((story) => (
          <RevealItem key={story.title}>
            <SpotlightCard className="flex h-full flex-col">
              <div className="relative isolate overflow-hidden border-b border-line bg-paper p-5 sm:p-6">
                <div
                  aria-hidden
                  className="bg-dots mask-radial absolute inset-0 -z-10 opacity-70"
                />
                <AlertCard kind={story.kind} {...story.alert} />
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="text-title font-semibold">{story.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{story.story}</p>
              </div>
            </SpotlightCard>
          </RevealItem>
        ))}
      </RevealGroup>
    </Section>
  );
}
