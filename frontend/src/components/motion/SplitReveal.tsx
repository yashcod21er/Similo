import { motion, type Variants } from 'motion/react';
import {
  cloneElement,
  Fragment,
  isValidElement,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { EASE_OUT_EXPO, ENTRANCE_STAGGER } from './easing';
import { usePrefersReducedMotion } from './hooks';
import { plainText } from './plain-text';

/*
 * Kinetic headings: each word (or letter) slides up out of a mask when the heading scrolls
 * into view. The text stays real text in the DOM, so search, copy and screen readers read it
 * normally. With `prefers-reduced-motion` nothing is split and nothing moves.
 */

type Tag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div' | 'span';

const MOTION_TAGS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
  p: motion.p,
  div: motion.div,
  span: motion.span,
} as const;

/**
 * The mask is a plain inline-block, clipped with `clip-path` rather than `overflow` so it keeps
 * the text's own baseline (an inline-block with `overflow: hidden` sits on its bottom edge,
 * which would nudge a serif word out of line). The clip reaches a little past the box on every
 * side, so descenders, tight tracking and italic overhang are never cut.
 */
const MASK = 'inline-block align-baseline [clip-path:inset(-0.12em_-0.14em_-0.16em_-0.14em)]';

const GROUP: Variants = { hidden: {}, visible: {} };

const PIECE: Variants = {
  hidden: { y: '118%' },
  visible: { y: '0%', transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
};

/** Blur-to-sharp variant: each piece also comes out of a soft blur. */
const PIECE_BLUR: Variants = {
  hidden: { y: '118%', opacity: 0, filter: 'blur(10px)' },
  visible: {
    y: '0%',
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE_OUT_EXPO },
  },
};

function countPieces(node: ReactNode, by: 'words' | 'letters'): number {
  const text = plainText(node);
  return by === 'words'
    ? text.split(/\s+/).filter(Boolean).length
    : text.replace(/\s+/g, '').length;
}

interface WalkState {
  by: 'words' | 'letters';
  blur: boolean;
  key: number;
}

/** Wrap one visible piece (a word or a letter) in a mask with a sliding inner span. */
function piece(text: string, state: WalkState): ReactNode {
  state.key += 1;
  return (
    <span key={state.key} className={MASK}>
      <motion.span variants={state.blur ? PIECE_BLUR : PIECE} className="inline-block">
        {text}
      </motion.span>
    </span>
  );
}

/** Split a string into pieces, keeping whitespace as real text so lines still wrap naturally. */
function splitText(text: string, state: WalkState): ReactNode[] {
  const out: ReactNode[] = [];
  for (const token of text.split(/(\s+)/)) {
    if (token === '') continue;
    if (/^\s+$/.test(token)) {
      out.push(token);
    } else if (state.by === 'words') {
      out.push(piece(token, state));
    } else {
      // Letters stay together as one unbreakable word, so a line never breaks mid-word.
      state.key += 1;
      out.push(
        <span key={state.key} className="inline-block whitespace-nowrap">
          {Array.from(token).map((letter) => piece(letter, state))}
        </span>,
      );
    }
  }
  return out;
}

/** Walk a heading's children, splitting every string and keeping elements (`<em>`, `<br>`). */
function walk(node: ReactNode, state: WalkState): ReactNode {
  if (typeof node === 'string') return splitText(node, state);
  if (typeof node === 'number') return splitText(String(node), state);
  if (Array.isArray(node)) {
    return node.map((child, index) => <Fragment key={index}>{walk(child, state)}</Fragment>);
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    const { children } = node.props;
    if (children === undefined || children === null) return node;
    return cloneElement(
      node as ReactElement<{ children?: ReactNode }>,
      undefined,
      walk(children, state),
    );
  }
  return node;
}

export function SplitReveal({
  children,
  as = 'h2',
  by = 'words',
  blur = false,
  id,
  className,
}: {
  children: ReactNode;
  as?: Tag;
  by?: 'words' | 'letters';
  /** Words also come out of a soft blur (blur-to-sharp). For the biggest headlines. */
  blur?: boolean;
  id?: string | undefined;
  className?: string | undefined;
}) {
  const reduced = usePrefersReducedMotion();

  // No scroll observer (very old browsers, test environments): show the plain heading.
  if (reduced || typeof IntersectionObserver === 'undefined') {
    const Plain: ElementType = as;
    return (
      <Plain id={id} className={className}>
        {children}
      </Plain>
    );
  }

  const MotionTag = MOTION_TAGS[as];
  const count = Math.max(countPieces(children, by), 1);
  // A long heading must not take long to finish: the whole stagger lasts at most ~0.5 s.
  const stagger = Math.min(by === 'words' ? ENTRANCE_STAGGER : 0.03, 0.5 / count);
  const state: WalkState = { by, blur, key: 0 };
  const pieces = walk(children, state);

  return (
    <MotionTag
      id={id}
      className={className}
      variants={{ ...GROUP, visible: { transition: { staggerChildren: stagger } } }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
    >
      {by === 'letters' ? (
        <>
          {/* One real copy for screen readers and search; the split letters are decoration. */}
          <span className="sr-only">{plainText(children)}</span>
          <span aria-hidden>{pieces}</span>
        </>
      ) : (
        pieces
      )}
    </MotionTag>
  );
}
