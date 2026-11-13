import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { Chip } from '../components/Chip';
import { GlassPanel } from '../components/GlassPanel';
import { ListRow } from '../components/ListRow';
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

type Tab = 'tools' | 'learn';

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
 * Tools: in-the-moment helpers (Physiological sigh, NSDR). Learn: every patch with its science and book source.
 */
export function Library() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('tools');
  const [area, setArea] = useState<Area | 'All'>('All');
  const [open, setOpen] = useState<ChecklistItem | null>(null);
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
          {[
            { to: '/tool/sigh', icon: 'air' as const, title: t('sigh.title'), sub: t('sigh.subtitle') },
            { to: '/tool/nsdr', icon: 'self_improvement' as const, title: t('nsdr.title'), sub: t('nsdr.subtitle') },
          ].map((r, i) => (
            <motion.div key={r.to} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: i * motionTokens.stagger }}>
              <ListRow icon={r.icon} title={r.title} subtitle={r.sub} onClick={() => navigate(r.to)} />
            </motion.div>
          ))}
        </>
      )}

      {tab === 'learn' && (
        <>
          <p className="text-body-s text-secondary">{t('library.learnIntro')}</p>
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
