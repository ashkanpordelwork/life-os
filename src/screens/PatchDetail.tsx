import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/GlassPanel';
import { Icon, type IconName } from '../components/Icon';
import { IconTile } from '../components/IconTile';
import { ListRow } from '../components/ListRow';
import { MetaChip } from '../components/MetaChip';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { VersionTab } from '../components/VersionTab';
import { getItem } from '../data';
import type { VersionKey } from '../data/types';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { haptic } from '../styles/motion';
import { formatMinutes, whenLabel } from './flow';
import './patch.css';

const VERSIONS: { key: VersionKey; icon: IconName }[] = [
  { key: 'tiny', icon: 'bolt' },
  { key: 'standard', icon: 'tune' },
  { key: 'stretch', icon: 'trending_up' },
];

/** Patch detail (Figma 2033:2855) */
export function PatchDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { checkins, today, sprint, setDone, wake, bed } = useSession();
  const item = id ? getItem(id) : undefined;
  const [version, setVersion] = useState<VersionKey>(() => {
    try { return localStorage.getItem('lifeos.tinyMode') === '1' ? 'tiny' : 'standard'; } catch { return 'standard'; }
  });
  if (!item) return <Navigate to="/today" replace />;

  const done = checkins.some((c) => c.day === today && c.item_id === item.id);
  const doneToday = new Set(checkins.filter((c) => c.day === today).map((c) => c.item_id));

  const mark = async () => {
    if (!done) haptic();
    await setDone(item.id, !done, version);
    const ids = sprint?.patch_ids ?? [];
    const allDoneNow = !done && ids.length > 0 && ids.every((x) => x === item.id || doneToday.has(x));
    navigate(allDoneNow ? '/done' : '/today');
  };

  return (
    <Screen>
      <TopBar title={t('patch.topTitle')} trailing={item.id} onBack={() => navigate('/today')} />
      <div className="patch__hero">
        <IconTile glyph={item.glyph} size="L" />
        <div className="patch__title">
          <p className="text-mono-label text-primary">{t(`areas.${item.area}`)}</p>
          <h2 className="text-title-l text-primary">{item.title}</h2>
        </div>
      </div>
      <div className="patch__facts">
        <MetaChip icon="timer" label={formatMinutes(item.duration_min, t)} />
        <MetaChip icon="event" label={whenLabel(item, wake, bed, t)} />
        <MetaChip icon="science" label={t('patch.evidencePending')} />
      </div>
      <div className="patch__versions" role="tablist">
        {VERSIONS.map((v) => (
          <VersionTab key={v.key} icon={v.icon} label={t(`patch.versions.${v.key}`)} time={item.versions[v.key].time} selected={version === v.key} onSelect={() => setVersion(v.key)} />
        ))}
      </div>
      <GlassPanel>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={version} className="text-body-m-strong text-primary" role="tabpanel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {item.versions[version].text}
          </motion.p>
        </AnimatePresence>
      </GlassPanel>
      <ListRow icon="science" title={t('patch.why')} subtitle={item.science_note} />
      {item.area === 'Movement' && (
        <p className="patch__safety text-caption text-primary"><Icon name="info" size={16} />{t('patch.safetyMove')}</p>
      )}
      <Spacer />
      <div className="patch__actions">
        <Button block label={t(done ? 'patch.undo' : 'patch.markDone')} variant={done ? 'Secondary' : 'Primary'} onClick={mark} />
        <Button block variant="Ghost" label={t('patch.notToday')} onClick={() => navigate('/today')} />
      </div>
    </Screen>
  );
}
