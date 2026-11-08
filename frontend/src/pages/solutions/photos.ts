import type { PhotoData } from './page-kit';

/*
 * Photos used on the about and contact pages. The Solutions pages show product scenes, not
 * photos (v4): domain-office, app-phone, trademark-documents and evidence-review are unused.
 * Files live in frontend/public/images/pages as <name>-800.webp and <name>-1600.webp.
 * Credits are in docs/IMAGE-CREDITS.md.
 */

const BASE = '/images/pages';

/** A photo cropped to 4:3 (1600 x 1200). */
const fourByThree = (name: string, alt: string): PhotoData => ({
  src: `${BASE}/${name}`,
  alt,
  width: 1600,
  height: 1200,
});

/** A photo cropped to 3:2 (1600 x 1067). */
const threeByTwo = (name: string, alt: string): PhotoData => ({
  src: `${BASE}/${name}`,
  alt,
  width: 1600,
  height: 1067,
});

export const PAGE_PHOTOS = {
  about: fourByThree(
    'about-team',
    'Two colleagues looking at a laptop together in a bright open office, with a third person standing behind them.',
  ),
  contact: threeByTwo(
    'contact-meeting',
    'Four colleagues talking around a meeting table with printed charts on it.',
  ),
} as const;

/** `sizes` for a hero photo that fills half of the page width on large screens. */
export const HERO_SIZES = '(min-width: 1280px) 600px, (min-width: 1024px) 45vw, 100vw';
