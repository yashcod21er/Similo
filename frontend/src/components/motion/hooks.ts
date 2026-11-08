import { useEffect, useState, type RefObject } from 'react';

/*
 * Small browser hooks shared by the motion building blocks. They all fall back to a safe
 * answer where an API is missing (tests run in jsdom, which has no IntersectionObserver).
 */

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function readReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(REDUCED_QUERY).matches
    : false;
}

/** True when the visitor asked their system for reduced motion. Updates live. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(readReducedMotion);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(REDUCED_QUERY);
    const onChange = () => setReduced(query.matches);
    onChange();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** True while the browser tab is visible. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

/**
 * True while the element is (near) the viewport. Without a ref, or without
 * IntersectionObserver, it answers `true` so content still works.
 * `once` keeps it true after the first time the element was seen.
 */
export function useInView(
  ref: RefObject<Element | null> | undefined,
  { rootMargin = '0px', once = false }: { rootMargin?: string; once?: boolean } = {},
): boolean {
  const [inView, setInView] = useState(() => !ref || typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const element = ref?.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, once]);
  return inView;
}
