import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { Chip } from '../components/Chip';
import { LEARNING_TOOLS } from './habitTools';
import { GlassPanel } from '../components/GlassPanel';
import { ListRow } from '../components/ListRow';
import { MetaChip } from '../components/MetaChip';
import { PatchCard } from '../components/PatchCard';
import { Screen, Spacer } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { ITEMS } from '../data';
import { AREAS, type Area, type ChecklistItem } from '../data/types';
import { t } from '../i18n';
import { itemAmount } from './flow';
import './onboarding.css';
import './library.css';
import { useSession } from '../state/session';
import { hasPro } from '../state/plan';

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
 * Reading only (user feedback): every habit with its science, supplements, and the two learning tools
 * that have no habit yet. Other tools open from inside their habit (src/screens/habitTools.ts).
 */
export function Library() {
  const navigate = useNavigate();
  const [area, setArea] = useState<Area | 'All'>('All');
  const [open, setOpen] = useState<ChecklistItem | null>(null);
  const pro = hasPro(useSession().plan);
  const patches = ITEMS.filter((i) => i.kind === 'patch' && (area === 'All' || i.area === area));

  return (
    <Screen>
      <TopBar title={t('library.title')} onBack={() => navigate(libraryBack())} />
      <>
          <p className="text-body-s text-secondary">{t('library.learnIntro')}</p>
          <ListRow icon={pro ? 'science' : 'lock'} title={t('supps.title')} subtitle={pro ? t('supps.subtitle') : t('library.proOnly')} onClick={() => navigate(pro ? '/library/supplements' : '/pro')} />
          <section className="library__group" aria-labelledby="lib-learning">
            <h2 id="lib-learning" className="text-title-m text-primary">{t('library.learningGroup')}</h2>
            {LEARNING_TOOLS.map((r) => (
              <ListRow key={r.to} icon={r.pro && !pro ? 'lock' : r.icon} title={t(`${r.key}.title`)} subtitle={r.pro && !pro ? t('library.proOnly') : t(`${r.key}.subtitle`)} onClick={() => navigate(r.pro && !pro ? '/pro' : r.to)} />
            ))}
          </section>
          <div className="chip-wrap">
            {(['All', ...AREAS] as const).map((a) => (
              <Chip key={a} label={a === 'All' ? t('review.all') : t(`review.areas.${a}`)} selected={area === a} onToggle={() => setArea(a)} />
            ))}
          </div>
          {patches.map((item) => (
            <PatchCard key={item.id} glyph={item.glyph} title={item.title} meta={[t('library.level', { n: item.level }), itemAmount(item, t)].filter(Boolean).join(' · ')} onOpen={() => setOpen(item)} hideCheck />
          ))}
      </>
      <Spacer />

      <BottomSheet open={!!open} onClose={() => setOpen(null)} eyebrow={open ? `${t(`areas.${open.area}`).toUpperCase()} · ${t('library.level', { n: open.level }).toUpperCase()}` : undefined} title={open?.title ?? ''}>
        {open && (
          <div className="library__sheet shadow-room shadow-room--sheet">
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
