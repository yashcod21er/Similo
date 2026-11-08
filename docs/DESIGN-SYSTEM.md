# Similo design system v4: cream, black and burnt orange

The public website's visual language. v1 copied the usual brand-protection template and decorated
it (glows, orbiting badges, fake terminals, dot grids). v3 ("Calm") was credible but, in the
owner's words, "decent but not high level: no motion, no visuals, just a simple website".

v4 keeps v3's honesty and plain words and adds what Stripe, Linear, Vanta and Wiz have in common:
**a signature visual, the product as the star, motion that explains, a light/dark rhythm, scroll
storytelling, depth and craft, and proof**. Every visual is specific to Similo's real job: finding
look-alikes and explaining them.

## Principles

1. **The product is the star.** Heroes show a high-fidelity product scene built in code (an alert
   arriving, named signals filling, reasons appearing, a person deciding). Stock photos never go in
   a hero.
2. **Motion must explain something.** A finding arrives, a score fills, a reason appears, a step
   advances. No decoration that moves for its own sake.
3. **Plain words first.** Every heading and card makes sense to someone who has never heard of RDAP
   or OCR. Technical terms go in a secondary line ("Under the hood: ...").
4. **Rhythm, not sameness.** Full-width dark (night) bands alternate with cream and white ones;
   sections differ in weight and layout.
5. **Honest by construction.** No invented customers, logos, testimonials, statistics, accuracy
   figures or certifications. Sample data says so (`ExampleTag`, "Illustrative example"). Proof
   comes from cited public research (`ResearchProof`), the open "how we score" section and the live
   brand checker.

## Never (v1 failures that stay banned)

Glowing blobs, neon, blue or purple gradients, dot or grid textures, orbiting badges, ping or pulse
decoration (the live status dot is the one exception), marquees of logos or source names,
auto-typing "terminals", invented metrics, a serif word in every headline, real companies in
product scenes.

## Palette (`frontend/src/styles/index.css`)

| Token                     | Hex                   | Use                                                                  |
| ------------------------- | --------------------- | -------------------------------------------------------------------- |
| `cream`                   | `#f6f0e6`             | Page canvas (light bands); `body` background                         |
| `cream-deep`              | `#eae1d3`             | Quiet fills: chips, tracks, back sheets, image placeholders          |
| `white`                   | `#ffffff`             | Cards and white bands on cream                                       |
| `ink`                     | `#15130f`             | Text on light (16.4:1 on cream)                                      |
| `muted`                   | `#5e564c`             | Secondary text on light (6.3:1 on cream)                             |
| `night`                   | `#12110f`             | Dark bands, heroes, product windows, footer                          |
| `night-raised`            | `#24211d`             | Raised surfaces on dark (cards, title bars, floating panels)         |
| `accent`                  | `#c2500a`             | Burnt orange: primary buttons (white text 4.7:1), signature, icons   |
| `accent-ink`              | `#9e3f00`             | Small orange text on cream (5.8:1); primary button hover             |
| `accent-soft`             | `#ee8a45`             | Orange text and lines on dark (6.9:1 on night)                       |
| `line` / `line-strong`    | `#e0d6c6` / `#c9bba5` | Hairlines on light / borders that must stay visible (inputs)         |
| purple, violet, indigo, … | removed               | The palettes are deleted from the theme, so the classes do not exist |

- **On dark** use `text-cream`; body text at least `text-cream/70`, small captions at least
  `text-cream/65`. Orange text on dark is `text-accent-soft`, never `text-accent`.
- **Gradients** only inside the palette and only for one element: night → night-raised for a
  surface, accent → accent-soft for a score bar or the signature. Never a blue or neon gradient.

## Type

- Geist for UI and headings, Geist Mono for domains and data.
- Scale (fluid, no responsive overrides): `text-display` (hero `h1`), `text-statement` (big
  statements on dark bands and closing CTAs), `text-headline` (section titles), `text-title`
  (cards), `text-lead` (intros). Keep a wide gap between headings and body text.
- **Serif accent.** Instrument Serif italic is a deliberate editorial accent, **at most one phrase
  per band**: an `<em>` inside an `h1` is serif automatically; in an `h2` add the `serif-em` class
  to opt in (dark bands and the closing `CtaBand` only). Otherwise `<em>` in `h2`/`h3` is plain.
- **Eyebrow:** `Eyebrow` (12.5 px, medium, uppercase with open tracking, a short orange rule in
  front). Orange-ink on light, accent-soft on dark.

## Rhythm (every long page)

Dark hero (night, with the signature wave and a product scene) → cream band → white band → dark
band (scroll story or product moment) → cream → … → dark `CtaBand` → dark footer. Never two bands
of the same weight in a row without a change of tone or layout.

