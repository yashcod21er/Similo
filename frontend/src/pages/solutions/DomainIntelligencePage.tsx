import { Section } from '@/components/marketing/sections';
import { Reveal } from '@/components/ui/Reveal';
import { DomainScene } from '@/components/visuals/domain';
import { DomainSwapExhibit, PageCompareExhibit } from '@/components/visuals/exhibits';
import {
  FaqBlock,
  OrangeBand,
  PageHero,
  SectionHead,
  SpecimenGrid,
  StepsWithScene,
  Timeline,
  type SpecimenData,
  type Step,
} from './page-kit';

const STORY = [
  {
    when: 'Day 0',
    text: (
      <>
        Someone registers <span className="font-mono text-[0.95em]">acrne.com</span>. Read quickly,
        it looks just like <span className="font-mono text-[0.95em]">acme.com</span>.
      </>
    ),
  },
  { when: 'Day 1', text: 'They copy your sign-in page and switch on email for the new name.' },
  {
    when: 'Day 2',
    text: 'Your customers get a message that seems to come from you, and type in their passwords.',
  },
  {
    when: 'Our job',
    text: 'Similo aims to flag the name at the first step, and tell you exactly why.',
    ours: true,
  },
];

const KINDS: SpecimenData[] = [
  {
    title: 'Lookalike spelling',
    text: 'Swapped, missing or lookalike letters that are easy to miss at a glance.',
    example: 'acrne.com (r and n together look like m)',
    hood: 'Edit distance and homoglyph checks.',
  },
  {
    title: 'Fake sign-in pages',
    text: 'Copies of your login page, built to collect customer or staff passwords.',
    example: 'acme-sso-login.net',
    hood: 'Page capture and visual comparison.',
  },
  {
    title: 'Fake invoice emails',
    text: 'Names set up to send email, used to ask your clients to pay the wrong account.',
    example: 'billing@acme-invoices.co',
    hood: 'DNS records show whether a name can send mail.',
  },
  {
    title: 'Sleeper sites',
    text: 'Registered and left quiet for weeks, then suddenly switched on.',
    example: 'quiet for 60 days, then live',
    hood: 'Registration dates (RDAP) and re-checks.',
  },
];

const STEPS: Step[] = [
  {
    title: 'Watch every new website name, as it appears.',
    text: 'We regularly check newly registered website names and security certificates from approved sources.',
    hood: 'Zone files, Certificate Transparency logs.',
  },
  {
    title: 'Compare your name, letter by letter, and the page itself.',
    text: 'We also look at who registered the name and when, and what it is set up to do.',
    hood: 'Edit distance, homoglyphs, RDAP, DNS records.',
  },
  {
    title: 'Explain with a risk level, the reasons and the proof.',
    text: 'Anything suspicious gets a risk level and the reasons behind it, in plain words. Every capture is saved with its time and a fingerprint.',
    hood: 'Reason codes, SHA-256 hashes.',
  },
  {
    title: 'A person decides. Nothing happens without one.',
    text: 'Nothing is sent or taken down without a person approving it. A false alarm can be dismissed with a reason.',
    hood: 'Human approval, audit log.',
  },
];

const FAQ = [
  {
    question: 'Can you see every new website that gets registered?',
    answer:
      'No service can honestly promise that. What we can see depends on the sources connected to your workspace, for example approved access to registry lists, which is granted one domain ending at a time, and public security-certificate logs. Some country endings don’t publish their lists at all. Your workspace shows exactly which sources are active, so you always know what is being watched.',
  },
  {
    question: 'Does a “high risk” alert mean the website is illegal?',
    answer:
      'No. The risk level tells your team what to look at first, and lists the reasons. Whether a website actually breaks the law or your rights is a decision made by people, usually your legal team.',
  },
  {
    question: 'Will Similo take a website down by itself?',
    answer:
      'Never. It can prepare a draft request from the evidence, but a person must review and approve it, and sending is always a deliberate action by your team.',
  },
  {
    question: 'What happens if an alert is a false alarm?',
    answer:
      'Dismiss it with a short reason. Similo remembers, so the same website won’t keep coming back in every check, unless something about it changes, such as a sign-in form appearing.',
  },
  {
    question: 'What is “registration data”?',
    answer:
      'Every website name has a public record of when it was registered, which company it was registered through and where it points. We look this up (using a standard called RDAP) to add context. It doesn’t find new websites on its own.',
  },
  {
    question: 'Who in my company would use this?',
    answer:
      'Usually the security team investigates, the legal team decides what action to take, and brand or marketing teams keep an eye on the overall picture. Each person sees the same case, with permissions that fit their role.',
  },
];

export function DomainIntelligencePage() {
  return (
    <>
      <PageHero
        label="Case 01 · Websites"
        title={
          <>
            Spot fake websites <em>before they fool anyone.</em>
          </>
        }
        description="Similo watches new website names for ones that look like yours, and tells you in plain words why each looks risky."
        secondary={{ label: 'Read the guide', to: '/resources/lookalike-domains-explained' }}
        visual={<DomainSwapExhibit />}
      />

      <Section scaffold tone="white">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <SectionHead
              label="The problem"
              title="A copy of your website can go live in days."
              description="Anyone can register a name that looks like yours for a few dollars. Because the website isn’t yours, your own security tools never see it."
            />
            <Reveal delay={0.1}>
              <Timeline items={STORY} />
            </Reveal>
          </div>
          <Reveal className="min-w-0">
            <PageCompareExhibit />
          </Reveal>
        </div>
      </Section>

      <Section scaffold tone="dark">
        <SectionHead
          tone="dark"
          label="How it works"
          title="The same four steps for every website."
          description="Nothing reaches your team without evidence, and nothing is dismissed without a reason."
        />
        <div className="mt-14 lg:mt-20">
          <StepsWithScene
            tone="dark"
            steps={STEPS}
            scene={<DomainScene tone="dark" index="03" />}
          />
        </div>
      </Section>

      <Section scaffold>
        <SectionHead
          label="What we look for"
          title="Four kinds of fake website."
          description="Each one is checked differently, so a harmless-looking name can still be caught."
        />
        <div className="mt-14 lg:mt-20">
          <SpecimenGrid items={KINDS} columns={4} />
        </div>
      </Section>

      <FaqBlock
        tone="white"
        title="Questions, answered."
        description="The things people usually ask before they start watching their website names."
        items={FAQ}
        link={{
          label: 'Read: lookalike domains explained',
          to: '/resources/lookalike-domains-explained',
        }}
      />

      <OrangeBand
        label="Domain review"
        title="See which websites are pretending to be you."
        description="Tell us your main website addresses and we’ll walk you through how lookalikes are found, explained and reviewed."
        primary={{ label: 'Request a domain review', to: '/contact' }}
        secondary={{ label: 'How the AI decides', to: '/technology' }}
      />
    </>
  );
}
