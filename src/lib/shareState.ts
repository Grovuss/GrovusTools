import type { CalculatorInput, ItemCategory, OptimizationMode } from "./minecraft/types";
import { getEnchantment } from "./minecraft/enchantments";

/**
 * Encodes/decodes the enchantment calculator's state to and from URL query
 * parameters, so a configuration can be shared with a link and no database.
 * The URL is the single source of truth for shareable state — local storage
 * (see useLocalPref) is only used for incidental UI preferences.
 */
export function encodeStateToParams(input: CalculatorInput): URLSearchParams {
  const params = new URLSearchParams();
  params.set("item", input.itemId);
  if (input.itemPriorWork > 0) params.set("prior", String(input.itemPriorWork));
  if (input.newEnchants.length > 0) {
    params.set(
      "enchants",
      input.newEnchants.map((e) => `${e.enchantId}:${e.level}`).join(",")
    );
  }
  if (input.existingEnchants.length > 0) {
    params.set(
      "existing",
      input.existingEnchants.map((e) => `${e.enchantId}:${e.level}`).join(",")
    );
  }
  if (input.mode !== "levels") params.set("mode", input.mode);
  if (input.allowIncompatible) params.set("allow", "1");
  if (input.ignoreLevelCap) params.set("ignore", "1");
  return params;
}

function parseEnchantList(raw: string | null) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((pair) => {
      const [id, levelStr] = pair.split(":");
      if (!id || !levelStr) return null;
      try {
        getEnchantment(id);
      } catch {
        return null;
      }
      const level = Number(levelStr);
      if (!Number.isFinite(level) || level < 1) return null;
      return { enchantId: id, level };
    })
    .filter((x): x is { enchantId: string; level: number } => x !== null);
}

export function decodeStateFromParams(params: URLSearchParams): Partial<CalculatorInput> {
  const item = params.get("item") as ItemCategory | null;
  const prior = Number(params.get("prior") ?? "0");
  const mode = (params.get("mode") as OptimizationMode | null) ?? "levels";
  return {
    itemId: item ?? undefined,
    itemPriorWork: Number.isFinite(prior) ? prior : 0,
    newEnchants: parseEnchantList(params.get("enchants")),
    existingEnchants: parseEnchantList(params.get("existing")),
    mode: ["levels", "xp", "work"].includes(mode) ? mode : "levels",
    allowIncompatible: params.get("allow") === "1",
    ignoreLevelCap: params.get("ignore") === "1",
  };
}
