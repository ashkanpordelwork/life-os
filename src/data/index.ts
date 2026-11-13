import type { ChecklistItem } from './types';
import itemsJson from './items.json';

export * from './types';

/** Level-1 starter items (SL01, SL04, SL11a/b, EX01a–d, NU02a/b, NU03a, ST01a, ST04, FM05). */
export const ITEMS = itemsJson as ChecklistItem[];

export function getItem(id: string): ChecklistItem | undefined {
  return ITEMS.find((i) => i.id === id);
}
