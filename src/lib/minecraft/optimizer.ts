import { getEnchantment } from "./enchantments";
import { findConflicts } from "./conflicts";
import {
  combineOperationCost,
  mergeEnchantLevel,
  priorWorkPenalty,
  resultingPriorWork,
  isTooExpensive,
} from "./anvil";
import { totalXpToReachLevel } from "./xp";
import type {
  AnvilStep,
  CalculatorInput,
  EnchantSelection,
  OptimizerResult,
  TreeNode,
} from "./types";

/**
 * ## How Grovus finds the cheapest anvil order
 *
 * New enchantments are always sourced as fresh enchanted books (this mirrors
 * how players actually use these calculators — enchant/trade for books,
 * then plan the anvil work — and matches the anvil's own book-cost rule).
 * Because each requested enchantment id is distinct (the UI lets you pick a
 * *level* per enchantment, not multiple separate book sources of the same
 * enchantment), the level that finally lands on the target for a given
 * enchantment never depends on tree shape — only on the target's starting
 * level for that enchantment. What *does* depend on tree shape is:
 *
 *   1. How many separate operations touch the target item directly (each
 *      one grows the target's own prior-work penalty: 0, 1, 3, 7, 15, 31…).
 *   2. Whether books get pre-combined before reaching the target. Every
 *      pre-combine is a real anvil operation and *re-charges* the content of
 *      every enchantment that changes hands in it — so grouping several
 *      enchantments into one book before applying it to the item costs more
 *      in total levels than applying them one at a time, but touches the
 *      target fewer times. That trade-off is the actual optimization
 *      problem.
 *
 * Grovus resolves it with a subset dynamic program (Held–Karp style): for
 * every subset of the requested enchantments, it tracks the best
 * (non-dominated) ways to have merged that subset into the target so far,
 * then extends each state by trying every way to bundle a chunk of the
 * *remaining* enchantments into one more application. This is the same
 * "binary-tree partition" idea used by other open-source anvil calculators,
 * implemented independently here. For unusually large enchantment counts
 * (more than the exact-search cutoff) it falls back to a documented greedy
 * heuristic so the browser never freezes — see `EXACT_SEARCH_CUTOFF` below.
 */
const EXACT_SEARCH_CUTOFF = 10;

interface Frontier {
  levelSum: number;
  xpSum: number;
  pw: number;
  prevMask: number;
  prevPointIndex: number;
  group: GroupPlan | null;
}

interface GroupPlan {
  /** Enchant ids in the order they were chained into the carrier book. */
  order: string[];
  internalSteps: InternalStep[];
  carrierPriorWork: number;
  finalStepCost: number;
  finalStepTooExpensive: boolean;
}

interface InternalStep {
  carrierIdsBefore: string[];
  addedId: string;
  cost: number;
  tooExpensive: boolean;
  resultPriorWork: number;
}

function leafPriorWork(input: CalculatorInput, enchantId: string): number {
  const sel = input.newEnchants.find((e) => e.enchantId === enchantId);
  return sel?.priorWork ?? 0;
}

function levelOf(input: CalculatorInput, enchantId: string): number {
  const sel = input.newEnchants.find((e) => e.enchantId === enchantId);
  return sel?.level ?? 0;
}

function existingLevelOf(input: CalculatorInput, enchantId: string): number {
  const sel = input.existingEnchants.find((e) => e.enchantId === enchantId);
  return sel?.level ?? 0;
}

/** Cost of transferring `enchantId` (via book) into a target that has `existingLevel`. */
function arrivalCost(enchantId: string, existingLevel: number, incomingLevel: number) {
  const ench = getEnchantment(enchantId);
  const resultLevel = mergeEnchantLevel(existingLevel, incomingLevel, ench.maxLevel);
  return { resultLevel, cost: resultLevel * ench.bookMultiplier };
}

/**
 * Builds the cheapest internal chain for a group of enchant ids being
 * combined into a single carrier book, and the cost of finally applying
 * that carrier to the target (given the target's starting enchant levels
 * and prior work at the moment this group is applied).
 */
