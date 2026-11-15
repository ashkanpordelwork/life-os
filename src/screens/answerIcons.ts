import type { IconName } from '../components/Icon';
import type { Area } from '../data/types';

/** Icon for each answer (owner decision: Hugeicons, no emoji). Order matches the answers, worst to best. */
export const ANSWER_ICONS: Record<Area, IconName[]> = {
  Movement: ['chair', 'directions_walk', 'running_shoes', 'workout_run'],
  Nutrition: ['skip', 'cookie', 'sandwich', 'salad'],
  Sleep: ['local_cafe', 'sleeping', 'face_smile', 'sunrise'],
  Mind: ['alert', 'face_neutral', 'face_smile', 'self_improvement'],
};
