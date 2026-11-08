# Similo design system v2 — "Clarity"

The public website's visual language. v1 followed the common brand-protection
template (dark full-bleed hero, announcement bar, logo marquee, rows of cards). v2 is
deliberately different: a calm, light, precise interface where the product itself is the
hero and every idea is shown with a concrete example.

## Principles

1. **Plain words first, detail second.** Every heading and card must make sense to someone
   who has never heard of RDAP or OCR. Technical terms may appear only as a secondary line,
   using the "Under the hood" pattern below, or on the technology page.
2. **Show, don't list.** Explain each idea with an example, such as an `AlertCard`, a
   before/after comparison or a short story, not a bullet list of capabilities.
3. **Light canvas, dark stages.** Pages are light (`paper` / white). Navy appears only
   inside framed product "stages" (`Stage`, `ProductWindow`), the closing `CtaBand` and
   menu feature cards. No full-bleed dark heroes.
4. **Crimson means "pay attention".** Use it for risk, for the single primary action on a
   screen, and for index numbers. Never for decoration over large areas.
5. **Honest by construction.** No invented customers, metrics, certifications or
   testimonials. Sample visuals carry `ExampleTag`. Interactive demos say what they really
   do (for example, "generated in your browser").

## Tokens (`apps/web/src/styles/index.css`)

| Role            | Token                                          | Notes                                          |
| --------------- | ---------------------------------------------- | ---------------------------------------------- |
| Canvas          | `bg-paper`, `bg-white`                         | Alternate sections with `Section tone`         |
| Text            | `text-ink`, `text-muted`                       | `muted` is 6.4:1 on white (AA)                 |
| Lines           | `border-line`, `border-line-strong`            | Strong for inputs and outlines                 |
| Signal          | `crimson`, `crimson-dark`, `coral` (on dark)   | Risk, primary action, indices                  |
| Stage           | `bg-midnight`, `bg-slate-deep`                 | Product visuals only                           |
| Shadows         | `shadow-soft`, `shadow-lifted`, `shadow-stage` | Navy-tinted, layered                           |
| Fonts           | `font-sans` (Geist), `font-mono` (Geist Mono)  | Mono for data, labels, domains                 |
| Accent          | `<em>` inside h1–h3 → Instrument Serif italic  | **One** emphasised word or phrase per headline |
| Purple / violet | removed from the theme                         | Brand rule                                     |

Type scale: `text-display` (home hero only), `text-headline` (section titles and inner-page
heroes), `text-title` (card and step titles), `text-lead` (intro paragraphs). They are fluid,
so don't add responsive size overrides unless a layout really needs one.

## Components

| Component                                                        | File                                | Use for                                                       |
| ---------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| `Button`, `ButtonLink`                                           | `components/ui/Button.tsx`          | Pills. `primary` (crimson) once per screen; `dark`; `outline` |
| `Container`                                                      | `components/ui/layout.tsx`          | Max width 1280 px, 16 px phone gutter                         |
| `Eyebrow` (`index="01"`)                                         | `components/ui/layout.tsx`          | Chapter marker "01 — The problem" above a heading             |
| `Pill`                                                           | `components/ui/layout.tsx`          | Small chip above a hero headline                              |
| `SectionHeading` (`index`, `align`)                              | `components/ui/layout.tsx`          | Every section intro                                           |
| `Stage`                                                          | `components/ui/layout.tsx`          | Framed dark panel holding a product visual                    |
| `ExampleTag`                                                     | `components/ui/layout.tsx`          | Required on any visual with sample data                       |
| `SpotlightCard`                                                  | `components/ui/SpotlightCard.tsx`   | Light card with a pointer spotlight (base of `FeatureCard`)   |
| `AlertCard`                                                      | `components/visuals/AlertCard.tsx`  | A finding in plain words: name, facts, risk level             |
| `ProductWindow` + primitives                                     | `components/visuals/primitives.tsx` | Detailed dark product mock-ups                                |
| `Accordion`                                                      | `components/ui/Accordion.tsx`       | FAQs                                                          |
| `Section`, `SplitHero`, `CtaBand`, `ProcessSteps`, `FeatureCard` | `components/marketing/sections.tsx` | Page scaffolding                                              |
| `Reveal`, `RevealGroup`/`RevealItem`                             | `components/ui/Reveal.tsx`          | Scroll entrance animations                                    |

**"Under the hood" pattern.** After a plain explanation, add the technical names on one quiet
line:
`<p className="font-mono text-[12px] text-muted">Under the hood: edit distance · homoglyph tables</p>`

## Page anatomy

1. **Hero:** one sentence about what this does for you, a plain one-line explanation, and one
   primary action.
2. **Problem or value:** a concrete story or example (an `AlertCard`).
3. **How it works:** 3–4 plain steps (`ProcessSteps`).
4. **Detail:** bento grid or feature cards, plain titles first.
5. **FAQ:** the 4–6 real questions a non-expert would ask.
6. **`CtaBand`.**

Number the sections with `index="01"`, `"02"` and so on, so long pages read like chapters.

## Motion

- Entrance: `Reveal` and `RevealGroup`. Shared easing comes from `@/lib/motion` (`EASE_OUT`).
- Hover: small lifts (≤ 2 px) and colour changes only. No bouncing.
- Loops (`repeat: Infinity`, canvas, SVG `animateMotion`) must stop when `useReducedMotion()`
  is true. `MotionConfig reducedMotion="user"` does **not** stop looping opacity animations.
- Never move text the visitor is trying to read faster than ~10°/s (the hero orbit takes 36 s
  per turn).

## Accessibility checklist (every page)

- One `h1`; headings in order; landmarks come from `SiteLayout`.
- Interactive elements are real `button`/`a` elements with visible focus (crimson outline,
  global).
- Text contrast is at least AA. Never put `text-muted` on `bg-card`; use `text-ink`.
- Decorative visuals are `aria-hidden`; real content inside visuals is not.
- Works at 390 px wide with no horizontal scroll, and with reduced motion.
