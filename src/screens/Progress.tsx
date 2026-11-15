import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { BottomSheet } from '../components/BottomSheet';
import { Chip } from '../components/Chip';
import { HeatCell } from '../components/HeatCell';
import { Icon } from '../components/Icon';
import { ListRow } from '../components/ListRow';
import { PatchCard } from '../components/PatchCard';
import { Screen, Spacer } from '../components/Screen';
import { StatChip } from '../components/StatChip';
import { WeekStat } from '../components/WeekStat';
import { getItem } from '../data';
import { AREAS, type Area, type ChecklistItem } from '../data/types';
import {
  REST_ID, addDays, areaScoresFromAnswers, currentStreak, heatLevel, overallScore,
  totalActiveDays, weekDays, weekPercent, bestIndex, weekdayCounts, patchRates, type AnswerIndex,
} from '../engine';
import { t } from '../i18n';
import { useSession } from '../state/session';
import { motionTokens } from '../styles/motion';
import { AppNav } from './AppNav';
import { cardMeta } from './flow';
import './onboarding.css';
import './progress.css';

const WEEKS = 14;
/** Notes show up once there's enough to go on (app choice). */
const NOTES_AFTER_DAYS = 7;
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function dayTitle(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', ' ·').toUpperCase();
}

/** Progress (Figma 50:161) + Day detail sheet (59:891). */
export function Progress() {
  const navigate = useNavigate();
  const { checkins, sprint, profile, today, goals } = useSession();
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
  const score = complete ? overallScore(areaScoresFromAnswers(answers as Record<Area, AnswerIndex>)) : null;
  const start = profile?.start_answers;
  const startScore = start && AREAS.every((a) => start[a] !== undefined) ? overallScore(areaScoresFromAnswers(start as Record<Area, AnswerIndex>)) : null;
  const diff = score !== null && startScore !== null ? score - startScore : null;
  const scoreLine = diff === null ? t('progress.scoreSubtitle')
    : Math.abs(diff) < 0.05 ? t('progress.scoreSubtitleSame')
    : t(diff > 0 ? 'progress.scoreSubtitleNow' : 'progress.scoreSubtitleDown', { x: Math.abs(diff).toFixed(1) });
  const week = useMemo(() => sprint ? weekPercent(sprint, checkins, today, (id) => getItem(id)?.per_week) : { done: 0, target: 0, percent: 0 }, [sprint, checkins, today]);

  // Up to two plain notes: best weekday and steadiest habit.
  const notes = useMemo(() => {
    const out: string[] = [];
    if (totalActiveDays(checkins) < NOTES_AFTER_DAYS) return out;
    const best = bestIndex(weekdayCounts(checkins, today, 8));
    if (best >= 0) out.push(t('notice.bestDay', { day: WEEKDAYS[best] }));
    if (sprint) {
      const rates = patchRates(sprint, checkins, today, (id) => getItem(id)?.per_week);
      const top = rates.reduce<(typeof rates)[number] | null>((b, r) => (r.done > 0 && (!b || r.done / r.target > b.done / b.target) ? r : b), null);
      const item = top ? getItem(top.id) : undefined;
      if (item) out.push(t('notice.steady', { title: item.title }));
    }
    return out;
  }, [checkins, sprint, today]);

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
        <WeekStat percent={week.percent} done={week.done} target={week.target} />
      </div>
      <ListRow icon="trending_up" title={t('progress.byArea')} subtitle={scoreLine} onClick={() => navigate('/progress/score')} />
      {/* What we notice: three plain lines instead of a separate Insights screen (user feedback). */}
      <section className="notice" aria-labelledby="notice-title">
        <h2 id="notice-title" className="text-title-s text-primary">{t('notice.title')}</h2>
        {notes.length === 0 && <p className="text-body-s text-secondary">{t('notice.empty')}</p>}
        {notes.map((n, i) => (
          <motion.p key={n} className="notice__line text-body-m text-primary" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ ...motionTokens.page, delay: 0.1 + i * motionTokens.stagger }}>
            <Icon name="check" size={16} />{n}
          </motion.p>
        ))}
      </section>
      <Spacer />
      <AppNav active="progress" />

      <BottomSheet
        open={!!openDay}
        onClose={() => setOpenDay(null)}
        eyebrow={openDay ? dayTitle(openDay) : undefined}
        title={openDay && rests.has(openDay) ? t('progress.rest') : t('progress.dayDone', { n: detailDone.size, total: Math.max(detailIds.length, 1) })}
      >
        {detailIds.length === 0 && <p className="text-body-s text-secondary">{t('progress.nothing')}</p>}
        <div className="progress__detail shadow-room shadow-room--sheet">
          {detailIds.map(getItem).filter((x): x is ChecklistItem => !!x).map((item) => (
            <PatchCard key={item.id} glyph={item.glyph} title={item.title} meta={cardMeta(item, t, goals)} done={detailDone.has(item.id)} />
          ))}
        </div>
      </BottomSheet>
    </Screen>
  );
}

