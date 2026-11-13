import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { NavItem } from '../components/NavItem';
import { t } from '../i18n';

/**
 * Bottom navigation, fixed to the bottom of the screen.
 * It is rendered outside the moving page (portal), because on iPhone Safari a glass (blurred)
 * bar inside an animated page can render blank. A spacer keeps page content above it.
 * Today and You work; Roadmap and Progress come in later flows.
 */
export function AppNav({ active }: { active: 'today' | 'you' }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="app-nav-space" aria-hidden="true" />
      {createPortal(
        <div className="app-nav">
          <NavBar>
            <NavItem label={t('nav.today')} icon="home" active={active === 'today'} onClick={() => navigate('/today')} />
            {/* TODO(Flows 3, 4): Roadmap, Progress */}
            <NavItem label={t('nav.roadmap')} icon="route" />
            <NavItem label={t('nav.progress')} icon="monitoring" />
            <NavItem label={t('nav.you')} icon="person" active={active === 'you'} onClick={() => navigate('/you')} />
          </NavBar>
        </div>,
        document.body,
      )}
    </>
  );
}
