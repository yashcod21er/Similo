import { useEffect, useState } from 'react';

const FINE_QUERY = '(hover: hover) and (pointer: fine)';

/** True on devices with a mouse or pen that can hover (not on touch screens). Updates live. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.(FINE_QUERY).matches === true,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const list = window.matchMedia(FINE_QUERY);
    const onChange = () => setFine(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, []);
  return fine;
}
