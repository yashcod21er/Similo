import { ResearchProof } from '@/components/marketing/ResearchProof';
import { CheckerSection } from './home/CheckerSection';
import { ClosingSection } from './home/ClosingSection';
import { FloodSection } from './home/FloodSection';
import { GlobeSection } from './home/GlobeSection';
import { HomeFaq } from './home/HomeFaq';
import { HomeHero } from './home/HomeHero';
import { HowSection } from './home/HowSection';
import { LetterSection } from './home/LetterSection';
import { SpotSection } from './home/SpotSection';
import { WatchSection } from './home/WatchSection';

/**
 * Home page (v6, "Spot the difference"): the flagship of the evidence-room concept. Every band
 * is one numbered plate (FIG. 01–10) with one idea and a different kind of picture:
 *
 *   cream   01 hero: the 3D ∼, crystal and orange glass, in front of the giant word (WebGL)
 *   white   02 spot the difference: drag between your sign-in page and its copy
 *   night   03 one letter is enough: acme.com → acrne.com, as a type specimen
 *   cream   04 the live brand checker (#check)
 *   night   05 how it works: pinned and scroll-scrubbed, a new picture per step, a stamp
 *   white   06 what Similo watches: an isometric stack of sources and the case file
 *   cream   07 wherever they appear: the globe as an ink engraving (WebGL)
 *   night   the problem in numbers: cited public research (ResearchProof)
 *   orange  08 the one flood band: "The difference is the evidence."
 *   cream   09 questions
 *   night   10 the close, then the dark footer
 *
 * The serif italic appears once (the hero). Each section lives in ./home.
 */
export function HomePage() {
  return (
    <>
      <HomeHero />
      <SpotSection />
      <LetterSection />
      <CheckerSection />
      <HowSection />
      <WatchSection />
      <GlobeSection />
      <ResearchProof />
      <FloodSection />
      <HomeFaq />
      <ClosingSection />
    </>
  );
}
