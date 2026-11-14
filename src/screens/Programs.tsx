import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { GlassPanel } from '../components/GlassPanel';
import { Icon } from '../components/Icon';
import { IconTile } from '../components/IconTile';
import { Progress } from '../components/Progress';
import { Screen, Spacer } from '../components/Screen';
import { TextButton } from '../components/TextButton';
import { TopBar } from '../components/TopBar';
import { getItem } from '../data';
import { PROGRAMS, getProgram, type Program } from '../data/programs';
import { SPRINT_DAYS, type ChecklistItem } from '../data/types';
import { themeFor } from '../engine';
import { t, tList } from '../i18n';
import { hasPro } from '../state/plan';
import { useActiveProgram } from '../state/program';
import { useSession } from '../state/session';
import { haptic, motionTokens } from '../styles/motion';
import './programs.css';

/** Week names are a list in en.json: programs.list.<id>.weeks[i]. */
const weekName = (id: string, i: number) => tList(`programs.list.${id}.weeks`)[i] ?? '';

const itemsOf = (ids: string[]) => ids.map(getItem).filter((x): x is ChecklistItem => !!x);

/**
 * Programs (designed in code, owner decision): 3-week paths. Starting one replaces this Sprint's patches
 * with week 1; at each Release the next week is offered. The first program is free, the rest Pro.
 */
export function Programs() {
  const navigate = useNavigate();
  const { user, sprint, saveSprint, plan } = useSession();
  const [active, setActive] = useActiveProgram(user?.id);
  const [open, setOpen] = useState<Program | null>(null);
  const [busy, setBusy] = useState(false);
  const pro = hasPro(plan);
  const current = active ? getProgram(active.id) : undefined;

  const start = async (p: Program) => {
    if (!sprint) return;
    setBusy(true); haptic(25);
    const ids = p.weeks[0].patch_ids;
    await saveSprint({ ...sprint, patch_ids: ids, theme: themeFor(itemsOf(ids)), length_days: SPRINT_DAYS, started_at: new Date().toISOString() });
    setActive({ id: p.id, week: 1, sprint: sprint.number });
    setBusy(false); setOpen(null);
    navigate('/today');
  };

  return (
    <Screen>
      <TopBar title={t('programs.title')} onBack={() => navigate('/roadmap')} />
      <p className="text-body-s text-secondary">{t('programs.intro')}</p>

      {current && active && (
        <motion.section className="program-active" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={motionTokens.page}>
          <span className="text-mono-label">{t('programs.following')}</span>
          <span className="text-title-m">{t(`programs.list.${current.id}.title`)}</span>
          <span className="text-body-s program-active__sub">{t('programs.weekOf', { n: active.week, total: current.weeks.length })} · {weekName(current.id, active.week - 1)}</span>
          <Progress value={active.week / current.weeks.length} label={t('programs.weekOf', { n: active.week, total: current.weeks.length })} />
          <div><TextButton label={t('programs.leave')} onClick={() => setActive(null)} /></div>
        </motion.section>
      )}

      {PROGRAMS.map((p, i) => {
        const locked = !p.free && !pro;
        return (
          <motion.button
            key={p.id}
            type="button"
            className={`program-card glass-card${active?.id === p.id ? ' program-card--on' : ''}`}
            onClick={() => (locked ? navigate('/pro') : setOpen(p))}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            transition={{ ...motionTokens.page, delay: i * motionTokens.stagger }}
          >
            <IconTile glyph={p.glyph} size="L" />
            <span className="program-card__text">
              <span className="program-card__badges">
                <span className={`program-badge text-mono-caption${p.free ? '' : ' program-badge--pro'}`}>{p.free ? t('programs.free') : t('programs.pro')}</span>
                <span className="text-mono-caption text-secondary">{t('programs.weeks', { n: p.weeks.length })}</span>
              </span>
              <span className="text-title-s text-primary">{t(`programs.list.${p.id}.title`)}</span>
              <span className="text-body-s text-secondary">{t(`programs.list.${p.id}.body`)}</span>
            </span>
            <Icon name={locked ? 'lock' : 'chevron_right'} size={20} />
          </motion.button>
        );
      })}
      <Spacer />

      <BottomSheet open={!!open} onClose={() => setOpen(null)} eyebrow={open ? t('programs.weeks', { n: open.weeks.length }).toUpperCase() : undefined} title={open ? t(`programs.list.${open.id}.title`) : ''}>
        {open && (
          <div className="program-sheet shadow-room shadow-room--sheet">
            <p className="text-body-m text-secondary">{t(`programs.list.${open.id}.body`)}</p>
            {open.weeks.map((w, wi) => (
              <GlassPanel key={wi} gap={8}>
                <span className="text-mono-label text-brand">{t('programs.week', { n: wi + 1 })} · {weekName(open.id, wi)}</span>
                {itemsOf(w.patch_ids).map((it) => (
                  <span key={it.id} className="program-sheet__patch text-body-m text-primary"><IconTile glyph={it.glyph} size="M" /> {it.title}</span>
                ))}
              </GlassPanel>
            ))}
            <p className="text-body-s text-secondary">{t('programs.replaceNote')}</p>
            <Button block label={active?.id === open.id ? t('programs.restart') : t('programs.start')} busy={busy} onClick={() => start(open)} />
          </div>
        )}
      </BottomSheet>
    </Screen>
  );
}
