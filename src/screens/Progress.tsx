import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { BottomSheet } from '../components/BottomSheet';
import { Chip } from '../components/Chip';
import { HeatCell } from '../components/HeatCell';
import { PatchCard } from '../components/PatchCard';
import { Screen, Spacer } from '../components/Screen';
import { StatChip } from '../components/StatChip';
import { getItem } from '../data';
import { AREAS, type Area, type ChecklistItem } from '../data/types';
import {
  REST_ID, addDays, areaScoresFromAnswers, currentStreak, heatLevel, overallScore,
  totalActiveDays, weekDays, type AnswerIndex,
} from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { motionTokens } from '../styles/motion';
import { AppNav } from './AppNav';
import { formatMinutes } from './flow';
import './onboarding.css';
import './progress.css';

const WEEKS = 14;

function dayTitle(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', ' ·').toUpperCase();
}

/** Progress (Figma 50:161) + Day detail sheet (59:891). */
export function Progress() {
  const navigate = useNavigate();
  const { checkins, sprint, profile, today } = useSession();
  const [filter, setFilter] = useState<Area | 'All'>('All');
  const [openDay, setOpenDay] = useState<string | null>(null);

  const sprintItems = useMemo(() => (sprint?.patch_ids ?? []).map(getItem).filter((x): x is ChecklistItem => !!x), [sprint]);

  // Monday of the week 13 weeks ago -> today's week is the last column.
  const firstMonday = addDays(weekDays(today)[0], -7 * (WEEKS - 1));
  const columns = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(firstMonday, w * 7 + d)));

  const byDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const c of checkins) {
      if (c.item_id === REST_ID) continue;
      map.set(c.day, [...(map.get(c.day) ?? []), c.item_id]);
    }
    return map;
  }, [checkins]);
  const rests = useMemo(() => new Set(checkins.filter((c) => c.item_id === REST_ID).map((c) => c.day)), [checkins]);

  const level = (day: string) => {
    if (day > today) return 0;
    const ids = byDay.get(day) ?? [];
    if (filter === 'All') return heatLevel(ids.length, Math.max(1, sprintItems.length));
    const inArea = ids.filter((id) => getItem(id)?.area === filter).length;
    const planned = Math.max(1, sprintItems.filter((i) => i.area === filter).length);
    return heatLevel(inArea, planned);
  };

  const answers = profile?.answers ?? {};
  const complete = AREAS.every((a) => answers[a] !== undefined);
  const score = complete ? overallScore(areaScoresFromAnswers(answers as Record<Area, AnswerIndex>)) : 0;

  // Day detail: the Sprint's patches (done or not) plus anything else ticked that day.
  const detailIds = openDay ? Array.from(new Set([...sprintItems.map((i) => i.id), ...(byDay.get(openDay) ?? [])])) : [];
  const detailDone = openDay ? new Set(byDay.get(openDay) ?? []) : new Set<string>();

  return (
    <Screen>
      <div className="progress__top"><span className="text-mono-label text-secondary">{t('progress.label')}</span></div>
      <h1 className="text-title-l text-primary">{t('progress.title')}</h1>
      <div className="chip-wrap">
        {(['All', ...AREAS] as const).map((a) => (
          <Chip key={a} label={a === 'All' ? t('review.all') : t(`review.areas.${a}`)} selected={filter === a} onToggle={() => setFilter(a)} />
        ))}
      </div>
      <section className="progress__grid glass-card" aria-label={t('progress.title')}>
        {columns.map((week, w) => (
          <div key={w} className="progress__week">
            {week.map((day, d) => (
              <motion.span key={day} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...motionTokens.pop, delay: Math.min(0.6, (w * 7 + d) * 0.004) }} style={{ display: 'flex' }}>
                <HeatCell
                  size="lg"
                  level={level(day) as 0 | 1 | 2 | 3 | 4}
                  label={t('progress.cellLabel', { day, n: (byDay.get(day) ?? []).length })}
                  onClick={day <= today ? () => setOpenDay(day) : undefined}
                />
              </motion.span>
            ))}
          </div>
        ))}
      </section>
      <div className="progress__stats">
        <StatChip fill icon="local_fire_department" value={<AnimatedNumber value={currentStreak(checkins, today)} />} label={t('today.streak')} />
        <StatChip fill icon="calendar_today" value={<AnimatedNumber value={totalActiveDays(checkins)} />} label={t('today.days')} />
        <button type="button" className="progress__score" aria-label={t('progress.openScore')} onClick={() => navigate('/progress/score')}>
          <StatChip fill icon="trending_up" value={<AnimatedNumber value={score} decimals={1} />} label={t('today.score')} />
        </button>
      </div>
      <Spacer />
      <AppNav active="progress" />

      <BottomSheet
        open={!!openDay}
        onClose={() => setOpenDay(null)}
        eyebrow={openDay ? dayTitle(openDay) : undefined}
        title={openDay && rests.has(openDay) ? t('progress.rest') : t('progress.dayDone', { n: detailDone.size, total: Math.max(detailIds.length, 1) })}
      >
        {detailIds.length === 0 && <p className="text-body-s text-secondary">{t('progress.nothing')}</p>}
        <div className="progress__detail">
          {detailIds.map(getItem).filter((x): x is ChecklistItem => !!x).map((item) => (
            <PatchCard key={item.id} glyph={item.glyph} title={item.title} meta={formatMinutes(item.duration_min, t)} done={detailDone.has(item.id)} />
          ))}
        </div>
      </BottomSheet>
    </Screen>
  );
}