function planGroup(
  input: CalculatorInput,
  ids: string[],
  targetPriorWorkAtApplication: number
): GroupPlan {
  // Standalone book cost for each id (used to choose the carrier: the id
  // that would be most expensive to re-charge is kept as the "never
  // sacrificed" carrier so its content is only ever paid once).
  const standaloneCost = new Map(
    ids.map((id) => {
      const ench = getEnchantment(id);
      return [id, levelOf(input, id) * ench.bookMultiplier] as const;
    })
  );

  const sorted = [...ids].sort((a, b) => (standaloneCost.get(b) ?? 0) - (standaloneCost.get(a) ?? 0));
  const carrierRoot = sorted[0] as string;
  // Remaining leaves merge in ascending prior-work order to minimize the
  // carrier's resulting prior work (relevant only when advanced per-book
  // overrides are used — with defaults every leaf starts at 0).
  const remaining = sorted
    .slice(1)
    .sort((a, b) => leafPriorWork(input, a) - leafPriorWork(input, b));

  let carrierIds = [carrierRoot];
  let carrierPW = leafPriorWork(input, carrierRoot);
  const internalSteps: InternalStep[] = [];

  for (const id of remaining) {
    const leafPW = leafPriorWork(input, id);
    const cost = combineOperationCost(
      carrierPW,
      leafPW,
      levelOf(input, id) * getEnchantment(id).bookMultiplier
    );
    const tooExpensive = isTooExpensive(cost, input.ignoreLevelCap);
    const newPW = resultingPriorWork(carrierPW, leafPW);
    internalSteps.push({
      carrierIdsBefore: [...carrierIds],
      addedId: id,
      cost,
      tooExpensive,
      resultPriorWork: newPW,
    });
    carrierIds = [...carrierIds, id];
    carrierPW = newPW;
  }

  const contentCost = ids.reduce((sum, id) => {
    const { cost } = arrivalCost(id, existingLevelOf(input, id), levelOf(input, id));
    return sum + cost;
  }, 0);
  const finalStepCost = combineOperationCost(
    targetPriorWorkAtApplication,
    carrierPW,
    contentCost
  );

  return {
    order: [carrierRoot, ...remaining],
    internalSteps,
    carrierPriorWork: carrierPW,
    finalStepCost,
    finalStepTooExpensive: isTooExpensive(finalStepCost, input.ignoreLevelCap),
  };
}

function xpOf(cost: number): number {
  return totalXpToReachLevel(cost);
}

/** Returns true if `a` is at least as good as `b` on every tracked metric. */
function dominates(a: Frontier, b: Frontier): boolean {
  return a.levelSum <= b.levelSum && a.xpSum <= b.xpSum && a.pw <= b.pw;
}

function pushFrontier(list: Frontier[], candidate: Frontier) {
  for (const existing of list) {
    if (dominates(existing, candidate)) return;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (dominates(candidate, list[i] as Frontier)) list.splice(i, 1);
  }
  list.push(candidate);
}

function bestByMode(list: Frontier[], mode: CalculatorInput["mode"]): Frontier | null {
  if (list.length === 0) return null;
  return list.reduce((best, cur) => {
    if (mode === "xp") {
      if (cur.xpSum !== best.xpSum) return cur.xpSum < best.xpSum ? cur : best;
    } else if (mode === "work") {
      if (cur.pw !== best.pw) return cur.pw < best.pw ? cur : best;
    } else {
      if (cur.levelSum !== best.levelSum) return cur.levelSum < best.levelSum ? cur : best;
    }
    return cur.levelSum < best.levelSum ? cur : best;
  });
}

export function validateSelection(input: CalculatorInput): string | null {
  if (!input.allowIncompatible) {
    const all: EnchantSelection[] = [...input.existingEnchants, ...input.newEnchants];
    const conflicts = findConflicts(all);
    if (conflicts.length > 0) {
      const [a, b] = conflicts[0] as [string, string];
      return `${getEnchantment(a).name} conflicts with ${getEnchantment(b).name}. Enable "Allow incompatible enchantments" in Advanced Options to override.`;
    }
  }
  const item = input.itemId;
  for (const sel of input.newEnchants) {
    const ench = getEnchantment(sel.enchantId);
    if (!ench.compatibleItems.includes(item)) {
      return `${ench.name} cannot be applied to this item.`;
    }
    if (sel.level < 1 || sel.level > ench.maxLevel) {
      return `${ench.name} level must be between 1 and ${ench.maxLevel}.`;
    }
  }
  return null;
}

