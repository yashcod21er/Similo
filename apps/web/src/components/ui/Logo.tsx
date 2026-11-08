import { cn } from '@/lib/cn';

/*
 * Similo identity. Construction, sizes and usage rules: docs/BRAND.md.
 *
 * The symbol is the "o" of the wordmark, cut along its equator. The bottom half (an exact
 * copy) slides right until the two ends meet, which turns the letter into ∼, the sign for
 * "is similar to". The original half is white; the copy is crimson, the colour Similo uses
 * for risk. The letterforms start from Geist (SIL Open Font License 1.1) and are hand-spaced,
 * so never re-type the wordmark in a font: use these components or the files in /public/brand.
 */

/** Top half of the "o" (the original), on the 32-unit tile grid. */
const ORIGINAL =
  'M17.66 16H14.34Q14.34 13.93 13.49 12.77Q12.64 11.6 11.09 11.6Q9.54 11.6 8.68 12.77Q7.82 13.93 7.82 16H4.5Q4.5 13.87 5.32 12.3Q6.13 10.74 7.62 9.87Q9.11 9 11.09 9Q13.07 9 14.55 9.87Q16.03 10.74 16.84 12.3Q17.66 13.87 17.66 16Z';

/** Bottom half of the same "o" (the copy), slid right until its ends meet the original's. */
const COPY =
  'M20.93 23Q18.95 23 17.46 22.14Q15.97 21.27 15.16 19.7Q14.34 18.12 14.34 16H17.66Q17.66 18.08 18.52 19.24Q19.38 20.4 20.93 20.4Q22.48 20.4 23.33 19.24Q24.18 18.08 24.18 16H27.5Q27.5 18.12 26.68 19.7Q25.87 21.27 24.39 22.14Q22.91 23 20.93 23Z';

/** "similo": Geist at weight 600, tracking -22/1000 em, si +4, lo +8. Font units, baseline y = 0. */
const WORDMARK =
  'M2484 12Q2405 12 2346 -22Q2286 -57 2254 -120Q2221 -183 2221 -267Q2221 -352 2254 -414Q2286 -477 2346 -511Q2405 -546 2484 -546Q2563 -546 2622 -511Q2681 -477 2713 -414Q2746 -352 2746 -267Q2746 -183 2713 -120Q2681 -57 2622 -22Q2563 12 2484 12ZM852 0V-534H968L971 -445Q980 -466 992 -483Q1014 -513 1047 -530Q1079 -546 1118 -546Q1186 -546 1228 -507Q1258 -479 1273 -436Q1281 -461 1295 -481Q1317 -512 1350 -529Q1384 -546 1426 -546Q1481 -546 1521 -523Q1561 -499 1582 -454Q1604 -409 1604 -343V0H1476V-310Q1476 -376 1454 -409Q1431 -442 1385 -442Q1354 -442 1332 -426Q1310 -410 1299 -380Q1287 -349 1287 -306V0H1168V-306Q1168 -372 1148 -407Q1128 -442 1079 -442Q1048 -442 1027 -426Q1005 -410 993 -379Q980 -349 980 -306V0ZM287 12Q206 12 152 -11Q99 -34 71 -75Q43 -116 39 -168L170 -174Q177 -132 204 -109Q231 -86 288 -86Q333 -86 356 -100Q380 -115 380 -146Q380 -164 372 -176Q363 -188 339 -197Q314 -206 267 -215Q186 -229 140 -250Q94 -270 76 -301Q57 -332 57 -378Q57 -453 114 -499Q172 -546 283 -546Q360 -546 410 -522Q459 -497 484 -457Q510 -416 514 -366L384 -360Q383 -385 372 -405Q361 -425 339 -437Q317 -448 281 -448Q236 -448 213 -430Q189 -412 189 -382Q189 -361 199 -347Q208 -333 231 -324Q254 -316 294 -309Q376 -297 424 -276Q472 -255 493 -224Q513 -192 513 -148Q513 -71 452 -30Q390 12 287 12ZM2097 0Q2039 0 2004 -30Q1969 -60 1969 -126V-710H2097V-139Q2097 -119 2108 -109Q2118 -99 2137 -99H2176V0ZM2484 -92Q2546 -92 2579 -138Q2613 -184 2613 -267Q2613 -349 2579 -396Q2546 -442 2484 -442Q2422 -442 2388 -396Q2354 -349 2354 -267Q2354 -184 2388 -138Q2422 -92 2484 -92ZM605 0V-534H733V0ZM1722 0V-534H1850V0ZM603 -605V-719H736V-605ZM1720 -605V-719H1853V-605Z';

/**
 * Places the wordmark beside the tile at the symbol's own scale (7/279 tile units per font
 * unit). The "o" that ends the word is then exactly the two halves in the tile put back
 * together, and its equator sits on the tile's centre line (y = 16). Gap: 9.5 units.
 */
const LOCKUP_WORDMARK = 'matrix(0.02509 0 0 0.02509 40.516 22.699)';

const NAVY = '#0B1020';
const CRIMSON = '#D92F48';

/** The app-icon tile. Self-contained, so it works on light and dark surfaces. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <rect width="32" height="32" rx="8.5" fill={NAVY} />
      <path d={ORIGINAL} fill="#FFFFFF" />
      <path d={COPY} fill={CRIMSON} />
    </svg>
  );
}

/** The bare ∼ in the current text colour. `accent` paints the copy crimson. */
export function LogoSymbol({
  className,
  accent = false,
}: {
  className?: string;
  accent?: boolean;
}) {
  return (
    <svg
      viewBox="4.5 9 23 14"
      aria-hidden
      fill="currentColor"
      className={cn('h-4 w-auto', className)}
    >
      <path d={ORIGINAL} />
      <path d={COPY} fill={accent ? CRIMSON : undefined} />
    </svg>
  );
}

/**
 * The wordmark alone. It fills the width of its container and the height follows.
 * `tone` sets ink or white; without it the wordmark uses the surrounding text colour, so a
 * colour in `className` (for example `text-ink/[0.11]`) never competes with a default.
 * Decorative: pair it with visible or sr-only text if it is the only brand name.
 */
export function LogoWordmark({ className, tone }: { className?: string; tone?: 'light' | 'dark' }) {
  return (
    <svg
      viewBox="37 -721 2711 735"
      aria-hidden
      fill="currentColor"
      className={cn(
        'block h-auto w-full',
        tone === 'light' && 'text-ink',
        tone === 'dark' && 'text-white',
        className,
      )}
    >
      <path d={WORDMARK} />
    </svg>
  );
}

/** Tile + wordmark, drawn as one SVG so the proportions never drift. */
export function Logo({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center',
        tone === 'dark' ? 'text-white' : 'text-ink',
        className,
      )}
    >
      <svg viewBox="0 0 109.41 32" aria-hidden className="h-8 w-auto shrink-0">
        <rect width="32" height="32" rx="8.5" fill={NAVY} />
        {tone === 'dark' && (
          <rect
            x="0.5"
            y="0.5"
            width="31"
            height="31"
            rx="8"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.15"
          />
        )}
        <path d={ORIGINAL} fill="#FFFFFF" />
        <path d={COPY} fill={CRIMSON} />
        <path d={WORDMARK} transform={LOCKUP_WORDMARK} fill="currentColor" />
      </svg>
      <span className="sr-only">Similo</span>
    </span>
  );
}
