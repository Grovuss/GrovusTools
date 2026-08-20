import { describe, it, expect } from "vitest";
import {
  overworldToNether,
  netherToOverworld,
  parseF3String,
  parseCoordString,
} from "@/lib/minecraft/coordinates";

describe("overworld <-> nether conversion", () => {
  it("divides X/Z by 8 and leaves Y unchanged", () => {
    expect(overworldToNether({ x: 800, y: 64, z: -1600 })).toEqual({ x: 100, y: 64, z: -200 });
  });

  it("multiplies X/Z by 8 going the other way", () => {
    expect(netherToOverworld({ x: 100, y: 64, z: -200 })).toEqual({ x: 800, y: 64, z: -1600 });
  });

  it("handles negative coordinates correctly", () => {
    expect(overworldToNether({ x: -800, y: 70, z: 0 }).x).toBe(-100);
  });

  it("handles non-multiples of 8 without rounding errors", () => {
    const result = overworldToNether({ x: 10, y: 64, z: -10 });
    expect(result.x).toBeCloseTo(1.25);
    expect(result.z).toBeCloseTo(-1.25);
  });

  it("round-trips within floating point tolerance", () => {
    const start = { x: 4231, y: 12, z: -998 };
    const back = netherToOverworld(overworldToNether(start));
    expect(back.x).toBeCloseTo(start.x);
    expect(back.z).toBeCloseTo(start.z);
  });
});

describe("F3 string parsing", () => {
  it("parses a standard debug-screen XYZ line", () => {
    expect(parseF3String("XYZ: 123.456 / 64.00000 / -456.789")).toEqual({
      x: 123.456,
      y: 64,
      z: -456.789,
    });
  });

  it("falls back to loose parsing for bare numbers", () => {
    expect(parseCoordString("123, 64, -456")).toEqual({ x: 123, y: 64, z: -456 });
  });

  it("returns null for garbage input", () => {
    expect(parseCoordString("not coordinates")).toBeNull();
  });
});
