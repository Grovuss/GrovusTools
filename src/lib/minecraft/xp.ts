/**
 * Java Edition experience curve helpers.
 *
 * `totalXpToReachLevel` is the standard cumulative XP-points formula used by
 * Java Edition to determine how many XP points a player has consumed by the
 * time they reach a given level. It is piecewise, with the point cost per
 * level increasing as the player gets higher — this is what makes "cheapest
 * total levels" and "cheapest actual XP" different questions once an anvil
 * plan involves several steps of different sizes.
 */
export function totalXpToReachLevel(level: number): number {
  const n = Math.max(0, Math.floor(level));
  if (n <= 16) return n * n + 6 * n;
  if (n <= 31) return 2.5 * n * n - 40.5 * n + 360;
  return 4.5 * n * n - 162.5 * n + 2220;
}

/**
 * The anvil's "prior work" penalty. Every time an item goes through the
 * anvil, its internal use-count increases by one, and each future operation
 * adds a flat penalty of (2^uses - 1) levels on top of the enchantment cost.
 *
 *   uses:    0  1  2  3  4   5   6
 *   penalty: 0  1  3  7  15  31  63
 */
export function priorWorkPenalty(uses: number): number {
  const n = Math.max(0, Math.floor(uses));
  return Math.pow(2, n) - 1;
}

/** Survival anvils reject any single operation costing 40 levels or more. */
export const SURVIVAL_LEVEL_CAP = 40;
