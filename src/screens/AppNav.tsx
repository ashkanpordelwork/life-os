import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { NavItem } from '../components/NavItem';
import { t } from '../i18n';

/**
 * Bottom navigation, fixed to the bottom of the screen.
 * It is rendered outside the moving page (portal), because on iPhone Safari a glass (blurred)
 * bar inside an animated page can render blank. A spacer keeps page content above it.
 * Today, Roadmap, Progress and You.
 */
export function AppNav({ active }: { active: 'today' | 'progress' | 'roadmap' | 'you' }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="app-nav-space" aria-hidden="true" />
      {createPortal(
        <div className="app-nav">
          <NavBar>
            <NavItem label={t('nav.today')} icon="home" active={active === 'today'} onClick={() => navigate('/today')} />
            <NavItem label={t('nav.roadmap')} icon="route" active={active === 'roadmap'} onClick={() => navigate('/roadmap')} />
            <NavItem label={t('nav.progress')} icon="monitoring" active={active === 'progress'} onClick={() => navigate('/progress')} />
            <NavItem label={t('nav.you')} icon="person" active={active === 'you'} onClick={() => navigate('/you')} />
          </NavBar>
        </div>,
        document.body,
      )}
    </>
  );
}
