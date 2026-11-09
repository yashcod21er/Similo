import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useBlocker, useLocation, useNavigationType, type BlockerFunction } from 'react-router';
import { usePrefersReducedMotion } from '@/components/motion/hooks';

/** How long the curtain takes to cover the page before the navigation goes ahead. */
const COVER_MS = 240;

/** Pages outside the public site (sign-in, the workspace) get no curtain. */
function isPublic(pathname: string): boolean {
  return !/^\/(app|sign-in|sign-up|invite)(\/|$)/.test(pathname);
}

/**
 * Page transitions on the public site: when you follow a link to another page, a night curtain
 * with a thin burnt-orange edge sweeps up over the page (≈ 0.24 s), the new page renders underneath
 * (ScrollRestoration scrolls it to the top unseen), and the curtain sweeps away (≈ 0.3 s).
 *
 * - Back and forward (POP) are never delayed and get no curtain, so the browser's history and
 *   scroll restoration behave exactly as without it.
 * - Hash links and query changes on the same page are not affected.
 * - Focus is untouched: the curtain is decorative (`aria-hidden`) and only blocks pointer
 *   clicks while it covers the page.
 * - Off with reduced motion.
 */
export function PageTransition() {
  const reduced = usePrefersReducedMotion();
  const location = useLocation();
  const navigationType = useNavigationType();

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation, historyAction }) =>
      !reduced &&
      historyAction !== 'POP' &&
      currentLocation.pathname !== nextLocation.pathname &&
      isPublic(nextLocation.pathname),
    [reduced],
  );
  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    const id = window.setTimeout(() => blocker.proceed(), COVER_MS);
    return () => window.clearTimeout(id);
  }, [blocker]);

  // After a covered navigation lands, sweep the curtain away.
  const [shownPath, setShownPath] = useState(location.pathname);
  const [revealing, setRevealing] = useState(false);
  if (location.pathname !== shownPath) {
    setShownPath(location.pathname);
    setRevealing(!reduced && navigationType !== 'POP');
  }

  // ScrollRestoration scrolls to the top, but the page's `scroll-behavior: smooth` turns that
  // into a visible glide. Jump there instantly while the curtain still covers the page.
  useLayoutEffect(() => {
    if (revealing && !location.hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [revealing, location.key, location.hash]);

  // Safety net: never leave the curtain up, even if no animationend arrives.
  useEffect(() => {
    if (!revealing) return;
    const id = window.setTimeout(() => setRevealing(false), 900);
    return () => window.clearTimeout(id);
  }, [revealing]);

  const covering = blocker.state === 'blocked' || blocker.state === 'proceeding';
  const phase = reduced ? null : covering ? 'cover' : revealing ? 'reveal' : null;
  if (!phase) return null;

  const onAnimationEnd = () => {
    if (phase === 'reveal') setRevealing(false);
  };

  return (
    <div
      aria-hidden
      data-phase={phase}
      data-testid="page-curtain"
      className="page-curtain fixed inset-0 z-[95] overflow-hidden"
      onAnimationEnd={onAnimationEnd}
    >
      <div className="curtain-panel" />
    </div>
  );
}
