import { Check } from 'lucide-react';
import { Section } from '@/components/marketing/sections';
import { Eyebrow } from '@/components/ui/layout';
import { Reveal } from '@/components/ui/Reveal';
import { AlertCard } from '@/components/visuals/AlertCard';

const ITEMS = [
  {
    title: 'One list for everything',
    text: 'Website, app and trademark alerts sit together, sorted by risk.',
  },
  {
    title: 'Reasons, not just scores',
    text: 'Every alert says why it was flagged, in words anyone can check.',
  },
  {
    title: 'Evidence kept with each alert',
    text: 'Screenshots, notes and files stay attached, with a record of who did what.',
  },
  {
    title: 'Roles and approvals',
    text: 'You choose who can view, investigate and approve. Every action is logged.',
  },
];

/** What you get: the outputs, with one clearly labelled example alert. */
export function WhatYouGet() {
  return (
    <Section tone="white">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <Eyebrow>What you get</Eyebrow>
          <h2 className="text-headline mt-3 font-semibold text-balance">
            Alerts your whole team can understand and act on.
          </h2>
          <ul className="mt-8 space-y-5">
            {ITEMS.map((item) => (
              <li key={item.title} className="flex gap-3.5">
                <Check aria-hidden className="mt-1 size-5 shrink-0 text-crimson" />
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-0.5 leading-relaxed text-muted">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.05}>
          <figure className="mx-auto max-w-md rounded-2xl bg-paper p-5 ring-1 ring-line sm:p-8">
            <AlertCard
              kind="website"
              name="acme-login.com"
              facts={['Uses your brand name', 'Registered 2 days ago', 'Has a password form']}
              level="high"
            />
            <figcaption className="mt-4 text-[13px] text-muted">
              An alert says what was found, why it looks risky and how urgent it is. Sample data.
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </Section>
  );
}
