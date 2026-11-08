# Similo brand identity

> **The mark is the _o_ of the wordmark, cut along its middle.** Slide the bottom half, an exact
> copy, across until the two ends meet, and the letter becomes **∼**, the mathematical sign for
> "is similar to". The original half stays white; the copy is crimson, the colour Similo uses for
> risk.

That is the product in one shape: two things that look the same, and the one worth a second look.
Every lockup also contains a small "spot the difference". The _o_ that ends the word is made of
the same two halves as the mark beside it, put back together at exactly the same size.

## Use it

| Need                                      | Use                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Logo in the interface (header, footer)    | `<Logo />` on light, `<Logo tone="dark" />` on midnight                  |
| App-icon tile                             | `<LogoMark className="size-8" />` (self-contained on light and dark)     |
| Bare symbol in the current text colour    | `<LogoSymbol />`, or `<LogoSymbol accent />` for a crimson copy          |
| Wordmark that fills its container's width | `<LogoWordmark />` (for example the giant footer wordmark)               |
| Browser tab                               | `apps/web/public/favicon.svg`, redrawn on a 16 px grid                   |
| iOS home screen                           | `apps/web/public/apple-touch-icon.png`, 180 × 180, full bleed            |
| Files for documents and slides            | `apps/web/public/brand/` (`similo-logo.svg`, `similo-logo-white.svg`, …) |

All components live in `apps/web/src/components/ui/Logo.tsx` and share one set of path data.
The SVGs are decorative (`aria-hidden`); `Logo` carries a screen-reader label, "Similo". If
`LogoWordmark` is ever the only place the name appears, add visible or `sr-only` text next to it.

In running text, write **Similo** with a capital S. The logo itself is always lowercase.

**Footer wordmark.** To keep today's faded look, use
`<LogoWordmark className="text-ink/[0.11] mask-fade-b" />`. `mask-fade-b` already exists in
`index.css`.

## The idea

