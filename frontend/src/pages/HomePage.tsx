import { ResearchProof } from '@/components/marketing/ResearchProof';
import { CtaBand } from '@/components/marketing/sections';
import { CheckerSection } from './home/CheckerSection';
import { HomeFaq } from './home/HomeFaq';
import { HomeHero } from './home/HomeHero';
import { ProblemSection } from './home/ProblemSection';
import { ScoringSection } from './home/ScoringSection';
import { TeamsSection } from './home/TeamsSection';
import { WorkflowStory } from './home/WorkflowStory';

/**
 * Home page (design system v4). Light/dark rhythm, one message per band:
 *   night  hero: the signature wave and the product scene
 *   cream  the live brand checker (#check)
 *   night  Watch → Explain → Decide, a scroll story
 *   white  the problem: what copycats look like
 *   night  the problem in numbers: cited public research (ResearchProof)
 *   cream  how we score, in the open
 *   white  who it is for (with a photo of people)
 *   cream  questions
 *   night  closing call to action (then the dark footer)
 * Each section lives in ./home so the page reads as a table of contents.
 */
export function HomePage() {
  return (
    <>
      <HomeHero />
      <CheckerSection />
      <WorkflowStory />
      <ProblemSection />
      <ResearchProof />
      <ScoringSection />
      <TeamsSection />
      <HomeFaq />
      <CtaBand
        eyebrow="See it with your brand"
        title={
          <>
            Find the copycats <em className="text-accent-soft">first.</em>
          </>
        }
        description="We will walk you through monitoring, plain-language alerts and an investigation, from the first signal to a reviewed takedown draft."
      />
    </>
  );
}
