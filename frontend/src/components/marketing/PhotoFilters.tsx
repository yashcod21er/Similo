/**
 * The SVG filters behind the v6 photo treatment (`treatment="duotone" | "halftone"` on `Photo`
 * and `PhotoFrame`). Rendered once by `SiteLayout`; the CSS classes `.photo-duotone` and
 * `.photo-halftone` point at them by id.
 *
 * Each filter does three things in one pass, so a photo stays a single `<img>`:
 * 1. turns the photo into brightness only,
 * 2. maps brightness onto the house tritone: night (shadows) -> burnt orange (mid tones) ->
 *    cream (highlights), with a stronger curve for halftone,
 * 3. lays fine film grain over it (soft light), so photos match the page's grain.
 *
 * The palette stops are the design tokens: night #12110f, a dark warm brown between night and
 * orange, accent #c2500a and cream #f6f0e6.
 */
export function PhotoFilters() {
  return (
    <svg
      aria-hidden
      focusable="false"
      width="0"
      height="0"
      className="pointer-events-none absolute size-0 overflow-hidden"
    >
      <defs>
        {/* contrast curve, then a gradient map: night, brown, burnt orange, peach, cream */}
        <filter
          id="similo-duotone"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix
            type="matrix"
            values="0.3 0.55 0.15 0 0  0.3 0.55 0.15 0 0  0.3 0.55 0.15 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.3" intercept="-0.16" />
            <feFuncG type="linear" slope="1.3" intercept="-0.16" />
            <feFuncB type="linear" slope="1.3" intercept="-0.16" />
          </feComponentTransfer>
          <feComponentTransfer result="tone">
            <feFuncR type="table" tableValues="0.071 0.24 0.76 0.93 0.965" />
            <feFuncG type="table" tableValues="0.067 0.11 0.31 0.78 0.94" />
            <feFuncB type="table" tableValues="0.059 0.07 0.04 0.55 0.9" />
          </feComponentTransfer>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 0.45"
            result="grain"
          />
          <feBlend in="grain" in2="tone" mode="soft-light" />
        </filter>

        {/* the same map with a harder curve (more black and cream, less orange) for halftone */}
        <filter
          id="similo-halftone"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix
            type="matrix"
            values="0.3 0.55 0.15 0 0  0.3 0.55 0.15 0 0  0.3 0.55 0.15 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.6" intercept="-0.3" />
            <feFuncG type="linear" slope="1.6" intercept="-0.3" />
            <feFuncB type="linear" slope="1.6" intercept="-0.3" />
          </feComponentTransfer>
          <feComponentTransfer result="tone">
            <feFuncR type="table" tableValues="0.071 0.071 0.24 0.76 0.93 0.965 0.965" />
            <feFuncG type="table" tableValues="0.067 0.067 0.11 0.31 0.78 0.94 0.94" />
            <feFuncB type="table" tableValues="0.059 0.059 0.07 0.04 0.55 0.9 0.9" />
          </feComponentTransfer>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="3"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 0.45"
            result="grain"
          />
          <feBlend in="grain" in2="tone" mode="soft-light" />
        </filter>
      </defs>
    </svg>
  );
}
