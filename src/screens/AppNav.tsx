import { useLayoutEffect } from 'react';
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
  if (!active) return null;
  return createPortal(
    <div className="app-nav">
      <NavBar>
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

/** A new screen starts at the top (fixes landing half-way down after a long page). */
export function useScrollTopOnMount() {
  useLayoutEffect(() => { window.scrollTo(0, 0); }, []);
}
