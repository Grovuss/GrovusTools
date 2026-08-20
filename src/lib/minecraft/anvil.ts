import { getEnchantment } from "./enchantments";
import { priorWorkPenalty, SURVIVAL_LEVEL_CAP } from "./xp";

export { priorWorkPenalty, SURVIVAL_LEVEL_CAP };

/**
 * Java Edition's enchantment-merge rule for two copies of the *same*
 * enchantment landing on one item.
 *
 *  - If the levels are equal, the result is one level higher (capped at the
 *    enchantment's max level).
 *  - If the levels differ, the result is simply the higher of the two — it
 *    is never possible to "add" two different levels together.
 *
 * Crucially, the anvil still charges based on the *resulting* level, not the
 * difference between the two levels — see `enchantContentCost`.
 */
export function mergeEnchantLevel(
  existingLevel: number,
  incomingLevel: number,
  maxLevel: number
): number {
  if (existingLevel <= 0) return Math.min(incomingLevel, maxLevel);
  if (incomingLevel <= 0) return Math.min(existingLevel, maxLevel);
  if (existingLevel === incomingLevel) {
    return Math.min(existingLevel + 1, maxLevel);
  }
  return Math.min(Math.max(existingLevel, incomingLevel), maxLevel);
}

/**
 * The anvil-level cost of transferring one enchantment into a target that
 * currently has `existingLevel` of it (0 if the target doesn't have it yet).
 * `viaBook` selects which of the enchantment's two multipliers applies.
 */
export function enchantContentCost(
  enchantId: string,
  existingLevel: number,
  incomingLevel: number,
  viaBook: boolean
): { resultLevel: number; cost: number } {
  const ench = getEnchantment(enchantId);
  const resultLevel = mergeEnchantLevel(existingLevel, incomingLevel, ench.maxLevel);
  const multiplier = viaBook ? ench.bookMultiplier : ench.itemMultiplier;
  return { resultLevel, cost: resultLevel * multiplier };
}

/** Total cost of one anvil operation combining a target and a sacrifice. */
export function combineOperationCost(
  targetPriorWork: number,
  sacrificePriorWork: number,
  contentCost: number
): number {
  return (
    priorWorkPenalty(targetPriorWork) + priorWorkPenalty(sacrificePriorWork) + contentCost
  );
}

/** The prior-work count of the item resulting from one anvil combine. */
export function resultingPriorWork(
  targetPriorWork: number,
  sacrificePriorWork: number
): number {
  return Math.max(targetPriorWork, sacrificePriorWork) + 1;
}

export function isTooExpensive(cost: number, ignoreCap: boolean): boolean {
  return !ignoreCap && cost >= SURVIVAL_LEVEL_CAP;
}
