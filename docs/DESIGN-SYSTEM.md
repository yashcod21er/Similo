# Similo design system v6: "Spot the difference"

The public website's visual language. It carries one ownable concept through every section: **a
forensic evidence room**. Similo's job is to compare an original with a copy and keep the
evidence, so the site is built from exhibits, specimen labels and figure numbers, not from the
usual SaaS parts.

History, in one paragraph: v1 copied the brand-protection template and decorated it (glows,
orbiting badges, fake terminals). v3 ("Calm") was credible but plain. v4 added a signature visual,
product scenes and a light/dark rhythm. v5 added award-style motion (3D ∼, intro, kinetic type).
v6 (this document) was prompted by a study of about 40 featured sites (landing.love, minimal.gallery,
siteinspire, darkmodedesign, onepagelove): the sites that win have **one idea carried through
everything**, a **different kind of picture in every section**, **colour used as area**, tight
display type with mono microtype, hairline scaffolding, and calm, expensive motion.

## Principles

1. **One concept, everywhere.** "Spot the difference": EXHIBIT A (your page) and EXHIBIT B (the
   copy), FIG. numbers, case labels, corner brackets, registration marks, a loupe, an ink stamp.
   It must feel crafted and editorial, never like a police or terminal gimmick.
2. **A different kind of picture in every section.** Compare slider, letter swap, ink stamp,
   isometric stack, loupe, odometer number, the 3D ∼, the globe, one product UI scene at most per
   page. Never the same dark app window twice.
3. **One idea per screen.** A mono label, a headline of two lines, one sentence. Technical detail
   ("Under the hood") folds into a small mono note.
4. **Colour as area.** Cream, white and night bands in rhythm, and **one full-bleed burnt-orange
   band per page**.
5. **Motion explains or reveals, and is quiet.** Expo easing, 700-900 ms entrances, a different
   entrance per element type. Every effect switches off with reduced motion.
6. **Plain words first.** A heading must make sense to someone who has never heard of RDAP or OCR.
7. **Honest by construction.** No invented customers, logos, testimonials, ratings, statistics,
   accuracy figures or certifications. Sample data says so, once, as a small mono `FIG.` caption
   (`FigCaption`). Proof comes from cited public research (`ResearchProof`), the open "how we
   score" explanation and the live brand checker.

## Never

Glows, haze, neon, blue or purple gradients (the palette has no purple, violet, indigo or
fuchsia), orange glow under buttons, brown radial haze, a custom cursor (the native cursor stays),
dot or grid textures used as decoration, orbiting badges, ping or pulse decoration (the live status
dot is the one exception), logo marquees, auto-typing "terminals", invented metrics, the serif
italic phrase more than once per page, real companies in product scenes, stock photos in heroes,
and the same dark app window repeated.

## Palette (`frontend/src/styles/index.css`)

| Token                     | Hex                   | Use                                                                  |
| ------------------------- | --------------------- | -------------------------------------------------------------------- |
| `cream`                   | `#f6f0e6`             | Page canvas (light bands); `body` background                         |
| `cream-deep`              | `#eae1d3`             | Quiet fills: chips, tracks, back sheets, image placeholders          |
| `white`                   | `#ffffff`             | Cards and white bands on cream                                       |
| `ink`                     | `#15130f`             | Text on light (16.4:1 on cream)                                      |
| `muted`                   | `#5e564c`             | Secondary text and mono labels on light (6.3:1 on cream)             |
| `night`                   | `#12110f`             | Dark bands, heroes, product windows                                  |
| `night-raised`            | `#24211d`             | Raised surfaces on dark (cards, title bars) and the footer           |
| `accent`                  | `#c2500a`             | Burnt orange: primary buttons (white text 4.7:1), the orange band    |
| `accent-ink`              | `#9e3f00`             | Small orange text on cream (5.8:1); primary button hover             |
| `accent-soft`             | `#ee8a45`             | Orange text and lines on dark (6.9:1 on night)                       |
| `line` / `line-strong`    | `#e0d6c6` / `#c9bba5` | Hairlines on light / borders that must stay visible (inputs)         |
| purple, violet, indigo, … | removed               | The palettes are deleted from the theme, so the classes do not exist |

- **On dark:** `text-cream`; body text at least `text-cream/70`, small captions and mono labels at
  least `text-cream/65`. Orange text on dark is `text-accent-soft`, never `text-accent`.
