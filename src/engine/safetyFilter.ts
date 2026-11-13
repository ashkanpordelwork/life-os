import type { ChecklistItem } from '../data/types';
import { SAFETY_RULES, type SafetyContext, type SafetyRule } from '../data/safetyRules';

/** Step 1. Remove every item that a safety rule blocks. */
export function safetyFilter(
  items: ChecklistItem[],
  ctx: SafetyContext,
  rules: SafetyRule[] = SAFETY_RULES,
): ChecklistItem[] {
  return items.filter((item) => !rules.some((rule) => rule.blocks(item, ctx)));
}
