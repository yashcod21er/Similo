import { useEffect, useState, type RefObject } from 'react';
import { useInView, usePrefersReducedMotion } from '@/components/motion/hooks';

/**
 * True when a ScrollStory visual should play: it is on screen and its step is the active
 * one (ScrollStory marks inactive visuals `aria-hidden="true"`). Always true with reduced
 * motion, so the finished state shows without movement.
 */
export function useStoryActive(ref: RefObject<Element | null>): boolean {
  const reduced = usePrefersReducedMotion();
  const inView = useInView(ref, { rootMargin: '0px 0px -10% 0px' });
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const host = ref.current?.closest('[aria-hidden]');
    if (!host) return;
    const read = () => setHidden(host.getAttribute('aria-hidden') === 'true');
    read();
    const observer = new MutationObserver(read);
    observer.observe(host, { attributes: true, attributeFilter: ['aria-hidden'] });
    return () => observer.disconnect();
  }, [ref]);

  return reduced || (inView && !hidden);
}
