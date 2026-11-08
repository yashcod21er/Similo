import { Clock3, KeyRound, Mail, Spline } from 'lucide-react';
import { CtaBand, ProcessSteps, Section, SplitHero } from '@/components/marketing/sections';
import { SectionHeading } from '@/components/ui/layout';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import { AlertCard } from '@/components/visuals/AlertCard';
import {
  DismissedChip,
  DomainAlertVisual,
  EvidenceChip,
  PageCompareVisual,
  RegistrationFacts,
  SampleHeader,
  SetupTimeline,
} from '@/components/visuals/domain';
import { FaqSection, KindCard, Story, Tile, UnderTheHood } from './domain-app-parts';

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
    text: 'Similo aims to flag the name at the first step — and tell you exactly why.',
    ours: true,
  },
];

const KINDS = [
  {
    icon: Spline,
    title: 'Lookalike spelling',
    text: 'Swapped, missing or lookalike letters that are easy to miss at a glance.',
    example: 'acrne.com  ·  r + n ≈ m',
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
    example: 'quiet for 60 days → live',
  },
];

const STEPS = [
  {
    title: 'Watch',
    description:
      'We regularly check newly registered website names and security certificates from approved sources.',
    detail: 'Zone files · Certificate Transparency',
  },
  {
    title: 'Compare',
    description:
      'Each name is compared with yours, and we look up who registered it, when, and what it is set up to do.',
    detail: 'Edit distance · homoglyphs · RDAP · DNS',
  },
  {
    title: 'Explain',
    description: 'Anything suspicious gets a risk level and the reasons behind it, in plain words.',
    detail: 'Reason codes, not a black box',
  },
  {
    title: 'You decide',
    description:
      'Your team reviews the evidence. Nothing is sent or taken down without a person approving it.',
    detail: 'Human approval · audit log',
  },
];

