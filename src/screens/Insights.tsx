import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { GlassPanel } from '../components/GlassPanel';
import { IconTile } from '../components/IconTile';
import { MetaChip } from '../components/MetaChip';
import { Progress } from '../components/Progress';
import { Screen, Spacer } from '../components/Screen';
import { StatChip } from '../components/StatChip';
import { TopBar } from '../components/TopBar';
import { getItem } from '../data';
import { AREAS, type Area, type ChecklistItem } from '../data/types';
import {
  LEVEL_UP_COMPLETION, areaScoresFromAnswers, bestIndex, currentStreak, longestStreak, overallScore,
  patchRates, sprintCompletion, totalActiveDays, weekdayCounts, type AnswerIndex,
} from '../engine';
import { t, tList } from '../i18n';
import { useSession } from '../state/session';
import { motionTokens } from '../styles/motion';
import './progress.css';
import './insights.css';

const WEEKS = 8;
/** Fewer counted days than this: show the "getting started" note instead of patterns. */
const MIN_DAYS_FOR_PATTERNS = 7;
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Insights (designed in code, owner decision; no Figma screen).
 * This Sprint, the road to Level 2, each patch, best weekdays, streaks and score change.
 * Charts: one series, brand colour, value labels only where they help, a hidden table for screen readers.
 */
