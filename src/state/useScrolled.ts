import { useEffect, useState } from 'react';

/** True once the page has scrolled past `threshold` px. Used for iOS-style bars. */
export function useScrolled(threshold = 4): boolean {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > threshold);
  useEffect(() => {
    let frame = 0;
    const check = () => { frame = 0; setScrolled(window.scrollY > threshold); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [threshold]);
  return scrolled;
}
