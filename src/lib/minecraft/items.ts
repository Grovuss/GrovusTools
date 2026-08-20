import type { ItemCategory, MinecraftItem } from "./types";

/**
 * One representative item per enchantable slot. Textures point at the
 * diamond/iron-tier art pulled from the supplied texture pack (see
 * /public/textures/item and README "Texture assets"). Where the pack has no
 * dedicated icon (shield has no flat GUI icon in vanilla — it's rendered
 * from a 3D model) `texture` is null and the UI falls back to a Lucide icon.
 */
export const ITEMS: MinecraftItem[] = [
  { id: "sword", name: "Sword", texture: "/textures/item/diamond_sword.png", group: "weapon" },
  { id: "pickaxe", name: "Pickaxe", texture: "/textures/item/diamond_pickaxe.png", group: "tool" },
  { id: "axe", name: "Axe", texture: "/textures/item/diamond_axe.png", group: "tool" },
  { id: "shovel", name: "Shovel", texture: "/textures/item/diamond_shovel.png", group: "tool" },
  { id: "hoe", name: "Hoe", texture: "/textures/item/diamond_hoe.png", group: "tool" },
  { id: "bow", name: "Bow", texture: "/textures/item/bow.png", group: "ranged" },
  { id: "crossbow", name: "Crossbow", texture: "/textures/item/crossbow_standby.png", group: "ranged" },
  { id: "trident", name: "Trident", texture: "/textures/item/trident.png", group: "weapon" },
  { id: "mace", name: "Mace", texture: "/textures/item/mace.png", group: "weapon" },
  { id: "helmet", name: "Helmet", texture: "/textures/item/diamond_helmet.png", group: "armor" },
  { id: "chestplate", name: "Chestplate", texture: "/textures/item/diamond_chestplate.png", group: "armor" },
  { id: "leggings", name: "Leggings", texture: "/textures/item/diamond_leggings.png", group: "armor" },
  { id: "boots", name: "Boots", texture: "/textures/item/diamond_boots.png", group: "armor" },
  { id: "shield", name: "Shield", texture: null, group: "other" },
  { id: "fishing_rod", name: "Fishing Rod", texture: "/textures/item/fishing_rod.png", group: "other" },
];

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export function getItem(id: ItemCategory): MinecraftItem {
  const item = BY_ID.get(id);
  if (!item) throw new Error(`Unknown item id: ${id}`);
  return item;
}

export const BOOK_TEXTURE = "/textures/item/book.png";
export const ENCHANTED_BOOK_TEXTURE = "/textures/item/enchanted_book.png";
