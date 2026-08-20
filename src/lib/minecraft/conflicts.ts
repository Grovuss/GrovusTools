import { getEnchantment } from "./enchantments";
import type { EnchantSelection } from "./types";

/** True if the two enchantment ids cannot normally coexist on one item. */
export function areConflicting(idA: string, idB: string): boolean {
  if (idA === idB) return false;
  const a = getEnchantment(idA);
  return a.conflictsWith.includes(idB);
}

/**
 * Given a set of enchantments already "locked in" (existing on the item, or
 * already chosen by the user), returns the ids that conflict with at least
 * one of them — used to grey out incompatible chips in the picker.
 */
export function conflictingWith(
  lockedIds: string[],
  candidateId: string
): string[] {
  const candidate = getEnchantment(candidateId);
  return lockedIds.filter(
    (id) => id !== candidateId && candidate.conflictsWith.includes(id)
  );
}

/** Checks a full selection list for internal conflicts (for validation/tests). */
export function findConflicts(
  selections: EnchantSelection[]
): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < selections.length; i++) {
    for (let j = i + 1; j < selections.length; j++) {
      const a = selections[i];
      const b = selections[j];
      if (a && b && areConflicting(a.enchantId, b.enchantId)) {
        pairs.push([a.enchantId, b.enchantId]);
      }
    }
  }
  return pairs;
}
