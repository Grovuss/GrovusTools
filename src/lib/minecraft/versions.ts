import { ENCHANTMENTS } from "./enchantments";
import { ITEMS } from "./items";
import type { Enchantment, MinecraftItem } from "./types";

/**
 * Version-aware wrapper around the Minecraft rules data. Only one version is
 * actually implemented today — everything the calculator uses (enchantment
 * multipliers, max levels, conflicts, item compatibility) lives behind this
 * object instead of being scattered through the app, so a future version
 * can be added by filling in a new entry here without touching the UI or
 * the optimizer.
 */
export interface MinecraftVersionData {
  id: string;
  label: string;
  enchantments: Enchantment[];
  items: MinecraftItem[];
  implemented: true;
}

export const MINECRAFT_VERSIONS: Record<string, MinecraftVersionData> = {
  "26.2": {
    id: "26.2",
    label: "Java Edition 26.2",
    enchantments: ENCHANTMENTS,
    items: ITEMS,
    implemented: true,
  },
};

export const CURRENT_VERSION = "26.2";

export function getVersionData(id: string = CURRENT_VERSION): MinecraftVersionData {
  const data = MINECRAFT_VERSIONS[id];
  if (!data) {
    throw new Error(`Minecraft version "${id}" is not implemented in Grovus yet.`);
  }
  return data;
}
