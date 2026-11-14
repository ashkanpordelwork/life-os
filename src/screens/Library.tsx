import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { ListRow } from '../components/ListRow';
import type { IconName } from '../components/Icon';
import { MetaChip } from '../components/MetaChip';
import { PatchCard } from '../components/PatchCard';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { ITEMS } from '../data';
import { AREAS, type Area, type ChecklistItem } from '../data/types';
import { t } from '../i18n';
import { motionTokens } from '../styles/motion';
import { itemAmount } from './flow';
import './onboarding.css';
import './library.css';
import { useSession } from '../state/session';
import { hasPro } from '../state/plan';

type Tab = 'tools' | 'learn';

const TOOL_GROUPS: { key: string; tools: { to: string; key: string; icon: IconName; pro?: boolean }[] }[] = [
  { key: 'calm', tools: [
    { to: '/tool/sigh', key: 'sigh', icon: 'air' },
    { to: '/tool/nsdr', key: 'nsdr', icon: 'self_improvement' },
  ] },
  { key: 'focusGroup', tools: [
    { to: '/tool/focus', key: 'focus', icon: 'bolt', pro: true },
    { to: '/tool/woop', key: 'woop', icon: 'task_alt', pro: true },
    { to: '/tool/errors', key: 'errors85', icon: 'insights', pro: true },
    { to: '/tool/self-test', key: 'selfTest', icon: 'timer', pro: true },
  ] },
  { key: 'nutritionGroup', tools: [
    { to: '/tool/nutrition', key: 'nutrition', icon: 'restaurant', pro: true },
  ] },
  { key: 'travelGroup', tools: [
    { to: '/tool/jet-lag', key: 'jetlag', icon: 'event', pro: true },
  ] },
];

const BACK_KEY = 'lifeos.library.back';
/** Open the Library and remember where to go back to (tools inside it return to the Library). */
export function openLibrary(navigate: (to: string) => void, from: string) {
  try { sessionStorage.setItem(BACK_KEY, from); } catch { /* ignore */ }
  navigate('/library');
}
function libraryBack(): string {
  try { return sessionStorage.getItem(BACK_KEY) || '/today'; } catch { return '/today'; }
}

/**
 * Library (designed in code, owner decision; no Figma screen).
 * Tools: Calm (Physiological sigh, NSDR) and Focus (focus session, WOOP, 85% rule, self-test). Learn: every patch with its science and book source.
 */
export function Library() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('tools');
  const [area, setArea] = useState<Area | 'All'>('All');
  const [open, setOpen] = useState<ChecklistItem | null>(null);
  const pro = hasPro(useSession().plan);
  const patches = ITEMS.filter((i) => i.kind === 'patch' && (area === 'All' || i.area === area));

  return (
    <Screen>
      <TopBar title={t('library.title')} onBack={() => navigate(libraryBack())} />
      <div className="chip-wrap" role="tablist">
        <Chip label={t('library.tools')} selected={tab === 'tools'} onToggle={() => setTab('tools')} />
        <Chip label={t('library.learn')} selected={tab === 'learn'} onToggle={() => setTab('learn')} />
      </div>

      {tab === 'tools' && (
        <>
          <p className="text-body-s text-secondary">{t('library.toolsIntro')}</p>
          {TOOL_GROUPS.map((g, gi) => (
            <section key={g.key} className="library__group" aria-labelledby={`lib-${g.key}`}>
              <h2 id={`lib-${g.key}`} className="text-title-m text-primary">{t(`library.${g.key}`)}</h2>
              {g.tools.map((r, i) => (
                <motion.div key={r.to} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: (gi * 2 + i) * motionTokens.stagger }}>
                  <ListRow icon={r.pro && !pro ? 'lock' : r.icon} title={t(`${r.key}.title`)} subtitle={r.pro && !pro ? t('library.proOnly') : t(`${r.key}.subtitle`)} onClick={() => navigate(r.pro && !pro ? '/pro' : r.to)} />
                </motion.div>
              ))}
            </section>
          ))}
        </>
      )}

      {tab === 'learn' && (
        <>
          <p className="text-body-s text-secondary">{t('library.learnIntro')}</p>
          <ListRow icon={pro ? 'science' : 'lock'} title={t('supps.title')} subtitle={pro ? t('supps.subtitle') : t('library.proOnly')} onClick={() => navigate(pro ? '/library/supplements' : '/pro')} />
          <div className="chip-wrap">
            {(['All', ...AREAS] as const).map((a) => (
              <Chip key={a} label={a === 'All' ? t('review.all') : t(`review.areas.${a}`)} selected={area === a} onToggle={() => setArea(a)} />
            ))}
          </div>
          {patches.map((item) => (
            <PatchCard key={item.id} glyph={item.glyph} title={item.title} meta={`${t('library.level', { n: item.level })} · ${itemAmount(item, t)}`} onOpen={() => setOpen(item)} hideCheck />
          ))}
        </>
      )}
      <Spacer />

      <BottomSheet open={!!open} onClose={() => setOpen(null)} eyebrow={open ? `${t(`areas.${open.area}`).toUpperCase()} · ${t('library.level', { n: open.level }).toUpperCase()}` : undefined} title={open?.title ?? ''}>
        {open && (
          <div className="library__sheet">
            <p className="text-body-m text-primary">{open.science_note}</p>
            <GlassPanel gap={8}>
              {(['tiny', 'standard', 'stretch'] as const).map((v) => (
                <div key={v} className="library__version">
                  <span className="text-mono-label text-secondary">{t(`patch.versions.${v}`)} · {open.versions[v].time}</span>
                  <span className="text-body-s text-primary">{open.versions[v].text}</span>
                </div>
              ))}
            </GlassPanel>
            <div className="chip-wrap">
              {open.level > 1 && <MetaChip icon="lock" label={t('library.unlocks')} />}
            </div>
          </div>
        )}
      </BottomSheet>
    </Screen>
  );
}
