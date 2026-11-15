import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { NavItem } from '../components/NavItem';
import { t } from '../i18n';

type Tab = 'today' | 'progress' | 'roadmap' | 'tribe' | 'you';
const TABS: { key: Tab; path: string; icon: 'home' | 'route' | 'monitoring' | 'person' | 'group' }[] = [
  { key: 'today', path: '/today', icon: 'home' },
  { key: 'roadmap', path: '/roadmap', icon: 'route' },
  { key: 'tribe', path: '/tribe', icon: 'group' },
  { key: 'progress', path: '/progress', icon: 'monitoring' },
  { key: 'you', path: '/you', icon: 'person' },
];

/**
 * Space for the bottom navigation inside a tab screen, so the last card is never hidden.
 * The bar itself is TabBar (one instance for the whole app).
 */
export function AppNav(_: { active: Tab }) {
  return <div className="app-nav-space" aria-hidden="true" />;
}

/**
 * Bottom navigation, fixed to the bottom of the screen. Rendered once, outside the moving pages
 * (portal): it does not flicker between tabs, the active pill slides, and on iPhone Safari a glass bar
 * inside an animated page can render blank. Tapping the current tab scrolls back to the top (iOS).
 */
export function TabBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = TABS.find((x) => x.path === pathname)?.key;
  const { compact, raised } = useScrollNav(pathname);
  if (!active) return null;
  return createPortal(
    <div className="app-nav">
      <NavBar compact={compact} raised={raised}>
        {TABS.map((x) => (
          <NavItem
            key={x.key}
            label={t(`nav.${x.key}`)}
            icon={x.icon}
            active={active === x.key}
            tour={x.key === 'today' || x.key === 'you' ? undefined : x.key}
            onClick={() => (active === x.key ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate(x.path))}
          />
        ))}
      </NavBar>
    </div>,
    document.body,
  );
}

/** Scroll distances for the bar (app choice). */
const COMPACT_AFTER = 80; // px from the top before the bar may shrink
const TURN = 8; // px of movement before a direction change counts
const NEAR_END = 24; // px from the bottom: show the full bar again

/**
 * Bottom bar reacts to scrolling (owner request):
 * - scroll down: compact (icons only); scroll up, top or end of page: full size again
 * - raised: stronger glass once anything is under the bar
 * Reduced motion: the bar never shrinks.
 */
function useScrollNav(pathname: string) {
  const [compact, setCompact] = useState(false);
  const [raised, setRaised] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    setCompact(false);
    last.current = window.scrollY;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const room = document.documentElement.scrollHeight - window.innerHeight;
        setRaised(room > 0 && y < room - 2);
        const dy = y - last.current;
        if (Math.abs(dy) < TURN) return;
        last.current = y;
        if (still || y < COMPACT_AFTER || y > room - NEAR_END) setCompact(false);
        else setCompact(dy > 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [pathname]);
  return { compact, raised };
}

/** A new screen starts at the top (fixes landing half-way down after a long page). */
export function useScrollTopOnMount() {
  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);
}
