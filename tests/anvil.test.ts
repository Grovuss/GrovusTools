import { describe, it, expect } from "vitest";
import { priorWorkPenalty, mergeEnchantLevel, isTooExpensive } from "@/lib/minecraft/anvil";
import { SURVIVAL_LEVEL_CAP } from "@/lib/minecraft/xp";

describe("priorWorkPenalty", () => {
  it("matches the 2^n - 1 sequence", () => {
    expect(priorWorkPenalty(0)).toBe(0);
    expect(priorWorkPenalty(1)).toBe(1);
    expect(priorWorkPenalty(2)).toBe(3);
    expect(priorWorkPenalty(3)).toBe(7);
    expect(priorWorkPenalty(4)).toBe(15);
    expect(priorWorkPenalty(5)).toBe(31);
    expect(priorWorkPenalty(6)).toBe(63);
  });
});

describe("mergeEnchantLevel", () => {
  it("bumps equal levels by one, capped at max", () => {
    expect(mergeEnchantLevel(3, 3, 5)).toBe(4); // Sharpness III + III = IV
    expect(mergeEnchantLevel(5, 5, 5)).toBe(5); // already at max, stays at max
  });

  it("never adds unequal levels together", () => {
    expect(mergeEnchantLevel(5, 3, 5)).toBe(5); // Sharpness V + III must stay V, not VI
    expect(mergeEnchantLevel(3, 5, 5)).toBe(5);
  });

  it("takes the incoming level when the target has none", () => {
    expect(mergeEnchantLevel(0, 4, 5)).toBe(4);
  });
});

describe("39-level cap", () => {
  it("treats 39 as valid and 40 as too expensive", () => {
    expect(isTooExpensive(39, false)).toBe(false);
    expect(isTooExpensive(40, false)).toBe(true);
    expect(SURVIVAL_LEVEL_CAP).toBe(40);
  });

  it("can be ignored for theoretical calculations", () => {
    expect(isTooExpensive(999, true)).toBe(false);
  });
});
