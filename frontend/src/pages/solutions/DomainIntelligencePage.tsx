import { Clock3, KeyRound, Mail, Spline } from 'lucide-react';
import { PhotoFrame } from '@/components/marketing/PhotoFrame';
import {
  CtaBand,
  FeatureCard,
  ProcessSteps,
  Section,
  SplitHero,
} from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { FindingExample } from './domain-app-parts';
import { CardGrid, FaqBlock, SplitSection, Timeline } from './page-kit';
import { HERO_SIZES, PAGE_PHOTOS } from './photos';

const STORY = [
  {
    when: 'Day 0',
    text: (
      <>
        Someone registers <span className="font-mono text-[0.95em]">acrne-login.com</span>. Read
        quickly, it looks just like <span className="font-mono text-[0.95em]">acme.com</span>.
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

const KINDS = [
  {
    icon: Spline,
    title: 'Lookalike spelling',
    text: 'Swapped, missing or lookalike letters that are easy to miss at a glance.',
    example: 'acrne.com (r and n together look like m)',
  },
  {
    icon: KeyRound,
    title: 'Fake sign-in pages',
    text: 'Copies of your login page, built to collect customer or staff passwords.',
    example: 'acme-sso-login.net',
  },
  {
    icon: Mail,
    title: 'Fake invoice emails',
    text: 'Names set up to send email, used to ask your clients to pay the wrong account.',
    example: 'billing@acme-invoices.co',
  },
  {
    icon: Clock3,
    title: 'Sleeper sites',
    text: 'Registered and left quiet for weeks, then suddenly switched on.',
    example: 'quiet for 60 days, then live',
  },
];

const STEPS = [
  {
    title: 'Watch',
    description:
      'We regularly check newly registered website names and security certificates from approved sources.',
    detail: 'Under the hood: zone files, Certificate Transparency logs',
  },
  {
    title: 'Compare',
    description:
      'Each name is compared with yours. We also look at the page itself, who registered the name and when, and what it is set up to do.',
    detail: 'Under the hood: edit distance, homoglyphs, RDAP, DNS records',
  },
  {
    title: 'Explain',
    description:
      'Anything suspicious gets a risk level and the reasons behind it, in plain words. Every capture is saved with its time and a fingerprint.',
    detail: 'Under the hood: reason codes, SHA-256 hashes',
  },
  {
    title: 'You decide',
    description:
      'Your team reviews the evidence. Nothing is sent or taken down without a person approving it. A false alarm can be dismissed with a reason.',
    detail: 'Under the hood: human approval, audit log',
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
      <SplitHero
        eyebrow="Domain Intelligence"
        title="Spot fake websites before they fool anyone."
        description="Similo watches new website names for ones that look like yours, checks what each one is set up to do, and tells you in plain words why it looks risky."
        secondaryCta={{ label: 'Read the guide', to: '/resources/lookalike-domains-explained' }}
        visual={<PhotoFrame {...PAGE_PHOTOS.domain} priority sizes={HERO_SIZES} />}
      />

      <Section>
        <SplitSection
          text={
            <>
              <SectionHeading
                eyebrow="The problem"
                title="A copy of your website can go live in days."
                description="Anyone can register a name that looks like yours for a few dollars. Because the website isn’t yours, your own security tools never see it."
              />
              <Timeline items={STORY} />
            </>
          }
          media={
            <FindingExample
              kind="website"
              name="acrne-login.com"
              facts={[
                'Looks like your brand name',
                'Registered 2 days ago',
                'Has a sign-in form like yours',
              ]}
              level="high"
              caption="Illustrative example: how one finding appears to your team. The website name is made up."
            />
          }
        />
      </Section>

      <Section tone="white">
        <SectionHeading
          eyebrow="What we look for"
          title="Four kinds of fake website."
          description="Each one is checked differently, so a harmless-looking name can still be caught."
        />
        <CardGrid columns={4} className="mt-12">
          {KINDS.map((kind) => (
            <FeatureCard
              key={kind.title}
              icon={<kind.icon aria-hidden className="size-5" />}
              title={kind.title}
              description={kind.text}
            >
              <p className="text-[13px] text-muted">Example: {kind.example}</p>
            </FeatureCard>
          ))}
        </CardGrid>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="The same four steps for every website."
          description="Nothing reaches your team without evidence, and nothing is dismissed without a reason."
        />
        <div className="mt-12">
          <ProcessSteps steps={STEPS} />
        </div>
      </Section>

      <FaqBlock
        title="Questions, answered."
        description="The things people usually ask before they start watching their website names."
        items={FAQ}
        link={{
          label: 'Read: lookalike domains explained',
          to: '/resources/lookalike-domains-explained',
        }}
      />

      <CtaBand
        eyebrow="Domain review"
        title="See which websites are pretending to be you."
        description="Tell us your main website addresses and we’ll walk you through how lookalikes are found, explained and reviewed."
        primary={{ label: 'Request a domain review', to: '/contact' }}
        secondary={{ label: 'How the AI decides', to: '/technology' }}
      />
    </>
  );
}