The home page follows it exactly:

| Band  | Section                                                           | File                                   |
| ----- | ----------------------------------------------------------------- | -------------------------------------- |
| night | Hero: wave + animated alert scene in an `AppWindow`               | `pages/home/HomeHero.tsx`, `HeroScene` |
| cream | The live brand checker (`#check`), the interactive centrepiece    | `CheckerSection`, `LookalikeChecker`   |
| night | Watch → Explain → Decide, a `ScrollStory`                         | `WorkflowStory.tsx`                    |
| white | The problem: what copycats look like                              | `ProblemSection.tsx`                   |
| night | The problem in numbers: cited public research                     | `components/marketing/ResearchProof`   |
| cream | How we score, in the open (three named signals, a person decides) | `ScoringSection.tsx`                   |
| white | Who it is for (a photo of people)                                 | `TeamsSection.tsx`                     |
| cream | Questions                                                         | `HomeFaq.tsx`                          |
| night | Closing call to action, then the dark footer                      | `CtaBand`                              |

## Depth and craft

- **Shadows** (warm, layered): `shadow-card` (cards on cream), `shadow-window` (product windows and
  big tools on light), `shadow-window-dark` (windows and floating panels on night). Older
  `shadow-soft`, `shadow-lifted`, `shadow-stage` remain for menus and dialogs.
- **Radii:** cards and windows `rounded-2xl`, big tools `rounded-[1.75rem]`, buttons and chips
  `rounded-full`.
- **Layering:** one floating card overlapping a window edge, a second sheet behind a tool
  (`LookalikeChecker`), a 1 px top highlight on dark windows. One layer of depth per visual, not
  stacks of cards.

## Motion rules

- Only `transform` and `opacity` animate (plus canvas). Durations 200–700 ms, ease-out; staggered
  reveals (≈ 45–180 ms apart).
- Every animation respects `prefers-reduced-motion`: loops stop on their finished state, the canvas
  draws one still frame, fades are removed (`motion-reduce:transition-none`,
  `motion-reduce:animate-none`). `MotionConfig reducedMotion="user"` covers `motion/react`.
- Anything that loops pauses off-screen and in a hidden tab.
- Entrance: `Reveal`, `RevealGroup`/`RevealItem` (a small fade and rise). Keyframes for product
  scenes: `animate-scene-in` (fade + 10 px rise), `animate-scene-pop` (fade + scale from 0.94).
- Hover: colour changes; cards may lift 2 px (`SpotlightCard`). Buttons nudge down 1 px when pressed.

## Shared building blocks (`frontend/src/components/motion/`)

Import from `@/components/motion` or the files. The APIs are stable; other pages depend on them.

### `SimilarityWave` — the signature

```tsx
<section className="relative isolate overflow-hidden bg-night">
  <SimilarityWave tone="dark" density="full" className="-z-10" />…
</section>
```

`tone: 'dark' | 'light'`, `density?: 'calm' | 'full'`, `className?`. A canvas of flowing ribbons
taken from the logo's idea: each original ribbon (cream on night, ink on cream) has a burnt-orange
copy that drifts slightly apart and comes back together. It fills its nearest positioned parent
(`absolute inset-0`); add a gradient overlay on the copy side so text stays calm. Use `full` in a
home-style hero, `calm` in inner heroes, CTA bands and research bands. One per band at most.
Technical: `requestAnimationFrame`, DPR capped at 2, paused off-screen (IntersectionObserver) and in
hidden tabs, one still frame with reduced motion, `aria-hidden`, redraws on resize, no layout shift.
`data-running="true|false"` on the wrapper is for visual QA.

### `AppWindow` — a frame for product scenes

```tsx
<AppWindow tone="dark" url="app.similo.example/alerts" title="Illustrative example">
  …scene…
</AppWindow>
```

`tone: 'light' | 'dark'`, `url?`, `title?`, `className?`, `children`. Title bar (three quiet dots,
an address pill, a title on the right), hairline ring, `rounded-2xl`, layered shadow. Use the
fictional `similo.example` domain. On a dark band a light window gives the strongest contrast.

### `ScrollStory` — pinned visual, scrolling steps

```tsx
<ScrollStory tone="dark" steps={[{ id, label, title, body, visual }, …]} />
```

Large screens: steps scroll on the left (the active one gets an orange rule), the visual on the
right is sticky and cross-fades to the active step (IntersectionObserver on a band across the middle
of the viewport). Phones: each step shows its own visual under its text. All text is in the DOM in
reading order; visuals of inactive steps are `aria-hidden` and `inert` (scenes can watch that
attribute to play when their step becomes active, see `pages/home/useStoryActive.ts`). Reduced
motion: no fades. It brings no section padding; put it in a `Container` on a band.

