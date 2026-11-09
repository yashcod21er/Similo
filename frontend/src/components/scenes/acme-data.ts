/** Data shared by the fictional Acme scenes. */
export type AcmeVariant = 'original' | 'copy';

/** The four differences between the two pages, in the order of the numbered orange tags. */
export const ACME_DIFFERENCES = [
  'The web address says acrne.com, not acme.com.',
  'In the logo, the m has become an r and an n.',
  'Spelling slip: “pasword”.',
  'The button says “Log in” instead of “Sign in”.',
] as const;

/** Where a `Loupe` rests on the sample page: the logo, where the m has become an r and an n. */
export const ACME_LOUPE_FOCUS = { x: 0.37, y: 0.305 } as const;