- **On the orange band** (`bg-accent`): **white** text at any size (4.7:1). Cream on `#c2500a` is
  only 4.1:1, so cream is allowed for text of **24 px and up** only. Never `ink` or `muted` text on
  orange. Primary buttons vanish on orange: use the `dark` or `light` button variants there.
- **Gradients** only inside the palette and for one element: night to night-raised for a surface,
  accent to accent-soft for a score bar.

## Type

Geist for UI and headings, Geist Mono for microtype, data and domains, Instrument Serif as a
deliberate display voice.

### Scale (utilities in `index.css`, each pairs size, leading and tracking)

| Utility             | Size (fluid) | Leading | Tracking | Use                                    |
| ------------------- | ------------ | ------- | -------- | -------------------------------------- |
| `text-giant`        | 25.6 vw      | 0.84    | -0.07em  | One word edge to edge (home hero)      |
| `text-mega`         | 52-120 px    | 0.95    | -0.05em  | Home hero headline                     |
| `text-statement-xl` | 36-76 px     | 1.04    | -0.04em  | Full-width statements that light up    |
| `text-display`      | 44-80 px     | 1.0     | -0.045em | Inner-page `h1`                        |
| `text-statement`    | 36-64 px     | 1.02    | -0.04em  | Big statements on dark or orange bands |
| `text-headline`     | 32-56 px     | 1.04    | -0.04em  | Section titles                         |
| `text-title`        | 20-24 px     | 1.2     | -0.025em | Card titles                            |
| `text-lead`         | 17-19 px     | 1.55    | -0.005em | The one sentence under a headline      |
| `text-micro`        | 11 px mono   | 1.35    | +0.12em  | Labels, numbers, captions (uppercase)  |

Tokens: `--tracking-display` (-0.045em), `--tracking-headline` (-0.04em), `--leading-display` (1).
Display text is **tight** (tracking -0.04 to -0.05em, leading about 1) and the gap between steps is
big: a headline is three times body text, a display line five times. Add the weight
(`font-semibold`) where you use a utility. Body copy stays at 16 px.

### Mono microtype

`text-micro` (Geist Mono 11 px, medium, uppercase, 0.12em tracking) is for **labels, numbers and
captions**: eyebrows, step numbers ("STEP 01"), figure captions, plate lines, the "Under the hood"
note, buttons' shortcut chips, the footer's small print. Use `MonoLabel` (below) when you want the
tone-aware colour.

### Serif voice (Instrument Serif), always opt-in

Regular 400 and italic are both loaded. **Nothing is serif automatically any more.** An `<em>` in
a heading is plain upright text unless the heading opts in:

- `serif-em-accent`: the `<em>` is serif italic **in burnt orange** (accent-ink on light,
  accent-soft on night, inherited on the orange band). Use it **at most once per page** (home: the
  hero line; inner pages: the `PageHero` title).
- `serif-em`: the `<em>` is serif italic and keeps the heading's colour.
- `serif-display`: the element itself is Instrument Serif regular, upright (for a giant statement,
  as in the home page's orange band).

### Eyebrow

`Eyebrow` is a mono microtype label with a short rule in front: orange-ink on light, accent-soft on
night, white on the orange band (`tone="light" | "dark" | "orange"`).

## The specimen language (`components/ui/specimen.tsx`)

Small decorative or caption pieces that make the site read as an evidence room. All of it ignores
the pointer; nothing here animates. `tone` is `'light' | 'dark' | 'orange'` (`Exhibit` takes
`'light' | 'dark'`). Colour defaults come from the tone; a `text-*` colour class in `className`
replaces it, and an `inset-*` class replaces the default `inset-0` (`cn` only joins class names, it
does not resolve conflicts).

| Piece                                            | What it is                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `MonoLabel({ children, tone?, className? })`     | Mono uppercase microtype in the tone colour                                                             |
| `CornerBrackets({ tone?, className? })`          | Four 12 px L-marks inside a `relative` parent. `className="-inset-2"` hangs them just outside a visual  |
| `RegMarks({ tone?, className? })`                | `+` registration crosshairs centred on the four corners of the parent (it must not clip overflow)       |
| `Exhibit({ label, caption?, tone?, className })` | A framed specimen: an orange tick and mono label top-left ("EXHIBIT A"), brackets, a mono caption below |
| `FigCaption({ index, children, tone?, as? })`    | "FIG. 01 — …" mono caption. The one discreet "sample data" note a scene needs                           |

```tsx
<Exhibit label="Exhibit B" caption="The copy: acrne.com">
  <AcmeSheet variant="copy" />
</Exhibit>
<FigCaption index="02">Sample data, not live</FigCaption>
```

### Hairline scaffold

`Section scaffold` draws 1 px column lines half-way between the page edge and the content, and `+`
registration marks at the band's four corners (on `cream`, `white`, `night` and `orange`, each in its
own tone). The home page's `Band` (`pages/home/band.tsx`) does the same with its own markup plus a
"plate line" (a hairline with `+` marks, "FIG. 03 — title"). Dashed hairlines
(`border-dashed border-line-strong`) divide a card from its footer note.

