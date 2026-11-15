import { useEffect, useLayoutEffect, useState } from 'react';
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
  const { compact } = useScrollNav(pathname);
  if (!active) return null;
  return createPortal(
    <div className="app-nav">
      <NavBar compact={compact}>
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

/** Scroll rules for the bar (app choices). */
const MIN_ROOM = 320; // px: pages with less to scroll never change the bar (it would just flicker)
const SHRINK_AFTER = 48; // px scrolled down in one go before the bar shrinks
const GROW_AFTER = 24; // px scrolled up in one go before it grows back
const TOP_ZONE = 64; // px from the top: always full size

/**
 * Bottom bar reacts to scrolling (owner request): scroll down = compact (icons only),
 * scroll up or near the top = full size. It only changes after a clear move in one direction,
 * ignores the iPhone rubber-band at the ends, and never changes on short pages.
 * Reduced motion: the bar never changes.
 */
function useScrollNav(pathname: string) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    setCompact(false);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let anchor = window.scrollY; // where the current direction started
    let lastY = anchor; // where we were at the previous scroll event
    let dir = 0;
    let state = false;
    let frame = 0;
    const set = (v: boolean) => { if (v !== state) { state = v; setCompact(v); } };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const room = document.documentElement.scrollHeight - window.innerHeight;
        if (room < MIN_ROOM) { set(false); return; }
        const y = Math.min(Math.max(window.scrollY, 0), room); // no rubber-band values
        if (y < TOP_ZONE) { set(false); anchor = y; lastY = y; dir = 0; return; }
        const d = y > lastY ? 1 : y < lastY ? -1 : 0;
        const prev = lastY;
        lastY = y;
        if (d === 0) return;
        if (d !== dir) { dir = d; anchor = prev; } // direction changed: it started where we just were
        if (dir === 1 && y - anchor >= SHRINK_AFTER) set(true);
        if (dir === -1 && anchor - y >= GROW_AFTER) set(false);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [pathname]);
  return { compact };
}

/** A new screen starts at the top (fixes landing half-way down after a long page). */
export function useScrollTopOnMount() {
  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);
}