export function Insights() {
  const navigate = useNavigate();
  const { sprint, checkins, profile, today } = useSession();
  const [pickedDay, setPickedDay] = useState<number | null>(null);

  const data = useMemo(() => {
    const items = (sprint?.patch_ids ?? []).map(getItem).filter((x): x is ChecklistItem => !!x);
    const completion = sprint ? sprintCompletion(sprint, checkins, today) : 0;
    const rates = sprint ? patchRates(sprint, checkins, today, (id) => getItem(id)?.per_week) : [];
    const weekdays = weekdayCounts(checkins, today, WEEKS);
    const a = profile?.answers;
    const s = profile?.start_answers;
    const full = (x: typeof a): x is Record<Area, AnswerIndex> => !!x && AREAS.every((k) => x[k] !== undefined);
    const now = full(a) ? overallScore(areaScoresFromAnswers(a)) : null;
    const start = full(s) ? overallScore(areaScoresFromAnswers(s)) : null;
    const steadiest = rates.length ? rates.reduce((b, r) => (r.done / r.target > b.done / b.target ? r : b)) : null;
    return {
      items, completion, rates, weekdays, now, start,
      best: bestIndex(weekdays),
      steadiest: steadiest && steadiest.done > 0 ? getItem(steadiest.id) : undefined,
      total: totalActiveDays(checkins),
      streak: currentStreak(checkins, today),
      longest: longestStreak(checkins),
      l2Open: items.some((i) => i.level >= 2),
    };
  }, [sprint, checkins, profile, today]);

  const pct = Math.round(data.completion * 100);
  const need = Math.round(LEVEL_UP_COMPLETION * 100);
  const max = Math.max(1, ...data.weekdays);
  const short = tList('done.weekdays');
  const enough = data.total >= MIN_DAYS_FOR_PATTERNS;
  const shownDay = pickedDay ?? (data.best >= 0 ? data.best : null);
  const appear = (i: number) => ({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { ...motionTokens.page, delay: i * motionTokens.stagger } });

  return (
    <Screen>
      <TopBar title={t('insights.title')} onBack={() => navigate('/progress')} />

      {/* This Sprint */}
      <motion.div {...appear(0)}>
        <GlassPanel gap={14}>
          <span className="text-mono-label text-secondary">{t('insights.sprintLabel', { n: sprint?.number ?? 1 })}</span>
          <div className="insights__hero">
            <span className="text-display-xl text-primary"><AnimatedNumber value={pct} />%</span>
            <span className="text-body-s text-secondary">{t('insights.sprintBody')}</span>
          </div>
          <div className="insights__goal">
            <Progress value={data.completion} label={t('insights.levelAria', { p: pct, need })} />
            <span className="insights__goal-mark" style={{ insetInlineStart: `${need}%` }} aria-hidden="true" />
          </div>
          <MetaChip
            icon={data.l2Open || ((sprint?.number ?? 1) >= 2 && pct >= need) ? 'trending_up' : 'lock'}
            label={data.l2Open ? t('insights.levelOpen') : (sprint?.number ?? 1) < 2 ? t('insights.levelLater', { need }) : pct >= need ? t('insights.levelOnTrack') : t('insights.levelNeed', { need })}
          />
        </GlassPanel>
      </motion.div>

      {/* Patch by patch */}
      <motion.section {...appear(1)} className="insights__section" aria-labelledby="ins-patches">
        <h2 id="ins-patches" className="text-title-m text-primary">{t('insights.patchesTitle')}</h2>
        <GlassPanel gap={14}>
          {data.rates.map((r) => {
            const item = getItem(r.id);
            if (!item) return null;
            return (
              <div key={r.id} className="insights__patch">
                <IconTile glyph={item.glyph} size="M" />
                <div className="insights__patch-mid">
                  <div className="insights__patch-head">
                    <span className="text-body-m-strong text-primary">{item.title}</span>
                    <span className="text-mono-caption text-secondary">{t('insights.daysOf', { n: r.done, total: r.target })}</span>
                  </div>
                  <Progress value={Math.min(1, r.done / r.target)} label={`${item.title}: ${t('insights.daysOf', { n: r.done, total: r.target })}`} />
                </div>
              </div>
            );
          })}
        </GlassPanel>
      </motion.section>

      {/* Best days */}
      <motion.section {...appear(2)} className="insights__section" aria-labelledby="ins-days">
        <h2 id="ins-days" className="text-title-m text-primary">{t('insights.daysTitle')}</h2>
        <GlassPanel gap={14}>
          <span className="text-body-s text-secondary">
            {shownDay !== null
              ? t('insights.dayValue', { day: WEEKDAY_NAMES[shownDay], n: data.weekdays[shownDay], weeks: WEEKS })
              : data.total > 0 ? t('insights.daysTap') : t('insights.daysEmpty')}
          </span>
          <div className="insights__bars" aria-hidden="true">
            {data.weekdays.map((v, i) => (
              <button key={i} type="button" tabIndex={-1} className={`insights__bar-hit${shownDay === i ? ' insights__bar-hit--on' : ''}`} onClick={() => setPickedDay(i)}>
                <span className="insights__bar-track">
                  <motion.span
                    className="insights__bar"
                    initial={{ height: '0%' }}
                    animate={{ height: `${(v / max) * 100}%` }}
                    transition={{ ...motionTokens.pop, delay: 0.15 + i * 0.04 }}
                  />
                </span>
                <span className={`text-mono-caption ${shownDay === i ? 'text-primary' : 'text-secondary'}`}>{short[i]}</span>
              </button>
            ))}
          </div>
          <table className="visually-hidden">
            <caption>{t('insights.daysTitle')}</caption>
            <tbody>
              {data.weekdays.map((v, i) => <tr key={i}><th scope="row">{WEEKDAY_NAMES[i]}</th><td>{v}</td></tr>)}
            </tbody>
          </table>
        </GlassPanel>
      </motion.section>

      {/* Streaks */}
      <motion.div {...appear(3)} className="progress__stats">
        <StatChip fill icon="local_fire_department" value={<AnimatedNumber value={data.streak} />} label={t('today.streak')} />
        <StatChip fill icon="verified_user" value={<AnimatedNumber value={data.longest} />} label={t('insights.longest')} />
        <StatChip fill icon="calendar_today" value={<AnimatedNumber value={data.total} />} label={t('today.days')} />
      </motion.div>

      {/* What we notice */}
      <motion.section {...appear(4)} className="insights__section" aria-labelledby="ins-notes">
        <h2 id="ins-notes" className="text-title-m text-primary">{t('insights.notesTitle')}</h2>
        <GlassPanel gap={8}>
          {!enough && <p className="text-body-s text-secondary">{t('insights.notEnough', { n: MIN_DAYS_FOR_PATTERNS - data.total })}</p>}
          {enough && data.best >= 0 && <p className="text-body-m text-primary">{t('insights.noteDay', { day: WEEKDAY_NAMES[data.best] })}</p>}
          {enough && data.steadiest && <p className="text-body-m text-primary">{t('insights.noteSteady', { title: data.steadiest.title })}</p>}
          {data.now !== null && data.start !== null && Math.abs(data.now - data.start) >= 0.05 && (
            <button type="button" className="insights__link text-body-m text-primary" onClick={() => navigate('/progress/score')}>
              {t(data.now > data.start ? 'insights.noteUp' : 'insights.noteDown', { x: Math.abs(data.now - data.start).toFixed(1) })}
            </button>
          )}
        </GlassPanel>
      </motion.section>
      <Spacer />
    </Screen>
  );
}
