import { describe, it, expect } from "vitest";
import { runOptimizer } from "@/lib/minecraft/optimizer";
import { enchantContentCost, combineOperationCost } from "@/lib/minecraft/anvil";
import type { CalculatorInput } from "@/lib/minecraft/types";

function baseInput(overrides: Partial<CalculatorInput> = {}): CalculatorInput {
  return {
    itemId: "sword",
    itemPriorWork: 0,
    existingEnchants: [],
    newEnchants: [],
    mode: "levels",
    allowIncompatible: false,
    ignoreLevelCap: false,
    ...overrides,
  };
}

describe("runOptimizer", () => {
  it("costs a single fresh enchantment as multiplier * level", () => {
    const result = runOptimizer(
      baseInput({ newEnchants: [{ enchantId: "sharpness", level: 5 }] })
    );
    expect(result.success).toBe(true);
    expect(result.totalCost).toBe(5); // Sharpness is common: book multiplier 1
    expect(result.steps).toHaveLength(1);
  });

  it("prefers applying independent enchantments directly over pre-merging books", () => {
    // Sharpness V + Unbreaking III on a fresh sword: applying each book
    // straight to the sword (9 levels total) beats combining the books
    // together first (12 levels total, since content gets re-charged).
    const result = runOptimizer(
      baseInput({
        newEnchants: [
          { enchantId: "sharpness", level: 5 },
          { enchantId: "unbreaking", level: 3 },
        ],
      })
    );
    expect(result.success).toBe(true);
    expect(result.totalCost).toBe(9);
    expect(result.steps).toHaveLength(2);
  });

  it("merges an existing enchantment with a new one of the same level", () => {
    const result = runOptimizer(
      baseInput({
        existingEnchants: [{ enchantId: "sharpness", level: 3 }],
        newEnchants: [{ enchantId: "sharpness", level: 3 }],
      })
    );
    expect(result.success).toBe(true);
    expect(result.finalEnchants.find((e) => e.enchantId === "sharpness")?.level).toBe(4);
  });

  it("does not overshoot the max level when combining unequal levels", () => {
    const result = runOptimizer(
      baseInput({
        existingEnchants: [{ enchantId: "sharpness", level: 5 }],
        newEnchants: [{ enchantId: "sharpness", level: 3 }],
      })
    );
    expect(result.finalEnchants.find((e) => e.enchantId === "sharpness")?.level).toBe(5);
  });

  it("blocks conflicting enchantments unless allowIncompatible is set", () => {
    const blocked = runOptimizer(
      baseInput({
        newEnchants: [
          { enchantId: "sharpness", level: 5 },
          { enchantId: "smite", level: 5 },
        ],
      })
    );
    expect(blocked.success).toBe(false);
    expect(blocked.reason).toMatch(/conflicts with/i);

    const forced = runOptimizer(
      baseInput({
        allowIncompatible: true,
        newEnchants: [
          { enchantId: "sharpness", level: 5 },
          { enchantId: "smite", level: 5 },
        ],
      })
    );
    expect(forced.success).toBe(true);
  });

  it("reports TOO EXPENSIVE when even the best order exceeds the 39-level cap", () => {
    const result = runOptimizer(
      baseInput({
        itemPriorWork: 6, // penalty already 63 on its own
        newEnchants: [{ enchantId: "unbreaking", level: 3 }],
      })
    );
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/39-level/i);
  });

  it("ignoreLevelCap allows a theoretical over-cap result", () => {
    const result = runOptimizer(
      baseInput({
        itemPriorWork: 6,
        ignoreLevelCap: true,
        newEnchants: [{ enchantId: "unbreaking", level: 3 }],
      })
    );
    expect(result.success).toBe(true);
    expect(result.totalCost).toBeGreaterThanOrEqual(40);
  });

  it("is deterministic across repeated runs and enchantment orderings", () => {
    const a = runOptimizer(
      baseInput({
        newEnchants: [
          { enchantId: "sharpness", level: 5 },
          { enchantId: "looting", level: 3 },
          { enchantId: "unbreaking", level: 3 },
          { enchantId: "mending", level: 1 },
        ],
      })
    );
    const b = runOptimizer(
      baseInput({
        newEnchants: [
          { enchantId: "mending", level: 1 },
          { enchantId: "unbreaking", level: 3 },
          { enchantId: "looting", level: 3 },
          { enchantId: "sharpness", level: 5 },
        ],
      })
    );
    expect(a.totalCost).toBe(b.totalCost);
    expect(a.totalCost).toBe(a.totalCost); // stable / re-runnable
    const c = runOptimizer(
      baseInput({
        newEnchants: [
          { enchantId: "sharpness", level: 5 },
          { enchantId: "looting", level: 3 },
          { enchantId: "unbreaking", level: 3 },
          { enchantId: "mending", level: 1 },
        ],
      })
    );
    expect(a.totalCost).toBe(c.totalCost);
  });
});

describe("left/right ordering asymmetry", () => {
  it("charges only the sacrifice side's unique enchantment content", () => {
    // Item A: Looting III (expensive, mult 4). Item B: Unbreaking III (cheap, mult 1).
    const aIntoB = enchantContentCost("looting", 0, 3, true); // transferring Looting into B
    const bIntoA = enchantContentCost("unbreaking", 0, 3, true); // transferring Unbreaking into A
    const costBTargetATarget = combineOperationCost(0, 0, aIntoB.cost); // B is target, absorbs A's Looting
    const costATargetBSac = combineOperationCost(0, 0, bIntoA.cost); // A is target, absorbs B's Unbreaking
    expect(costBTargetATarget).not.toBe(costATargetBSac);
    // Cheaper overall to make the pricier enchantment (Looting) the one that
    // stays resident (target) and charge only the cheaper sacrifice.
    expect(costATargetBSac).toBeLessThan(costBTargetATarget);
  });
});
