import { describe, it, expect } from "vitest";
import { areConflicting } from "@/lib/minecraft/conflicts";

describe("enchantment conflicts", () => {
  it("flags Sharpness / Smite / Bane of Arthropods as mutually exclusive", () => {
    expect(areConflicting("sharpness", "smite")).toBe(true);
    expect(areConflicting("sharpness", "bane_of_arthropods")).toBe(true);
    expect(areConflicting("smite", "bane_of_arthropods")).toBe(true);
  });

  it("flags Fortune / Silk Touch as mutually exclusive", () => {
    expect(areConflicting("fortune", "silk_touch")).toBe(true);
  });

  it("flags Mending / Infinity as mutually exclusive", () => {
    expect(areConflicting("mending", "infinity")).toBe(true);
  });

  it("does not flag unrelated enchantments", () => {
    expect(areConflicting("sharpness", "unbreaking")).toBe(false);
    expect(areConflicting("mending", "unbreaking")).toBe(false);
  });
});