### `CountUp` — real numbers only

```tsx
<CountUp value={77} suffix="%" /> // also: decimals, prefix
```

Counts up once when it scrolls into view. The final value is always in the DOM (`sr-only`) for
screen readers and search engines; with reduced motion the final value shows at once. Only for real,
sourced figures.

### `useLoop` — loop a product scene

```tsx
const ref = useRef<HTMLDivElement>(null);
const step = useLoop(8, 1500, ref); // 0 … 7, every 1.5 s
```

Returns the current step. Pauses in a hidden tab and, when given the optional `ref`, while that
element is off-screen. With reduced motion it returns the last step (the finished scene) and never
advances. Show things with `step >= n` and keep their space reserved (opacity/transform only), so
nothing shifts.

Also exported: `usePrefersReducedMotion`, `usePageVisible`, `useInView`.

## Product scenes (the star)

High-fidelity UI built in code, never images: a look-alike domain alert (`acme-login.com`), a
similarity breakdown as **separate named signals** (Name, Visual, Page content — never one
unlabelled number), reasons in plain words, evidence (a captured page next to yours, the
registration record), and a reviewer decision ("Needs review → Approved for takedown request").
Use the fictional brand **Acme** and obviously fictional names; caption "Illustrative example".
Never show real companies. The scene's root gets `role="img"` and an `aria-label` that tells the
whole story when the scene is purely visual.

Home-scene parts live in `pages/home/scene-parts.tsx` (`Appear`, `SignalMeter`, `MiniSignIn`,
`StatusChip`); the Solutions pages use `components/visuals/`.

## Components

| Component                                          | File                                           | Notes (v4)                                                                                                                          |
| -------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `Button`, `ButtonLink`, `buttonClasses`            | `components/ui/Button.tsx`, `button-styles.ts` | Pills. `primary` (burnt orange, white text) once per screen; `outline` on light, `outline-dark` on night; `dark`, `light`, `ghost`  |
| `Container`, `Eyebrow`, `SectionHeading`, `Pill`   | `components/ui/layout.tsx`                     | `SectionHeading` `align="split"` puts the title left and the intro right                                                            |
| `Stage`, `ExampleTag`                              | `components/ui/layout.tsx`                     | A night panel for a visual on a light band; the sample-data label                                                                   |
| `Photo`, `PhotoFrame`                              | `ui/Photo.tsx`, `marketing/PhotoFrame.tsx`     | Local WebP 800/1600; frame `rounded-2xl` + `shadow-card`                                                                            |
| `SplitHero`                                        | `components/marketing/sections.tsx`            | Inner-page hero. Dark by default with the calm wave; `tone="light"` for a cream start. Put a product scene in `visual`, not a photo |
| `Section` (`light` cream / `white` / `dark` night) | `components/marketing/sections.tsx`            | Bands; padding `py-20 lg:py-32`                                                                                                     |
| `CtaBand`                                          | `components/marketing/sections.tsx`            | Closing dark band with the calm wave; `<em>` in the title is serif                                                                  |
| `ProcessSteps`, `FeatureCard`                      | `components/marketing/sections.tsx`            | Numbered steps; a card with an icon tile                                                                                            |
| `ResearchProof`                                    | `components/marketing/ResearchProof.tsx`       | Dark band of cited public figures (owned by the "frame" work; data in `content/research.ts`)                                        |
| `SpotlightCard`                                    | `components/ui/SpotlightCard.tsx`              | The standard card: white, hairline, `shadow-card`, 2 px lift on hover                                                               |
| `Accordion`                                        | `components/ui/Accordion.tsx`                  | FAQs; the open item's icon turns night                                                                                              |
| `Reveal`, `RevealGroup`/`RevealItem`               | `components/ui/Reveal.tsx`                     | Entrance fade and rise                                                                                                              |

## Photography

Photos only where people matter: Who it is for, About, Contact and Resources covers. Never in a hero.
Sources, file sizes and credits: [IMAGE-CREDITS.md](./IMAGE-CREDITS.md). Avoid hooded hackers,
padlocks, binary code, glowing globes, robots, readable logos, real websites on screens, children.
Frame with `PhotoFrame`; describe the photo in `alt`.

## Accessibility and quality checklist (every page)

- One `h1`; headings in order; landmarks come from `SiteLayout`.
- Real `button`/`a` elements with a visible focus outline (burnt orange, global).
- Text contrast AA, including dimmed or animated states (axe checks opacity).
- Decorative canvases and drawings are `aria-hidden`; product scenes have a text alternative.
- Playwright (Edge) at 1440 × 900 and 390 × 844: no horizontal overflow, axe wcag2a/2aa clean, no
  console errors, a `prefers-reduced-motion` run, and the canvas idle when off-screen.