const FAQ = [
  {
    question: 'Can you see every new website that gets registered?',
    answer:
      'No service can honestly promise that. What we can see depends on the sources connected to your workspace — for example approved access to registry lists, which is granted one domain ending at a time, and public security-certificate logs. Some country endings don’t publish their lists at all. Your workspace shows exactly which sources are active, so you always know what is being watched.',
  },
  {
    question: 'Does a “high risk” alert mean the website is illegal?',
    answer:
      'No. The risk level tells your team what to look at first, and lists the reasons. Whether a website actually breaks the law or your rights is a decision made by people — usually your legal team.',
  },
  {
    question: 'Will Similo take a website down by itself?',
    answer:
      'Never. It can prepare a draft request from the evidence, but a person must review and approve it, and sending is always a deliberate action by your team.',
  },
  {
    question: 'What happens if an alert is a false alarm?',
    answer:
      'Dismiss it with a short reason. Similo remembers, so the same website won’t keep coming back in every check — unless something about it changes, such as a sign-in form appearing.',
  },
  {
    question: 'What is “registration data”?',
    answer:
      'Every website name has a public record of when it was registered, which company it was registered through and where it points. We look this up (using a standard called RDAP) to add context — it doesn’t find new websites on its own.',
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
        title={
          <>
            Spot fake websites <em>before</em> they fool anyone.
          </>
        }
        description="Similo watches new website names for ones that look like yours, checks what each one is set up to do, and tells you in plain words why it looks risky."
        secondaryCta={{ label: 'Read the guide', to: '/resources/lookalike-domains-explained' }}
        highlights={[
          { label: 'Watches', value: 'New websites' },
          { label: 'Checks', value: 'Name, page, setup' },
          { label: 'You get', value: 'Plain-language alerts' },
        ]}
        visual={<DomainAlertVisual />}
      />

      {/* 01 — The problem */}
      <Section>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <SectionHeading
              index="01"
              eyebrow="The problem"
              title={
                <>
                  A copy of your website can go live in <em>days</em>.
                </>
              }
              description="Anyone can register a name that looks like yours for a few dollars. Because the website isn’t yours, your own security tools never see it."
            />
            <Story steps={STORY} />
          </div>
          <Reveal className="relative">
            <div
              aria-hidden
              className="absolute inset-x-6 top-10 bottom-0 -z-10 rounded-full bg-coral/30 blur-[80px]"
            />
            <p className="mb-4 text-[13px] font-medium text-muted">What your team sees</p>
            <AlertCard
              kind="website"
              name="acrne-login.com"
              facts={[
                'Looks like your brand name',
                'Registered 2 days ago',
                'Has a sign-in form like yours',
              ]}
              level="high"
            />
            <UnderTheHood className="mt-5">
              homoglyph match · RDAP lookup · page capture
            </UnderTheHood>
          </Reveal>
        </div>

        <Reveal className="mt-24 flex items-end justify-between gap-6">
          <h3 className="text-title font-semibold">Four kinds of fake website</h3>
          <p className="hidden text-[14px] text-muted sm:block">Each one is checked differently.</p>
        </Reveal>
        <RevealGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {KINDS.map((kind) => (
            <RevealItem key={kind.title}>
              <KindCard
                icon={<kind.icon aria-hidden className="size-5" />}
                title={kind.title}
                text={kind.text}
                example={kind.example}
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* 02 — How it works */}
      <Section tone="white">
        <SectionHeading
          index="02"
          eyebrow="How it works"
          align="split"
          title={
            <>
              The same four steps for <em>every</em> website.
            </>
          }
          description="The same process for every name we find, so nothing reaches your team without evidence — and nothing is dismissed without a reason."
        />
        <div className="mt-16">
          <ProcessSteps steps={STEPS} />
        </div>
      </Section>

      {/* 03 — What we check */}
      <Section>
        <SectionHeading
          index="03"
          eyebrow="What we check"
          align="split"
          title={
            <>
              We look past the name, at what the site <em>does</em>.
            </>
          }
          description="A harmless-looking name can hide a convincing copy of your page. So Similo also checks the page itself, who is behind it and how it is set up."
        />
        <RevealGroup className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-6">
          <RevealItem className="lg:col-span-4">
            <Tile
              title="Does the page look like yours?"
              description="We take a picture of the page and compare it with your real one — layout, wording and where the sign-in form sends passwords."
              underHood="screenshot embeddings · text similarity · form analysis"
            >
              <SampleHeader>Side-by-side check</SampleHeader>
              <PageCompareVisual />
            </Tile>
          </RevealItem>
          {/* Two shorter tiles stacked beside the tall comparison tile. */}
          <RevealItem className="grid grid-cols-1 gap-5 lg:col-span-2 lg:grid-rows-[auto_1fr]">
            <Tile
              title="Who registered it, and when?"
              description="Brand-new names with a hidden owner deserve a closer look."
              underHood="RDAP registration data"
            >
              <SampleHeader>Registration record</SampleHeader>
              <RegistrationFacts />
            </Tile>
            <Tile
              title="What is it set up to do?"
              description="Certificates, email and forms show a site getting ready to be used."
              underHood="Certificate Transparency · DNS & MX records"
            >
              <SetupTimeline />
            </Tile>
          </RevealItem>
          <RevealItem className="lg:col-span-3">
            <Tile
              title="Proof that holds up later"
              description="Every capture is saved with its time, address and a fingerprint, so you can show it hasn’t changed."
              underHood="SHA-256 hash · chain of custody"
            >
              <EvidenceChip />
            </Tile>
          </RevealItem>
          <RevealItem className="lg:col-span-3">
            <Tile
              title="Say no once"
              description="Dismiss a false alarm with a reason and it stays dismissed, unless the site changes."
              underHood="suppression rules · change detection"
            >
              <DismissedChip />
            </Tile>
          </RevealItem>
        </RevealGroup>
      </Section>

      {/* 04 — Questions */}
      <FaqSection
        index="04"
        title={
          <>
            Questions, <em>answered</em>.
          </>
        }
        description="The things people usually ask before they start watching their website names."
        items={FAQ}
        link={{
          label: 'Read: lookalike domains explained',
          to: '/resources/lookalike-domains-explained',
        }}
      />

      <CtaBand
        eyebrow="Domain review"
        title={
          <>
            See which websites are <em>pretending</em> to be you.
          </>
        }
        description="Tell us your main website addresses and we’ll walk you through how lookalikes are found, explained and reviewed."
        primary={{ label: 'Request a domain review', to: '/contact' }}
        secondary={{ label: 'How the AI decides', to: '/technology' }}
      />
    </>
  );
}
