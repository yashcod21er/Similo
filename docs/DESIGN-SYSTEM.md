# Similo design system v3: "Calm"

The public website's visual language. v1 copied the usual brand-protection template. v2 ("Clarity")
was lighter but still read as AI-generated: glowing gradients, dot grids, orbiting badges, a serif
italic word in every headline, many animated mock-ups and a card on every idea.

v3 is a calm, credible enterprise site in the spirit of Stripe, Atlassian, Cloudflare and Vanta:
real photography of real work, generous white space, confident type, a clear grid, few but
meaningful visuals and honest copy.

## Principles

1. **Plain words first.** Every heading and card must make sense to someone who has never heard of
   RDAP or OCR. Technical terms go in a secondary line ("Under the hood: ...", "Built with: ...") or
   on the How it works page.
2. **One idea per section, one message per page.** If two sections say the same thing, delete one.
   A page has about six to eight sections, not twelve.
3. **Photos show people; the product shows itself.** Real photographs carry the mood. Product
   visuals are rare (at most one per page), flat and always labelled. Real screenshots are better
   than illustrations when the product page exists.
4. **Quiet colour.** Pages are white and paper. Crimson means "pay attention": the main call to
   action, small accents, risk. It never fills large areas or glows.
5. **Honest by construction.** No invented customers, metrics, certifications or testimonials.
   Sample data carries `ExampleTag` or a caption that says "sample data". Interactive demos say what
   they really do.

## What v3 removed (do not bring these back)

Glowing gradients, blurred blobs, dot or grid textures, radial masks, hero orbits and animated
canvases, spotlight and hover-glow cards, gradient borders, ping or pulse animations (except the live
status indicator), marquees of source names or logos, chapter numbers ("01 / 02"), mono uppercase
letter-spaced labels, a serif italic word in every headline, auto-typing terminals, and stacks of
mock UI cards.

## Tokens (`frontend/src/styles/index.css`)

| Role      | Token                                          | Notes                                            |
| --------- | ---------------------------------------------- | ------------------------------------------------ |
| Canvas    | `bg-white`, `bg-paper`                         | Alternate sections; never textures               |
| Text      | `text-ink`, `text-muted`                       | `muted` is 6.4:1 on white (AA)                   |
| Lines     | `border-line`, `border-line-strong`            | Cards use `line`; inputs use `line-strong`       |
| Signal    | `crimson`, `crimson-dark`, `coral` (on dark)   | Call to action, small accents, risk              |
| Dark band | `bg-midnight`                                  | **One per page**: the closing `CtaBand`          |
| Fills     | `bg-card`                                      | Chips, tracks, image placeholders                |
| Shadows   | `shadow-soft`, `shadow-lifted`, `shadow-stage` | Floating layers only (menus, dialogs). No cards. |
| Fonts     | `font-sans` (Geist), `font-mono` (Geist Mono)  | Mono for domains and data only                   |
| Forbidden | purple, violet, indigo, fuchsia                | Removed from the theme                           |

**Type scale** (fluid; do not add responsive overrides): `text-display` (the hero `h1`, up to
60 px), `text-headline` (section titles, up to 44 px), `text-title` (card and row titles),
`text-lead` (intro paragraphs). Body text is the default size.

**Serif accent.** `<em>` inside an `h1` renders in Instrument Serif italic; inside `h2` or `h3` it is
plain. v3 pages do not use it at all. If a hero ever needs it, use it once.

**Eyebrow** (small label above a title): `text-[13px] font-medium text-crimson-dark`, sentence case.
No numbers, no uppercase.

## Layout

- `Container` (max width 1280 px, 16 px phone gutter). Section padding `py-20 lg:py-28`
  (`Section` does this for you).
- Backgrounds alternate: hero white, then paper, white, paper, ... Finish with the one midnight
  `CtaBand`. White sections carry a hairline above and below.
- Prefer left-aligned text beside a photo: `grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16`,
  alternating sides down the page. Centre only a short section intro.
- Lists are rows separated by hairlines (`divide-y divide-line border-y border-line`) with a
  `size-5 text-crimson` icon, not grids of cards. Use a card grid only when the items are truly
  parallel (for example four product modules).
- Cards: `rounded-xl border border-line bg-white p-6`, hover only `hover:border-line-strong`.

## Components

