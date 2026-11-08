import { CtaBand } from '@/components/marketing/sections';
import { HomeFaq } from './home/HomeFaq';
import { HomeHero } from './home/HomeHero';
import { HowItWorks } from './home/HowItWorks';
import { ProblemSection } from './home/ProblemSection';
import { TeamsSection } from './home/TeamsSection';
import { WhatYouGet } from './home/WhatYouGet';

/**
 * Home page (design system v2). The story runs: try it → the problem → how it
 * works → what you get → who it's for → questions → talk to us.
 * Each section lives in ./home so the page reads as a table of contents.
 */
export function HomePage() {
  return (
    <>
      <HomeHero />
      <ProblemSection />
      <HowItWorks />
      <WhatYouGet />
      <TeamsSection />
      <HomeFaq />
      <CtaBand
        eyebrow="See it with your brand"
        title={
          <>
            Find the copycats <em className="text-coral">first</em>.
          </>
        }
        description="We’ll walk you through monitoring, plain-language alerts and an investigation — from the first signal to a reviewed takedown draft."
      />
    </>
  );
}