## Rhythm

Every long page: a hero (cream for the home, night or cream on inner pages) → cream → white → night
(a scroll story or product moment) → cream → … → **one orange band** → closing night band → the dark
footer sheet. Never two bands of the same weight in a row without a change of tone or layout.

The home page is ten numbered plates:

| Band   | Plate  | Section                                                          | File                                 |
| ------ | ------ | ---------------------------------------------------------------- | ------------------------------------ |
| cream  | FIG 01 | Hero: the 3D ∼ in front of the giant word "copycats"             | `pages/home/HomeHero.tsx`            |
| white  | FIG 02 | Spot the difference: drag between your sign-in page and its copy | `SpotSection.tsx`                    |
| night  | FIG 03 | One letter is enough: `acme.com` becomes `acrne.com`             | `LetterSection.tsx`                  |
| cream  | FIG 04 | The live brand checker (`#check`)                                | `CheckerSection.tsx`                 |
| night  | FIG 05 | How it works: pinned, scroll-scrubbed, a new picture per step    | `HowSection.tsx`                     |
| white  | FIG 06 | What Similo watches: an isometric stack of sources               | `WatchSection.tsx`                   |
| cream  | FIG 07 | Wherever they appear: the globe as an ink engraving              | `GlobeSection.tsx`                   |
| night  | -      | The problem in numbers: cited public research                    | `components/marketing/ResearchProof` |
| orange | FIG 08 | The one flood band: "The difference is the evidence."            | `FloodSection.tsx`                   |
| cream  | FIG 09 | Questions                                                        | `HomeFaq.tsx`                        |
| night  | FIG 10 | The close, then the footer                                       | `ClosingSection.tsx`                 |

## Imagery: one treatment

Every photograph is a **tritone in the brand colours with film grain**: night for shadows, burnt
orange for mid tones, cream for highlights. It is done in the browser by two SVG filters
(`components/marketing/PhotoFilters.tsx`, rendered once by `SiteLayout`), so photos stay one `<img>`
and the originals are untouched.

