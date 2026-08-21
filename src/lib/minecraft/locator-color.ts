import { normalizeUuid } from "./uuid";

export interface LocatorColor {
  hex: string;
  r: number;
  g: number;
  b: number;
}

/**
 * Reverse-engineered Java Edition Locator Bar default color.
 *
 * Mirrors `java.util.UUID.hashCode()` — `(mostSigBits ^ leastSigBits)`
 * folded from 64 to 32 bits by XOR-ing its high and low halves — then reads
 * R/G/B out of that 32-bit hash and shades each channel by 0.9, the same
 * way Minecraft derives a player's default marker color from their UUID.
 * This is reverse-engineered behavior, not a documented Mojang contract, and
 * is only the *default* color (see the in-game override caveat in the UI).
 */
export function computeLocatorColor(uuidInput: string): LocatorColor | null {
  const normalized = normalizeUuid(uuidInput);
  if (!normalized) return null;
  const hex = normalized.replace(/-/g, "");

  const most = BigInt.asUintN(64, BigInt(`0x${hex.slice(0, 16)}`));
  const least = BigInt.asUintN(64, BigInt(`0x${hex.slice(16, 32)}`));
  const hilo = most ^ least;

  const high32 = BigInt.asIntN(32, BigInt.asUintN(64, hilo) >> 32n);
  const low32 = BigInt.asIntN(32, hilo & 0xffffffffn);
  const hash = Number(BigInt.asIntN(32, high32 ^ low32));

  const r = Math.floor(((hash >> 16) & 0xff) * 0.9);
  const g = Math.floor(((hash >> 8) & 0xff) * 0.9);
  const b = Math.floor((hash & 0xff) * 0.9);

  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, r, g, b };
}
