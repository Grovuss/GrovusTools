/**
 * Shared types for the Grovus Tools Minecraft calculation engine.
 *
 * Kept independent of React so the engine can be unit tested, reused by a
 * future CLI, or moved into a Web Worker without touching UI code.
 */

/** The set of item "slots" the enchantment calculator understands. */
export type ItemCategory =
  | "sword"
  | "pickaxe"
  | "axe"
  | "shovel"
  | "hoe"
  | "bow"
  | "crossbow"
  | "trident"
  | "mace"
  | "helmet"
  | "chestplate"
  | "leggings"
  | "boots"
  | "shield"
  | "fishing_rod";

/** UI grouping used for the enchantment search/category filters. */
export type EnchantCategory =
  | "combat"
  | "tools"
  | "armor"
  | "movement"
  | "utility"
  | "curses";

export interface Enchantment {
  id: string;
  name: string;
  shortName: string;
  maxLevel: number;
  /** Anvil cost multiplier when the source of the enchantment is a non-book item. */
  itemMultiplier: number;
  /** Anvil cost multiplier when the source of the enchantment is an enchanted book. */
  bookMultiplier: number;
  category: EnchantCategory;
  compatibleItems: ItemCategory[];
  /** IDs of enchantments that cannot coexist with this one. */
  conflictsWith: string[];
  curse?: boolean;
  description: string;
}

export interface MinecraftItem {
  id: ItemCategory;
  name: string;
  /** Path under /public to the item's pixel-art texture, or null if unavailable. */
  texture: string | null;
  group: "weapon" | "tool" | "armor" | "ranged" | "other";
}

/** A single enchantment + level, either newly requested or already on an item. */
export interface EnchantSelection {
  enchantId: string;
  level: number;
  /** Prior anvil-use count of the *book* this enchantment notionally comes from. */
  priorWork?: number;
}

export type OptimizationMode = "levels" | "xp" | "work";

export interface CalculatorInput {
  itemId: ItemCategory;
  /** "Prior Anvil Uses" already on the target item. */
  itemPriorWork: number;
  /** Enchantments already present on the target item. */
  existingEnchants: EnchantSelection[];
  /** New enchantments the user wants added, sourced as fresh books unless overridden. */
  newEnchants: EnchantSelection[];
  mode: OptimizationMode;
  allowIncompatible: boolean;
  ignoreLevelCap: boolean;
}

/** One node in the combine tree — either a leaf book/item or a merge result. */
export interface TreeNode {
  id: string;
  kind: "target" | "book" | "result";
  label: string;
  /** Enchantments carried by this node after it was formed. */
  enchants: EnchantSelection[];
  priorWork: number;
  children?: [TreeNode, TreeNode];
  /** Anvil level cost to produce this node from its two children (0 for leaves). */
  cost?: number;
  tooExpensive?: boolean;
}

export interface AnvilStep {
  index: number;
  leftLabel: string;
  rightLabel: string;
  leftEnchants: EnchantSelection[];
  rightEnchants: EnchantSelection[];
  cost: number;
  tooExpensive: boolean;
  resultEnchants: EnchantSelection[];
  resultPriorWork: number;
}

export interface OptimizerResult {
  success: boolean;
  totalCost: number;
  totalXp: number;
  largestStep: number;
  steps: AnvilStep[];
  tree: TreeNode | null;
  finalEnchants: EnchantSelection[];
  finalPriorWork: number;
  reason?: string;
}