- `Photo` and `PhotoFrame` take `treatment: 'duotone' | 'halftone' | 'none'`.
- **`PhotoFrame` (marketing pages) defaults to `duotone`.** `halftone` is the same with a printed
  dot screen (a 4 px mask; the frame's night shows between the dots). `none` keeps the photo plain.
- **`Photo` (the bare image) defaults to `none`**, so a real product screenshot (the dashboard
  picture on the Platform page) is never recoloured by accident. Pass `treatment="duotone"` when a
  bare `Photo` is a people photo.
- `PhotoFrame reveal` uncovers the photo with a clip-path wipe when it scrolls into view.
- Photos only where people matter (Who it is for, About, Contact, Resources covers), never in a hero.
  Sources and credits: [IMAGE-CREDITS.md](./IMAGE-CREDITS.md). Avoid hooded hackers, padlocks,
  binary code, glowing globes, robots, readable logos, real websites on screens, children.
  Describe the photo in `alt`.

## Motion

### Tokens (`components/motion/easing.ts`, mirrored as CSS variables)

| Token                               | Value                          | Use                                        |
| ----------------------------------- | ------------------------------ | ------------------------------------------ |
| `EASE_OUT_EXPO` / `--ease-out-expo` | `cubic-bezier(.16, 1, .3, 1)`  | Entrances: fast start, very long settle    |
| `EASE_SHEET` / `--ease-sheet`       | `cubic-bezier(.32, .72, 0, 1)` | Sheets, drawers, the footer lift           |
| `ENTRANCE_DURATION`                 | 0.85 s                         | Default entrance                           |
| `ENTRANCE_STAGGER`                  | 0.07 s                         | Gap between siblings that enter one by one |

`EASE_OUT_EXPO_CSS` and `EASE_SHEET_CSS` are the same curves as strings. The CSS variables also give
the Tailwind utilities `ease-out-expo` and `ease-sheet`.

### Rules

- Entrances 700-900 ms on the expo curve, 60-80 ms stagger. **Hover and press 150-200 ms**, plain
  ease-out. Buttons nudge down 1 px when pressed.
- **A different entrance per element type:** `rise` for text and cards, `blur` (blur to sharp) for
  headlines, `wipe` (clip-path) for images, a number roll for stats (`NumberRoll`), a slam for
  stamps (`StampSlam`).
- Animate `transform`, `opacity` and, where noted, `filter` (blur) and `clip-path` (the wipe).
- Every animation respects `prefers-reduced-motion`: the finished state shows at once, loops stop,
  the canvas draws one still frame. `Reveal`, `RevealGroup`, `RevealItem` and `SplitReveal` render
  plain elements with reduced motion. `MotionConfig reducedMotion="user"` covers `motion/react`.
- Anything that loops pauses off-screen and in a hidden tab. **One WebGL scene animates at a time**
  (the hero's GlassMark and the globe both pause off-screen).

### `Reveal`, `RevealGroup`, `RevealItem` (`components/ui/Reveal.tsx`)

```tsx
<Reveal>…</Reveal>                       // fade and rise (default)
<Reveal variant="blur">…</Reveal>        // blur to sharp: headlines and big statements
<Reveal variant="wipe" wipeFrom="left">…</Reveal>   // clip-path wipe: images; 'bottom' | 'left' | 'top'
<RevealGroup><RevealItem>…</RevealItem>…</RevealGroup>   // siblings, 70 ms apart
```

The wipe ends on a clip that reaches 48 px past the box, so a shadow or brackets outside the image
are not cut off. `SplitReveal` (words slide up out of a mask) takes `blur` for blur-to-sharp words.

## Site-wide layer (`components/site/SiteLayout.tsx`, public site only, never in `/app`)

| Piece         | File                                | Behaviour                                                                                                                                                                                                                                         |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intro         | `site/Preloader.tsx`                | First visit per tab session, never with reduced motion. Night screen, counter 00 to 100, the ∼ splits into its halves, the curtain lifts on a thin orange edge. 1.0 s in total; the page is rendered underneath and the intro is `aria-hidden`.   |
| Page curtain  | `site/PageTransition.tsx`           | Following a link to another public page: a night curtain with an orange edge sweeps up (0.24 s), the page changes underneath, the curtain sweeps away (0.3 s). History, hash links and scroll restoration are untouched. Off with reduced motion. |
| Smooth scroll | `motion/scroll.tsx` (Lenis)         | Smooth wheel scrolling, off with reduced motion.                                                                                                                                                                                                  |
| Film grain    | `.film-grain` in `styles/index.css` | A fixed SVG-noise layer at 4.5 % opacity, `pointer-events: none`; only its transform moves, 5 steps a second. Static with reduced motion.                                                                                                         |
| Photo filters | `marketing/PhotoFilters.tsx`        | Hidden SVG `<defs>` for the photo treatment (above).                                                                                                                                                                                              |
| Footer sheet  | `site/SiteFooter.tsx`               | See below.                                                                                                                                                                                                                                        |

There is **no custom cursor** (none of the 17 sites studied hides or replaces the native one).
`data-cursor` attributes still found on a few cards are harmless leftovers.

### Footer as a sheet

The page (`<main>`) has rounded bottom corners (1.5 rem, 2.5 rem on large screens), a long soft shadow
and `overflow-clip` (unlike `overflow-hidden` it keeps sticky and pinned sections working). Under it
waits the dark footer (`night-raised`, so the sheet's edge reads even when the last band is night)
with its giant wordmark.

- **Wide, tall, motion allowed** (at least 1024 px wide, footer not taller than the window, no
  reduced motion): the footer is `sticky bottom-0` behind the page. Scrolling to the end lifts the
  sheet and uncovers the footer from the bottom up; the wordmark rises out of its mask and warms from
  a dark tone to cream as the sheet lifts (the footer's `--reveal` variable, 0 to 1, set while
  scrolling).
- **Phones, short windows, reduced motion:** an ordinary footer that tucks 32 px under the same
  rounded corners. On phones the wordmark still rises with the scroll; with reduced motion it is
  simply there.
- A footer link that takes keyboard focus while the footer is still covered scrolls the page to the
  end, so focus is never invisible.
- **QA tip:** a `fullPage` Playwright screenshot of a page in sticky mode shows an empty footer slot.
  Take a viewport screenshot after scrolling to the end, or use reduced motion for full-page shots.

### Header (`site/SiteHeader.tsx`)

Sticky. At the top of a page it takes the colour of the first band (night over a dark hero, cream or
white over a light one; over a burnt-orange first band it stays cream, because dark text on orange is
under 3:1); once scrolled it is a solid cream bar with a 10 % ink hairline (no blur). The active link
has a 1 px orange marker under it. Menu labels, the search shortcut chip and the mobile menu
group titles are mono microtype. Panels are crisp: `rounded-xl`, a 10 % ink ring, no glow.

## Shared building blocks

### Marketing (`components/marketing/sections.tsx`)

- **`Section({ tone?, scaffold?, id?, className? })`**: a band, padding `py-20 lg:py-32`. `tone` is
  `cream` (`light`), `white`, `night` (`dark`) or `orange`. `scaffold` adds the hairline column
  lines and `+` marks. The orange band has `bg-accent text-white`.
- **`SplitHero`**: inner-page hero (night with the calm wave by default, `tone="light"` for cream).
  Its `h1` is `text-display` and carries `serif-em-accent`, so an `<em>` in the title is the page's
  one serif italic phrase. Put a scene or exhibit in `visual`, never a photo.
- **`CtaBand({ tone?: 'night' | 'orange', serifAccent? })`**: the closing call to action. `night`
  (default) has the calm wave; `orange` is the page's orange band (white text, a dark primary button
  and a light secondary one). An `<em>` is plain unless `serifAccent` is set.
- **`ProcessSteps`** (numbered "STEP 01" steps with hairlines), **`FeatureCard`** (an icon tile, a
  title, a description and an optional dashed footer note).
- **`ResearchProof`**: a night band of four cited public figures with mono "FIG." labels; data in
  `content/research.ts`. Place it between light bands.
- **`PhotoFrame`**, **`PhotoFilters`**: see Imagery.

### UI (`components/ui/`)

- **`Button`, `ButtonLink`, `buttonClasses`**: flat pills, **no glow and no coloured shadow**. `primary`
  (burnt orange, white text) once per screen; `outline` on light, `outline-dark` on night; `dark`,
  `light`, `ghost`. Hover 150 ms.
- **`SpotlightCard`**: the standard card (white, a crisp hairline, `shadow-card`). On hover it lifts
  2 px, the hairline darkens and four orange corner brackets appear. No pointer glow. With reduced
  motion only the colour changes.
- **`Container`, `Eyebrow`, `SectionHeading`, `Pill`, `Stage`, `ExampleTag`** (`layout.tsx`): `tone`
  accepts `orange` where text sits on the orange band. `SectionHeading` (`align="left" | "center" |
"split"`) animates its title with `SplitReveal`. `ExampleTag` is mono microtype; prefer a
  `FigCaption` for the single sample-data note of a scene.
- **`Accordion`**, **`Dialog`**, form pieces: unchanged.
- **Radii and shadows:** cards and windows `rounded-2xl`, big tools `rounded-[1.75rem]`, buttons and
  chips `rounded-full`, small marks `rounded-sm`. Shadows: `shadow-card`, `shadow-window` (light),
  `shadow-window-dark` (dark). One layer of depth per visual.

### Scenes (`components/scenes/`): a different kind of picture each

Import from `@/components/scenes`. Every scene shows its finished state with reduced motion, works at
390 px and is keyboard accessible where it is interactive.

| Scene                                                           | What it is                                                                                                                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CompareSlider({ original, copy, originalLabel?, copyLabel? })` | Tracing-paper reveal. Drag (pointer, touch, arrow keys; `role="slider"`, `aria-valuenow`) to wipe between EXHIBIT A and B; orange outlines ring the differences |
| `LetterSwap({ from, to })`                                      | `acme.com` becomes `acrne.com`: the changed letters roll out and in when scrolled into view. Reads as the final state                                           |
| `StampSlam({ text, detail? })`                                  | An ink stamp that slams in (scale, tilt, a small shake, a ring of wet ink); three palette inks                                                                  |
| `IsometricStack({ layers: { label, detail? }[] })`              | A CSS-3D stack of sheets with dotted leaders and mono labels. Hover, focus or tap a label to lift its sheet                                                     |
| `Loupe({ children, magnified })`                                | A magnifying glass that follows a mouse (touch and keyboard: rests on the point of interest) and shows the annotated version                                    |
| `NumberRoll({ value, suffix? })`                                | An odometer. Only for real, sourced numbers                                                                                                                     |
| `AcmeSheet`, `ACME_DIFFERENCES`, `ACME_LOUPE_FOCUS`             | Ready-made sample content: the fictional brand Acme's sign-in page and a look-alike with four differences                                                       |

Exhibits built from them for the inner pages live in `components/visuals/exhibits.tsx`
(`DomainSwapExhibit`, `PageCompareExhibit`, `AppCompareExhibit`, `NameLoupeExhibit`,
`JournalLoupeExhibit`, `EvidenceStampExhibit`, `OppositionNumbers`, `PlatformStackExhibit`).

### Motion building blocks (`components/motion/`)

- **`SimilarityWave`**: flowing ribbons from the logo's idea (each original ribbon has a burnt-orange
  copy that drifts apart and back). `tone: 'dark' | 'light'`, `density?: 'calm' | 'full'`. A canvas;
  one still frame with reduced motion; paused off-screen. Behind `SplitHero`, `CtaBand` (night), the
  footer and `ResearchProof`.
- **`AppWindow`**: a frame for product scenes (`tone`, `url`, `title`). Use the fictional
  `similo.example` domain. **At most one product UI scene per page.**
- **`ScrollStory`**: pinned visual, scrolling steps, all text in the DOM, visuals of inactive steps
  `aria-hidden` and `inert`. The home "How it works" band builds its own pinned, scrubbed version
  with segmented progress bars.
- **`GlassMark`** (3D ∼, three.js, lazy) and **`DomainGlobe`**: the two WebGL scenes, each with
  `data-scene` and `data-running` for QA, a still frame with reduced motion and a 2D fallback
  without WebGL (`canUseWebGL()`).
- **`CountUp`** (real numbers only), **`useLoop`**, **`Marquee`**, **`SplitReveal`**,
  **`HorizontalScroll`**, **`HoverReveal`**, hooks (`usePrefersReducedMotion`, `usePageVisible`,
  `useInView`). Read the comment at the top of each file for its contract.

### Page kit (`pages/solutions/page-kit.tsx`)

The inner pages share `PageHero`, `SectionHead`, `StepRows`, `StepsWithScene`, `SpecimenGrid` (a
hairline table of "FIG." items instead of repeated rounded cards), `UnderTheHood` (technical detail
as a folded mono note), `OrangeBand` (the page's one orange band), `FaqBlock`, `Timeline`,
`RuledList`, `CardGrid`, `SplitSection`, `ProductFigure`, with display classes (`H1_CLASS`,
`H2_CLASS`, `H3_CLASS`) that follow the scale above.

## Product scenes (at most one per page)

High-fidelity UI built in code, never images: a look-alike domain alert, a similarity breakdown as
**separate named signals** (Name, Visual, Page content, never one unlabelled number), reasons in plain
words, evidence, and a reviewer decision. Use the fictional brand **Acme** and obviously fictional
names; one discreet mono `FIG.` caption says it is sample data. Never show real companies. A purely
visual scene's root gets `role="img"` and an `aria-label` that tells the whole story.

## Accessibility and quality checklist (every page)

- One `h1`; headings in order; landmarks come from `SiteLayout`.
- Real `button`/`a` elements with a visible focus outline (burnt orange, global).
- Text contrast AA, including mono microtype and dimmed or animated states (axe checks opacity). On
  the orange band: white text; cream only at 24 px and up.
- Decorative canvases, brackets, registration marks and drawings are `aria-hidden`; scenes have a
  text alternative.
- Nothing is hidden behind hover: touch and keyboard get the same information.
- Playwright (Edge) at 1440 x 900 and 390 x 844: no horizontal overflow, axe wcag2a/2aa clean, no
  console errors, a `prefers-reduced-motion` run, and canvases idle when off-screen.
