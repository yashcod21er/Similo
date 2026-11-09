/**
 * Motion tokens (v6). The same curves exist as CSS variables in `styles/index.css`
 * (`--ease-out-expo`, `--ease-sheet`), so CSS and `motion/react` animations feel alike.
 *
 * - `EASE_OUT_EXPO`: entrances. Fast start, very long settle. Use 700-900 ms.
 * - `EASE_SHEET`: sheets, drawers and the footer lift. Smooth start, firm stop.
 *
 * Hover and press states stay short (150-200 ms) and use a plain `ease-out`.
 */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_SHEET = [0.32, 0.72, 0, 1] as const;

/** The same curves as CSS `cubic-bezier(...)` strings, for inline styles and keyframes. */
export const EASE_OUT_EXPO_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const EASE_SHEET_CSS = 'cubic-bezier(0.32, 0.72, 0, 1)';

/** Entrance timing shared by `Reveal`, `SplitReveal` and the scenes (seconds). */
export const ENTRANCE_DURATION = 0.85;
/** Gap between siblings that enter one after another (seconds). */
export const ENTRANCE_STAGGER = 0.07;