function greedyFallback(input: CalculatorInput, ids: string[]): OptimizerResult {
  // Practical heuristic for unusually large enchantment counts: apply
  // enchantments to the target directly, one at a time, cheapest content
  // first. This avoids the double-charge penalty of pre-merging entirely,
  // trading it for faster prior-work growth — a reasonable default when an
  // exact search would be too slow for the browser.
  const order = [...ids].sort((a, b) => {
    const ca = arrivalCost(a, existingLevelOf(input, a), levelOf(input, a)).cost;
    const cb = arrivalCost(b, existingLevelOf(input, b), levelOf(input, b)).cost;
    return ca - cb;
  });

  let targetEnchants: EnchantSelection[] = [...input.existingEnchants];
  let targetPW = input.itemPriorWork;
  let tree: TreeNode = {
    id: "target",
    kind: "target",
    label: "Your Item",
    enchants: targetEnchants,
    priorWork: targetPW,
  };
  const steps: AnvilStep[] = [];
  let totalCost = 0;
  let totalXp = 0;
  let largestStep = 0;
  let anyTooExpensive = false;

  order.forEach((id, i) => {
    const ench = getEnchantment(id);
    const level = levelOf(input, id);
    const existing = existingLevelOf(input, id);
    const { resultLevel, cost: contentCost } = arrivalCost(id, existing, level);
    const bookPW = leafPriorWork(input, id);
    const cost = combineOperationCost(targetPW, bookPW, contentCost);
    const tooExpensive = isTooExpensive(cost, input.ignoreLevelCap);
    anyTooExpensive = anyTooExpensive || tooExpensive;
    const newPW = resultingPriorWork(targetPW, bookPW);
    const bookNode: TreeNode = {
      id: `book-${id}`,
      kind: "book",
      label: `${ench.name} ${toRoman(level)}`,
      enchants: [{ enchantId: id, level }],
      priorWork: bookPW,
    };
    const resultEnchants = mergeSelections(targetEnchants, [{ enchantId: id, level }]);
    const newTree: TreeNode = {
      id: `step-${i}`,
      kind: "result",
      label: i === order.length - 1 ? "Result" : `Step ${i + 1}`,
      enchants: resultEnchants,
      priorWork: newPW,
      children: [tree, bookNode],
      cost,
      tooExpensive,
    };
    steps.push({
      index: i + 1,
      leftLabel: tree.label,
      rightLabel: bookNode.label,
      leftEnchants: tree.enchants,
      rightEnchants: bookNode.enchants,
      cost,
      tooExpensive,
      resultEnchants,
      resultPriorWork: newPW,
    });
    totalCost += cost;
    totalXp += xpOf(cost);
    largestStep = Math.max(largestStep, cost);
    tree = newTree;
    targetEnchants = resultEnchants;
    targetPW = newPW;
    void resultLevel;
  });

  return {
    success: !anyTooExpensive,
    totalCost,
    totalXp,
    largestStep,
    steps,
    tree,
    finalEnchants: targetEnchants,
    finalPriorWork: targetPW,
    reason: anyTooExpensive
      ? "No valid survival anvil sequence found. Even the cheapest ordering exceeds the 39-level anvil limit from the current starting state. Try changing the starting item, prior-work count, or enchantments, or enable \"Ignore 39-level limit\"."
      : undefined,
  };
}

function mergeSelections(
  base: EnchantSelection[],
  incoming: EnchantSelection[]
): EnchantSelection[] {
  const map = new Map(base.map((s) => [s.enchantId, s.level]));
  for (const s of incoming) {
    const ench = getEnchantment(s.enchantId);
    const existing = map.get(s.enchantId) ?? 0;
    map.set(s.enchantId, mergeEnchantLevel(existing, s.level, ench.maxLevel));
  }
  return Array.from(map.entries()).map(([enchantId, level]) => ({ enchantId, level }));
}

export function toRoman(n: number): string {
  const numerals: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = n;
  let out = "";
  for (const [value, symbol] of numerals) {
    while (remaining >= value) {
      out += symbol;
      remaining -= value;
    }
  }
  return out || "0";
}

