import type { Checkin, Profile, TribeStatus } from '../backend/types';
import { getItem } from '../data';
import type { Area, ChecklistItem, Sprint } from '../data/types';
import { AREAS } from '../data/types';
import { REST_ID, areaScoresFromAnswers, currentStreak, overallScore, themeFor, type AnswerIndex } from '../engine';

export interface ShareSettings { patches: boolean; score: boolean }

/** Daily patches of a Sprint (weekly ones are optional on any given day). */
export function dailyPatches(sprint: Sprint | null): ChecklistItem[] {
  const items = (sprint?.patch_ids ?? []).map(getItem).filter((x): x is ChecklistItem => !!x);
  const daily = items.filter((i) => !i.per_week);
  return daily.length ? daily : items;
}

/** The snapshot a member shows their Tribes. Health answers and symptoms are never included. */
export function buildStatus(userId: string, profile: Profile | null, sprint: Sprint | null, checkins: Checkin[], today: string, share: ShareSettings): TribeStatus {
  const daily = dailyPatches(sprint);
  const doneToday = new Set(checkins.filter((c) => c.day === today && c.item_id !== REST_ID).map((c) => c.item_id));
  const all = (sprint?.patch_ids ?? []).map(getItem).filter((x): x is ChecklistItem => !!x);
  const a = profile?.answers;
  const full = !!a && AREAS.every((k) => a[k] !== undefined);
  return {
    user_id: userId,
    display_name: profile?.name ?? '',
    day: today,
    done: daily.filter((i) => doneToday.has(i.id)).length,
    total: daily.length,
    streak: currentStreak(checkins, today),
    patch_titles: share.patches ? all.map((i) => i.title) : null,
    sprint_number: sprint?.number ?? null,
    sprint_theme: sprint ? (sprint.theme ?? themeFor(all)) : null,
    score: share.score && full ? Math.round(overallScore(areaScoresFromAnswers(a as Record<Area, AnswerIndex>)) * 10) / 10 : null,
    share_patches: share.patches,
    share_score: share.score,
  };
}
