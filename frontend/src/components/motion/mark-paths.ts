/*
 * The two halves of the logo's "o" on the 32-unit tile grid (y down), copied from
 * components/ui/Logo.tsx so motion pieces can draw them without pulling in the logo
 * components. Keep the two files in sync (docs/BRAND.md).
 */

/** Top half of the "o" (the original). */
export const MARK_ORIGINAL =
  'M17.66 16H14.34Q14.34 13.93 13.49 12.77Q12.64 11.6 11.09 11.6Q9.54 11.6 8.68 12.77Q7.82 13.93 7.82 16H4.5Q4.5 13.87 5.32 12.3Q6.13 10.74 7.62 9.87Q9.11 9 11.09 9Q13.07 9 14.55 9.87Q16.03 10.74 16.84 12.3Q17.66 13.87 17.66 16Z';

/** Bottom half of the same "o" (the copy), slid right until its ends meet the original's. */
export const MARK_COPY =
  'M20.93 23Q18.95 23 17.46 22.14Q15.97 21.27 15.16 19.7Q14.34 18.12 14.34 16H17.66Q17.66 18.08 18.52 19.24Q19.38 20.4 20.93 20.4Q22.48 20.4 23.33 19.24Q24.18 18.08 24.18 16H27.5Q27.5 18.12 26.68 19.7Q25.87 21.27 24.39 22.14Q22.91 23 20.93 23Z';
