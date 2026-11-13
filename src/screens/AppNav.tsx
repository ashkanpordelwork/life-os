import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { NavItem } from '../components/NavItem';
import { t } from '../i18n';

/** Bottom navigation. Only Today exists for now; Roadmap, Progress and You come in later flows. */
export function AppNav({ active }: { active: 'today' }) {
  const navigate = useNavigate();
  return (
    <div className="app-nav">
      <NavBar>
        <NavItem label={t('nav.today')} icon="home" active={active === 'today'} onClick={() => navigate('/today')} />
        {/* TODO(Flows 3, 4, 7): Roadmap, Progress, You */}
        <NavItem label={t('nav.roadmap')} icon="route" />
        <NavItem label={t('nav.progress')} icon="monitoring" />
        <NavItem label={t('nav.you')} icon="person" />
      </NavBar>
    </div>
  );
}