- **The name.** "Similo" comes from "similar". It also echoes Latin: _similō_ is a Late Latin form
  of _simulō_, "to make like, imitate, copy; to feign, pretend", from _similis_, "like"
  ([similo](https://en.wiktionary.org/wiki/similo), [simulo](https://en.wiktionary.org/wiki/simulo)).
  Read as a Latin verb, the name says "I imitate", which is exactly what Similo catches.
- **The sign.** In geometry, "∼" means "is similar to", as in △ABC ∼ △A′B′C′
  ([Similarity](<https://en.wikipedia.org/wiki/Similarity_(geometry)>),
  [Tilde](https://en.wikipedia.org/wiki/Tilde)). Everyone else reads it as "about the same".
  Either way the meaning holds.
- **The making.** The mark isn't a wave someone drew. It is our own letter, cut and moved, so the
  symbol and the wordmark are one design, not two.
- **The colour.** Crimson means "pay attention" in the design system. In the mark it lands only
  on the copy.

## What great marks have in common (research)

| Principle                               | Source                                                                                                                                                                                                                                                                                                                                                        | How Similo applies it                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Simple enough to last                   | Sagi Haviv: "For a logo to work — and work for a long time — it must be simple." ([Logo Design Love](https://www.logodesignlove.com/sagi-haviv-interview))                                                                                                                                                                                                    | Two pieces, two colours, one idea.                                                                                     |
| Simple, but with a hook                 | Haviv: "It has to be unusual in some way, even awkward sometimes, in order to 'hook' the viewer and persist in the mind." ([Print](https://www.printmag.com/branding-identity-design/marks-men-an-interview-with-ivan-chermayeff-tom-geismar-and-sagi-haviv-of-chermayeff-geisma/))                                                                           | A letter that is visibly cut and moved.                                                                                |
| A logo identifies, it doesn't describe  | Paul Rand: "A logo doesn't sell (directly), it identifies"; it "derives its meaning from the quality of the thing it symbolizes" ([Logos, Flags, and Escutcheons](https://paulrand.design/writing/articles/1991-logos-flags-and-escutcheons.html))                                                                                                            | No shields, eyes or magnifiers. The mark names a relation (similar), not a feature.                                    |
| Works in one colour and at tiny sizes   | Rand lists being "reproducible in one color and in exceedingly small sizes" among a logo's tests (same essay)                                                                                                                                                                                                                                                 | The idea is in the shape, so the one-colour ∼ still reads. A pixel-fitted favicon for 16 px.                           |
| Distil until the symbol can stand alone | Pentagram's Mastercard: two circles, then no name at all. Bierut: "increasingly, we communicate not through words but through icons and symbols." ([Dezeen](https://www.dezeen.com/2019/01/10/mastercard-rebrand-pentagram-design/))                                                                                                                          | The tile works alone in tabs, on the CTA panel and as an app icon.                                                     |
| Anyone can draw it                      | DesignStudio's goal for Airbnb's Bélo: "a marque anyone could draw" ([designboom](https://www.designboom.com/?p=200943))                                                                                                                                                                                                                                      | Draw an o, cut it, slide half. Done.                                                                                   |
| Grow the symbol out of the wordmark     | Stripe's newer symbol comes from the i-dot of its wordmark ([Design Compass](https://designcompass.org/en/2025/09/25/extremely-minimal-new-symbol-of-stripe/)). Vercel and Linear keep the symbol for tight spaces and lead with the full logo ([Vercel](https://vercel.com/geist/brands), [Linear](https://linear.app/brand))                                | The ∼ is the wordmark's own o. `Logo` stays the default; `LogoMark` is for tight spaces.                               |
| Trust the eye, not the ruler            | Round letters overshoot flat ones by about 1–3% ([Overshoot](<https://en.wikipedia.org/wiki/Overshoot_(typography)>)). Tobias Frere-Jones: "we read with our eyes, not with rulers, so the eye should win every time." ([Slate](https://www.slate.com/blogs/the_eye/2015/04/09/tobias_frere_jones_explains_the_optical_illusion_that_tricks_our_brains.html)) | Geist's o keeps its overshoot (−12 / 546 against 0 / 534) and its thinner horizontals (104 vs 133 units) inside the ∼. |
| Space by the counters                   | "Counterspace equals letterspace"; "a design decision in service of better spacing is a good decision" ([OH no Type](https://ohnotype.co/blog/spacing-blenny))                                                                                                                                                                                                | Tracking −22/1000 em puts stem gaps at about 0.63× the m's counters; the si and lo pairs are tuned by eye.             |
| Build small icons on a grid             | "The skeleton of every icon set is its underlying grid system." ([Font Awesome](https://docs.fontawesome.com/web/add-icons/upload-icons/icon-design))                                                                                                                                                                                                         | The tile is a 32-unit grid with the ∼'s extremes on whole pixels; the favicon is redrawn on a 16 grid.                 |

## Name clash and competitor check

- **Similo, the card game** (Horrible Games S.r.l., US word mark SIMILO, serial 79319807,
  [Justia](https://trademarks.justia.com/793/19/similo-79319807.html)). Its box logo is a chunky,
  condensed, all-caps "SiMiLO" with two lowercase i's, letters alternating gold and red, a white
  keyline and a drop shadow ([box photo](https://horribleguild.com/wp-content/uploads/2022/09/HG_WEB_Essen2022_Photo-SIMBG.jpg)).
  Ours is lowercase, flat and one colour, with no red letters, no i-dot emphasis, no outline or
  shadow, plus a separate abstract mark. A red i-dot concept was rejected partly for this reason.
  Design can't settle a shared name, though. Get legal advice before using "Similo" commercially.
- **Competitors.** Corsearch: a white "C" in a crimson-to-navy gradient tile. BrandShield: a mint
  shield with a "B". Red Points: a black six-armed asterisk. Bolster: a navy arch. Doppel: a lime
  circle split in two around a diamond. MarkMonitor: blue peaks. Netcraft: a teal "N". Similo
  avoids letters in tiles, shields, gradients, split circles and asterisks. The nearest overlap is
  Corsearch's crimson and navy, so our tile is flat navy and holds a symbol, not a letter.

## Concepts explored

Every concept was judged at 16, 24, 32, 64, 128 and 256 px on white, paper and midnight, in one
colour, and as a lockup. Small sizes were rendered at 1× so 16 px meant 16 real pixels.

| Concept                                                                           | Verdict                                                                                                                                                      |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A · Seam (rn ≈ m).** The m is secretly an r + n, the classic `acrne.com` trick. | Best joke, worst legibility. Once the seam is visible the name reads "sirnilo", and the tile reads "rn". A logo must never make its own name harder to read. |
| **B · Odd tittle.** One i-dot is a round crimson impostor.                        | The most common wordmark trope. It echoes the card game's red lowercase i's and Red Points' name, and the "ii" tile reads as a pause button.                 |
| **C · Similar-to.** A geometric ∼ from two half-rings.                            | Right meaning and clean at 16 px, but generic: a wave anyone could draw. The idea survived and the form was rebuilt as H.                                    |
| **D · Odd one out.** Nine squares, one turned.                                    | Reads as a keypad or app grid and turns to noise below 32 px. The diamond tittle drifts towards Stripe.                                                      |
| **E · Self-similar S.** An S as a stroke and its rotated copy.                    | A letter in a tile (Corsearch's genre). The "copy" exists only in colour, so the idea vanishes in one colour.                                                |
| **F · Mis-registered twin.** A copy printed slightly off.                         | Reads as a retro drop shadow or a glitch. It echoes the game's shadowed lettering, and a doubled S is a risky shape.                                         |
| **G · Spell-check squiggle.** The red "this word is wrong" underline.             | Instantly understood but literal, more illustration than mark. The zigzag is noise at small sizes.                                                           |
| **H · The o, split (chosen).**                                                    | Meaning (∼), craft (Geist's own curves and overshoot) and system (the wordmark contains the mark) from one shape.                                            |

Also tried on the way to H: a heavier geometric ∼ (counters too small, clunky when large); Geist's
"s" laid on its side (reads as "co", "69" or a chain link); a reversed ∽ (looks like a tick); the two
i-dots joined into one ∼ over the "m" (reads as a moustache, or as an accent: "simĩlo"); a hairline
cut through the wordmark's o (looks like a defect). The brief's "final o as a lens" seed was not
drawn, because a lens over a word collapses into the magnifying-glass cliché.

## Construction

**Wordmark.** Outlines of Geist at weight 600, tracking −22/1000 em, pair adjustments si +4 and lo
+8. Letterforms are otherwise Geist's, including its square i-dots and the tail of the l.

**Symbol.** Geist 600's o is 525 × 558 units (sides 133, top and bottom 104, overshoot 12).

1. Cut it along its equator (y = 267). This gives two halves that are exact copies of each other.
2. Slide the bottom half right by 392 units, from its outer left edge to the original's inner
   right edge, so its left end lands exactly on the original's right end.
3. The result is 917 × 558 units: ∼.

**Tile.** 32 × 32 units with a corner radius of 8.5. The symbol is scaled by 7/279, so it measures
23 × 14 units and sits between x 4.5 and 27.5. Its flat end cuts lie on the centre line (y = 16),
the top of the original on y = 9, and the bottom of the copy on y = 23. All three are whole pixels
at 32 px.

**Lockup.** The wordmark is set at the symbol's own scale (font size 1000 × 7/279 = 25.09 units),
9.5 units after the tile. The o's equator sits on y = 16, so the o spans y 9 to 23, exactly like the
∼. The lockup is 109.4 × 32 units.

**Favicon.** It is redrawn, not scaled. Half-ellipses (outer 3.5 × 3, inner 1.5 × 1) on a 16 grid
with 2 px strokes put every edge and end cut on whole pixels at 16 and 32 px. The scaled master is
too faint at 16 px.

**Optical notes.**

- Overshoot and the thinner horizontals come from Geist's o, so the ∼ looks drawn, not compass-made.
- The copy is identical to the original. No weight compensation, because the story is that they
  are the same.

## Clear space and minimum sizes

- **Clear space.** Keep **c** (the height of the ∼, 14 units or 0.44 × the tile) clear on every side
  of the lockup and of the tile.
- **Minimum sizes.**
  - Lockup: 24 px tile height, about 82 px wide (20 mm wide in print).
  - Tile: 16 px. Below 24 px use the `favicon.svg` drawing.
  - Wordmark alone: 56 px wide.

## Colour

| Part                  | Colour                   | Contrast                         |
| --------------------- | ------------------------ | -------------------------------- |
| Tile                  | Midnight `#0B1020`       | 18.9:1 on white                  |
| Original half         | White `#FFFFFF`          | 18.9:1 on the tile               |
| Copy half             | Crimson `#D92F48`        | 4.0:1 on the tile (≥ 3:1)        |
| Wordmark on light     | Ink `#111827`            | 17.7:1 on white, 16.6:1 on paper |
| Wordmark on dark      | White                    | 18.9:1 on midnight               |
| Tile edge on midnight | White at 15% (1 px ring) |                                  |

- **One colour:** all Ink or all White, or a knocked-out tile (the ∼ cut out of a solid tile).
- **No other colours.** Coral is for small accents on dark surfaces, not for the logo.
- **No purple or violet.**

## Do and don't

**Do**

- Use the components or the files in `/public/brand`.
- Keep the copy crimson and the original white.
- Use the tile on photos and busy backgrounds.
- Use `tone="dark"` on midnight.
- Respect clear space and minimum sizes.

**Don't**

- Swap the colours.
- Rotate or tilt the mark. That is what the lookalikes do; the home page's "Found" tile does it on
  purpose to show one.
- Stretch or redraw the proportions.
- Add shadows, outlines, gradients or new tile colours.
- Re-type the wordmark in a font, or capitalise it.
- Separate the two halves.
- Use the ∼ as a decorative wave pattern.

## Geist and the font licence

The letterforms start from **Geist**, © The Geist Project Authors, licensed under the **SIL Open
Font License 1.1** (`node_modules/@fontsource-variable/geist/LICENSE`).

The OFL FAQ is explicit ([OFL FAQ](https://openfontlicense.org/ofl-faq/)):

- **Q1.1**, on using the fonts "to create logos or other graphics": "Yes. You are very welcome to
  do so."
- **Q1.1.1**: the artwork is not restricted by the licence, and "you remain the author and
  copyright holder of that newly derived graphic".

The logo ships as outlines, never as a font file.

## How it was made

1. Geist outlines were read from `geist-latin-wght-normal.woff2` with fontTools, instantiating the
   variable font at weight 600.
2. Cuts and unions were made with skia-pathops, the boolean engine fontTools uses.
3. Every round was rendered with Playwright and Edge at 1× and judged against the principles above.
   Pixel proofs used nearest-neighbour zooms.

The scripts lived in a scratch folder, not in this repository.