export function runOptimizer(input: CalculatorInput): OptimizerResult {
  const validationError = validateSelection(input);
  if (validationError) {
    return {
      success: false,
      totalCost: 0,
      totalXp: 0,
      largestStep: 0,
      steps: [],
      tree: null,
      finalEnchants: input.existingEnchants,
      finalPriorWork: input.itemPriorWork,
      reason: validationError,
    };
  }

  // De-dupe + sort new enchantments into a canonical order so identical
  // inputs always produce identical (deterministic) results.
  const ids = Array.from(new Set(input.newEnchants.map((e) => e.enchantId))).sort();

  if (ids.length === 0) {
    return {
      success: true,
      totalCost: 0,
      totalXp: 0,
      largestStep: 0,
      steps: [],
      tree: {
        id: "target",
        kind: "target",
        label: "Your Item",
        enchants: input.existingEnchants,
        priorWork: input.itemPriorWork,
      },
      finalEnchants: input.existingEnchants,
      finalPriorWork: input.itemPriorWork,
    };
  }

  if (ids.length > EXACT_SEARCH_CUTOFF) {
    return greedyFallback(input, ids);
  }

  const n = ids.length;
  const fullMask = (1 << n) - 1;
  const dp: Frontier[][] = Array.from({ length: fullMask + 1 }, () => []);
  dp[0] = [{ levelSum: 0, xpSum: 0, pw: input.itemPriorWork, prevMask: -1, prevPointIndex: -1, group: null }];

  // Cache group plans per (sourceMask, submask) to avoid recomputation —
  // the plan's *internal* structure doesn't depend on the target's prior
  // work, only the final application step does, so we compute the
  // reusable part once per submask and re-price the final step per source pw.
  const groupCache = new Map<number, Omit<GroupPlan, "finalStepCost" | "finalStepTooExpensive">>();

  function groupSkeleton(mask: number): Omit<GroupPlan, "finalStepCost" | "finalStepTooExpensive"> {
    const cached = groupCache.get(mask);
    if (cached) return cached;
    const groupIds = ids.filter((_, i) => mask & (1 << i));
    const plan = planGroup(input, groupIds, 0);
    const skeleton = {
      order: plan.order,
      internalSteps: plan.internalSteps,
      carrierPriorWork: plan.carrierPriorWork,
    };
    groupCache.set(mask, skeleton);
    return skeleton;
  }

  for (let mask = 0; mask <= fullMask; mask++) {
    const frontier = dp[mask];
    if (!frontier || frontier.length === 0) continue;
    const remainderMask = fullMask & ~mask;
    if (remainderMask === 0) continue;

    // Enumerate every nonempty submask of the remainder (standard trick).
    for (let sub = remainderMask; sub > 0; sub = (sub - 1) & remainderMask) {
      const groupIds = ids.filter((_, i) => sub & (1 << i));
      const contentCost = groupIds.reduce((sum, id) => {
        return sum + arrivalCost(id, existingLevelOf(input, id), levelOf(input, id)).cost;
      }, 0);
      const skeleton = groupSkeleton(sub);
      const internalCostSum = skeleton.internalSteps.reduce((s, st) => s + st.cost, 0);
      const internalXpSum = skeleton.internalSteps.reduce((s, st) => s + xpOf(st.cost), 0);
      const internalInvalid =
        !input.ignoreLevelCap && skeleton.internalSteps.some((st) => st.tooExpensive);
      if (internalInvalid) continue;

      for (let pi = 0; pi < frontier.length; pi++) {
        const point = frontier[pi];
        if (!point) continue;
        const finalStepCost = combineOperationCost(point.pw, skeleton.carrierPriorWork, contentCost);
        if (isTooExpensive(finalStepCost, input.ignoreLevelCap)) continue;
        const newPW = resultingPriorWork(point.pw, skeleton.carrierPriorWork);
        const candidate: Frontier = {
          levelSum: point.levelSum + internalCostSum + finalStepCost,
          xpSum: point.xpSum + internalXpSum + xpOf(finalStepCost),
          pw: newPW,
          prevMask: mask,
          prevPointIndex: pi,
          group: {
            order: skeleton.order,
            internalSteps: skeleton.internalSteps,
            carrierPriorWork: skeleton.carrierPriorWork,
            finalStepCost,
            finalStepTooExpensive: false,
          },
        };
        const targetList = dp[mask | sub];
        if (targetList) pushFrontier(targetList, candidate);
      }
    }
  }

  const finalFrontier = dp[fullMask];
  const chosen = finalFrontier ? bestByMode(finalFrontier, input.mode) : null;

  if (!chosen) {
    // No valid path under the cap — report the greedy attempt's shortfall
    // so the person sees *why*, rather than a bare failure.
    const fallback = greedyFallback(input, ids);
    return {
      ...fallback,
      success: false,
      reason:
        "No valid survival anvil sequence found. The selected enchantments cannot be combined within Minecraft's 39-level anvil limit from the current starting state. Try changing the starting item, prior-work count, or enchantments, or enable \"Ignore 39-level limit\" for a theoretical result.",
    };
  }

  // Walk backpointers to recover the ordered list of groups actually chosen.
  const groupSequence: Frontier[] = [];
  let cur: Frontier | null = chosen;
  while (cur && cur.prevMask >= 0) {
    groupSequence.push(cur);
    const prevList: Frontier[] | undefined = dp[cur.prevMask];
    cur = prevList ? prevList[cur.prevPointIndex] ?? null : null;
  }
  groupSequence.reverse();

  // Rebuild the tree + step list in forward order.
  let targetNode: TreeNode = {
    id: "target",
    kind: "target",
    label: "Your Item",
    enchants: input.existingEnchants,
    priorWork: input.itemPriorWork,
  };
  const steps: AnvilStep[] = [];
  let stepIndex = 0;

  for (const g of groupSequence) {
    const plan = g.group as GroupPlan;
    let carrierNode: TreeNode = {
      id: `leaf-${plan.order[0]}`,
      kind: "book",
      label: bookLabel(input, plan.order[0] as string),
      enchants: [{ enchantId: plan.order[0] as string, level: levelOf(input, plan.order[0] as string) }],
      priorWork: leafPriorWork(input, plan.order[0] as string),
    };

    for (const step of plan.internalSteps) {
      const leafNode: TreeNode = {
        id: `leaf-${step.addedId}`,
        kind: "book",
        label: bookLabel(input, step.addedId),
        enchants: [{ enchantId: step.addedId, level: levelOf(input, step.addedId) }],
        priorWork: leafPriorWork(input, step.addedId),
      };
      const resultEnchants = mergeSelections(carrierNode.enchants, leafNode.enchants);
      stepIndex++;
      steps.push({
        index: stepIndex,
        leftLabel: carrierNode.label,
        rightLabel: leafNode.label,
        leftEnchants: carrierNode.enchants,
        rightEnchants: leafNode.enchants,
        cost: step.cost,
        tooExpensive: step.tooExpensive,
        resultEnchants,
        resultPriorWork: step.resultPriorWork,
      });
      carrierNode = {
        id: `merge-${stepIndex}`,
        kind: "result",
        label: "Combined Book",
        enchants: resultEnchants,
        priorWork: step.resultPriorWork,
        children: [carrierNode, leafNode],
        cost: step.cost,
        tooExpensive: step.tooExpensive,
      };
    }

    const resultEnchants = mergeSelections(targetNode.enchants, carrierNode.enchants);
    const newPW = resultingPriorWork(targetNode.priorWork, carrierNode.priorWork);
    stepIndex++;
    steps.push({
      index: stepIndex,
      leftLabel: targetNode.label,
      rightLabel: carrierNode.label,
      leftEnchants: targetNode.enchants,
      rightEnchants: carrierNode.enchants,
      cost: plan.finalStepCost,
      tooExpensive: plan.finalStepTooExpensive,
      resultEnchants,
      resultPriorWork: newPW,
    });
    targetNode = {
      id: `merge-${stepIndex}`,
      kind: "result",
      label: "Your Item",
      enchants: resultEnchants,
      priorWork: newPW,
      children: [targetNode, carrierNode],
      cost: plan.finalStepCost,
      tooExpensive: plan.finalStepTooExpensive,
    };
  }
  targetNode.label = "Result";

  return {
    success: true,
    totalCost: chosen.levelSum,
    totalXp: chosen.xpSum,
    largestStep: steps.reduce((m, s) => Math.max(m, s.cost), 0),
    steps,
    tree: targetNode,
    finalEnchants: targetNode.enchants,
    finalPriorWork: targetNode.priorWork,
  };
}

function bookLabel(input: CalculatorInput, enchantId: string): string {
  const ench = getEnchantment(enchantId);
  const level = levelOf(input, enchantId);
  return `${ench.name} ${toRoman(level)}`;
}
