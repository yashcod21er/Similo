import { CtaBand } from '@/components/marketing/sections';
import { CheckerSection } from './home/CheckerSection';
import { HomeFaq } from './home/HomeFaq';
import { HomeHero } from './home/HomeHero';
import { HowItWorks } from './home/HowItWorks';
import { ProblemSection } from './home/ProblemSection';
import { TeamsSection } from './home/TeamsSection';
import { WhatYouGet } from './home/WhatYouGet';

/**
 * Home page (design system v3). One message per section, alternating white and
 * paper: hero → the problem → try the checker → how it helps → what you get →
 * who it is for → questions → one dark closing call to action.
 * Each section lives in ./home so the page reads as a table of contents.
 */
export function HomePage() {
  return (
    <>
      <HomeHero />
      <ProblemSection />
      <CheckerSection />
      <HowItWorks />
      <WhatYouGet />
      <TeamsSection />
      <HomeFaq />
      <CtaBand
        eyebrow="See it with your brand"
        title="Find the copycats first."
        description="We will walk you through monitoring, plain-language alerts and an investigation, from the first signal to a reviewed takedown draft."
      />
    </>
  );
}
