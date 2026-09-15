import { describe, it, expect } from "vitest";
import { tintMaskPixels, hexToRgb } from "@/lib/minecraft/bannerRender";

describe("hexToRgb", () => {
  it("parses a hex color into RGB components", () => {
    expect(hexToRgb("#B02E26")).toEqual({ r: 176, g: 46, b: 38 });
    expect(hexToRgb("3C44AA")).toEqual({ r: 60, g: 68, b: 170 });
  });
});

describe("tintMaskPixels", () => {
  it("leaves fully transparent pixels untouched", () => {
    const data = new Uint8ClampedArray([255, 255, 255, 0]);
    tintMaskPixels(data, 255, 0, 0);
    expect(Array.from(data)).toEqual([255, 255, 255, 0]);
  });

  it("recolors a fully white, fully opaque pixel to exactly the target color", () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255]);
    tintMaskPixels(data, 176, 46, 38);
    expect(Array.from(data)).toEqual([176, 46, 38, 255]);
  });

  it("scales the target color by the source pixel's luminance", () => {
    // Half-luminance gray source should produce roughly half-intensity output.
    const data = new Uint8ClampedArray([128, 128, 128, 255]);
    tintMaskPixels(data, 200, 100, 50);
    expect(data[0]).toBeCloseTo(100, -1);
    expect(data[1]).toBeCloseTo(50, -1);
    expect(data[2]).toBeCloseTo(25, -1);
  });

  it("preserves partial alpha for anti-aliased edges", () => {
    const data = new Uint8ClampedArray([255, 255, 255, 128]);
    tintMaskPixels(data, 10, 20, 30);
    expect(data[3]).toBe(128);
  });

  it("processes every pixel in a multi-pixel buffer independently", () => {
    const data = new Uint8ClampedArray([
      255, 255, 255, 255, // opaque white
      0, 0, 0, 0, // transparent
    ]);
    tintMaskPixels(data, 50, 60, 70);
    expect(Array.from(data.slice(0, 4))).toEqual([50, 60, 70, 255]);
    expect(Array.from(data.slice(4, 8))).toEqual([0, 0, 0, 0]);
  });
});