| Component                                                  | File                                  | Use for                                                                      |
| ---------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| `Button`, `ButtonLink`                                     | `components/ui/Button.tsx`            | Flat `rounded-lg`. `primary` (crimson) once per screen; `outline` secondary  |
| `Container`, `Eyebrow`, `SectionHeading`                   | `components/ui/layout.tsx`            | Page width, small label, section intro (`index` props are accepted, ignored) |
| `Stage`                                                    | `components/ui/layout.tsx`            | A dark panel for a product visual. Rare; counts as the page's dark band      |
| `ExampleTag`                                               | `components/ui/layout.tsx`            | Required on any visual with sample data ("Illustrative example")             |
| `Photo`                                                    | `components/ui/Photo.tsx`             | The `<img>`: local WebP, `srcSet` 800/1600, lazy unless `priority`           |
| `PhotoFrame`                                               | `components/marketing/PhotoFrame.tsx` | A photo in the standard frame (`rounded-2xl`, 1 px ring), optional caption   |
| `SplitHero`                                                | `components/marketing/sections.tsx`   | Inner-page hero: text left, `PhotoFrame` or one visual right                 |
| `Section` (`tone` light / white / dark), `CtaBand`         | `components/marketing/sections.tsx`   | Bands of a page; `CtaBand` is the closing dark band                          |
| `ProcessSteps`, `FeatureCard`                              | `components/marketing/sections.tsx`   | Numbered steps with hairlines; a plain card                                  |
| `SpotlightCard`                                            | `components/ui/SpotlightCard.tsx`     | The standard card (the name is historical; there is no spotlight any more)   |
| `AlertCard`                                                | `components/visuals/AlertCard.tsx`    | One finding in plain words, with its risk level. Labelled as an example      |
| `ProductWindow` + primitives                               | `components/visuals/primitives.tsx`   | Dark product mock-ups used on the Solutions pages                            |
| `Accordion`                                                | `components/ui/Accordion.tsx`         | FAQs                                                                         |
| `Reveal`, `RevealGroup`/`RevealItem`                       | `components/ui/Reveal.tsx`            | The only entrance animation: a small fade                                    |
| `SiteHeader`, `SiteFooter`, `CommandMenu`, `navigation.ts` | `components/site/`                    | Navigation, search (Ctrl+K), live status. Links live in `navigation.ts`      |

**"Under the hood" pattern.** After a plain explanation, one quiet line:
`<p className="mt-3 text-[13px] text-muted">Under the hood: edit distance, homoglyph tables</p>`

## Page anatomy

1. **Hero:** one sentence about what this does for you, one plain paragraph, one primary action
   ("Request a demo"), one secondary action, one real photo. Nothing animates on load.
2. **The problem or the value**, in plain words, with a photo.
3. **How it helps:** three or four steps (`ProcessSteps`).
4. **Detail:** what you get, who it is for, or the checks, as rows rather than cards.
5. **FAQ:** the four to six real questions a non-expert asks.
6. **`CtaBand`** (the only midnight band).

Home order: hero, the problem, brand checker (a working tool), how it helps, what you get, who it is
for, FAQ, closing call to action.

## Photography

- **Sources:** Unsplash or Pexels only, never Unsplash+ or premium. Credit every photo in
  [IMAGE-CREDITS.md](./IMAGE-CREDITS.md).
- **Subjects:** people doing real work: a team reviewing documents, an analyst at a laptop, someone
  paying on a phone, a close look at papers on a table. Natural, diverse, not staged-looking.
- **Avoid:** hooded hackers, padlocks, binary code, glowing globes, robots, readable company
  names or logos, real websites on screens, children.
- **Files:** `frontend/public/images/<area>/<name>-800.webp` and `-1600.webp` (1600 px wide,
  quality about 78, under 220 KB; 800 px under 90 KB).
- **Frame:** `PhotoFrame`: `rounded-2xl`, 1 px `ring-ink/5`, aspect `4/3`, `3/2` or `16/9`. No heavy
  shadow, tilt, 3D, or UI laid over a photo.
- **Use:** not every section needs a photo. One per section at most, usually every second section.
  Hero photos use `priority`; everything else loads lazily. Describe the photo in `alt`; use `alt=""`
  only for purely decorative photos (the sign-in side panel).

## Motion

- Entrance: `Reveal` and `RevealGroup` only (a small fade and rise, from `@/lib/motion`).
  `MotionConfig reducedMotion="user"` removes the movement for visitors who ask for it.
- Hover: colour or border changes only. No lifts, no glow.
- Nothing loops except the live status indicator in the footer (and it stops with reduced motion).
  No marquees, typing terminals or canvases.

## Accessibility checklist (every page)

- One `h1`; headings in order; landmarks come from `SiteLayout`.
- Interactive elements are real `button`/`a` elements with visible focus (crimson outline, global).
- Text contrast is at least AA. Never put `text-muted` on `bg-card`; use `text-ink`.
- Photos have useful `alt` text. Decorative elements are `aria-hidden`.
- Works at 390 px wide with no horizontal scroll, and with reduced motion.
- Run axe (wcag2a, wcag2aa) on every page you change.
