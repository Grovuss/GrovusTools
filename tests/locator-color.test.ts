import { describe, it, expect } from "vitest";
import { computeLocatorColor } from "@/lib/minecraft/locator-color";

describe("computeLocatorColor", () => {
  it("matches the known Notch UUID -> color pair", () => {
    const result = computeLocatorColor("069a79f4-44e9-4726-a5be-fca90e38aaf5");
    expect(result?.hex).toBe("#DC5D7F");
    expect(result).toEqual({ hex: "#DC5D7F", r: 220, g: 93, b: 127 });
  });

  it("is unaffected by hyphenation", () => {
    const a = computeLocatorColor("069a79f4-44e9-4726-a5be-fca90e38aaf5");
    const b = computeLocatorColor("069a79f444e94726a5befca90e38aaf5");
    expect(a).toEqual(b);
  });

  it("is unaffected by case", () => {
    const a = computeLocatorColor("069a79f4-44e9-4726-a5be-fca90e38aaf5");
    const b = computeLocatorColor("069A79F4-44E9-4726-A5BE-FCA90E38AAF5");
    expect(a).toEqual(b);
  });

  it("is deterministic across repeated calls", () => {
    const uuid = "853c80ef-3c37-49fd-aa4a-93916253d461";
    const a = computeLocatorColor(uuid);
    const b = computeLocatorColor(uuid);
    expect(a).toEqual(b);
  });

  it("gives independent results for different UUIDs", () => {
    const a = computeLocatorColor("069a79f4-44e9-4726-a5be-fca90e38aaf5");
    const b = computeLocatorColor("853c80ef-3c37-49fd-aa4a-93916253d461");
    expect(a?.hex).not.toBe(b?.hex);
  });

  it("returns null for invalid input", () => {
    expect(computeLocatorColor("not-a-uuid")).toBeNull();
  });

  it("always produces channels in the valid 0-229 shaded range", () => {
    const result = computeLocatorColor("853c80ef-3c37-49fd-aa4a-93916253d461");
    for (const channel of [result?.r, result?.g, result?.b]) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(229); // floor(255 * 0.9)
    }
  });
});
