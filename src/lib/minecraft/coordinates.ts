/**
 * Overworld ↔ Nether coordinate conversion.
 *
 * X and Z scale by Minecraft's fixed 8:1 ratio; Y is identical in both
 * dimensions. Division must truncate toward zero the way Minecraft's block
 * grid does — plain `Math.round` or naive string formatting gives the wrong
 * block for negative coordinates (e.g. -1 overworld should map to a Nether X
 * of 0, since blocks -8..-1 all fold into Nether block 0's column... in
 * practice we keep this as an exact real-number division so the UI can show
 * fractional Nether coordinates and let the person round to the block they
 * actually want, rather than silently discarding precision).
 */
export interface Coords {
  x: number;
  y: number;
  z: number;
}

export function overworldToNether(c: Coords): Coords {
  return { x: c.x / 8, y: c.y, z: c.z / 8 };
}

export function netherToOverworld(c: Coords): Coords {
  return { x: c.x * 8, y: c.y, z: c.z * 8 };
}

/** Rounds toward negative infinity to the containing block coordinate. */
export function toBlock(n: number): number {
  return Math.floor(n);
}

/**
 * Parses a loose coordinate string such as "123, 64, -456" or "123 64 -456".
 */
export function parseCoordString(input: string): Coords | null {
  const nums = input
    .split(/[,\s/]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
  if (nums.length < 3) return null;
  const [x, y, z] = nums;
  if (x === undefined || y === undefined || z === undefined) return null;
  if ([x, y, z].some((n) => Number.isNaN(n))) return null;
  return { x, y, z };
}

/**
 * Parses an F3-style debug-screen coordinate string, e.g.
 * "XYZ: 123.456 / 64.00000 / -456.789".
 */
export function parseF3String(input: string): Coords | null {
  const match = input.match(
    /XYZ:\s*(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/i
  );
  if (match) {
    const [, x, y, z] = match;
    return { x: Number(x), y: Number(y), z: Number(z) };
  }
  // Fall back to a loose parse in case the person only pasted the numbers.
  return parseCoordString(input);
}

export function formatCoord(n: number): string {
  if (Number.isNaN(n)) return "";
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
