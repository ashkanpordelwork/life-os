import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { IconTile } from '../components/IconTile';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { VersionTab } from '../components/VersionTab';
import { getItem } from '../data';
import type { VersionKey } from '../data/types';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { haptic } from '../styles/motion';
import { itemAmount, whenLabel } from './flow';
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
    // Weekly patches are optional on a given day, so only daily ones decide "all done".
    const all = sprint?.patch_ids ?? [];
    const dailyIds = all.filter((x) => !getItem(x)?.per_week);
    const ids = dailyIds.length ? dailyIds : all;
    const allDoneNow = !done && ids.includes(item.id) && ids.every((x) => x === item.id || doneToday.has(x));
    navigate(allDoneNow ? '/done' : '/today');
  };

  return (
    <Screen>
      <TopBar title={t('patch.topTitle')} onBack={() => navigate('/today')} />
      <div className="patch__hero">
        <IconTile glyph={item.glyph} size="L" />
        <div className="patch__title">
          <p className="text-mono-label text-primary">{t(`areas.${item.area}`)}</p>
          <h2 className="text-title-l text-primary">{item.title}</h2>
        </div>
      </div>
      {/* Plain facts, not chips: nothing here is tappable, so nothing looks like a button. */}
      <ul className="patch__facts">
        {itemAmount(item, t) && <li className="patch__fact text-body-s text-secondary"><Icon name="timer" size={16} />{itemAmount(item, t)}</li>}
        <li className="patch__fact text-body-s text-secondary"><Icon name="event" size={16} />{whenLabel(item, wake, bed, t)}</li>
        <li className="patch__fact text-body-s text-secondary"><Icon name="science" size={16} />{t('patch.evidencePending')}</li>
      </ul>
      <div className="patch__versions" role="tablist">
        {VERSIONS.map((v) => (
          <VersionTab key={v.key} icon={v.icon} label={t(`patch.versions.${v.key}`)} time={item.versions[v.key].time} selected={version === v.key} onSelect={() => setVersion(v.key)} />
        ))}
      </div>
      {/* Flat tinted block: content, not a card (no border, no shadow). */}
      <div className="patch__copy">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={version} className="text-body-m-strong text-primary" role="tabpanel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {item.versions[version].text}
          </motion.p>
        </AnimatePresence>
      </div>
      <section className="patch__why" aria-labelledby="patch-why">
        <h3 id="patch-why" className="text-mono-label text-secondary"><Icon name="science" size={14} />{t('patch.why')}</h3>
        <p className="text-body-m text-primary">{item.science_note}</p>
      </section>
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
