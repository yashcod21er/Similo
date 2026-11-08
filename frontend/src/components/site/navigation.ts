import {
  BrainCircuit,
  FolderSearch,
  Globe,
  Layers,
  type LucideIcon,
  Smartphone,
  Stamp,
} from 'lucide-react';

/**
 * Single source of truth for site navigation. The header, mobile menu,
 * command menu (⌘K) and footer all read from here, so adding a page means
 * editing one file. Descriptions are written in plain words on purpose.
 */

export interface NavItem {
  label: string;
  to: string;
  description: string;
  icon: LucideIcon;
}

/** Highlighted card shown on the right of a dropdown menu. */
export interface NavFeature {
  eyebrow: string;
  title: string;
  description: string;
  to: string;
  cta: string;
}

export interface NavMenu {
  label: string;
  items: NavItem[];
  featured?: NavFeature;
}

export interface NavLinkEntry {
  label: string;
  to: string;
}

export type NavEntry = NavMenu | NavLinkEntry;

export const solutionItems: NavItem[] = [
  {
    label: 'Domain Intelligence',
    to: '/solutions/domain-intelligence',
    description: 'Fake websites that use your name or look like yours.',
    icon: Globe,
  },
  {
    label: 'App Intelligence',
    to: '/solutions/app-intelligence',
    description: 'Copycat apps that borrow your name, logo or company.',
    icon: Smartphone,
  },
  {
    label: 'Trademark Intelligence',
    to: '/solutions/trademark-intelligence',
    description: 'New trademark filings that come too close to yours.',
    icon: Stamp,
  },
  {
    label: 'Investigation & Evidence',
    to: '/solutions/investigation-evidence',
    description: 'Collect proof, work as a team and decide what to do.',
    icon: FolderSearch,
  },
];

export const howItWorksItems: NavItem[] = [
  {
    label: 'The platform',
    to: '/platform',
    description: 'How watching, checking and reviewing fit together.',
    icon: Layers,
  },
  {
    label: 'The AI, explained',
    to: '/technology',
    description: 'What the AI compares, and how it shows its reasons.',
    icon: BrainCircuit,
  },
];

export const primaryNav: NavEntry[] = [
  {
    label: 'Solutions',
    items: solutionItems,
    featured: {
      eyebrow: 'Try it now',
      title: 'Check your brand name',
      description: 'See how copycats could imitate it. Runs in your browser.',
      to: '/#check',
      cta: 'Open the checker',
    },
  },
  {
    label: 'How it works',
    items: howItWorksItems,
    featured: {
      eyebrow: 'Guide',
      title: 'How explainable risk scores work',
      description: 'Why every alert comes with its reasons.',
      to: '/resources/explainable-risk-scores',
      cta: 'Read the guide',
    },
  },
  { label: 'Resources', to: '/resources' },
  { label: 'About', to: '/about' },
];

export function isMenu(entry: NavEntry): entry is NavMenu {
  return 'items' in entry;
}

export const footerColumns: { title: string; links: NavLinkEntry[] }[] = [
  {
    title: 'Solutions',
    links: solutionItems.map(({ label, to }) => ({ label, to })),
  },
  {
    title: 'How it works',
    links: [
      ...howItWorksItems.map(({ label, to }) => ({ label, to })),
      { label: 'Check your brand', to: '/#check' },
      { label: 'System status', to: '/status' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'All guides', to: '/resources' },
      { label: 'Lookalike domains', to: '/resources/lookalike-domains-explained' },
      { label: 'Trademark watch', to: '/resources/trademark-watch-basics' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Request a demo', to: '/contact' },
    ],
  },
];
