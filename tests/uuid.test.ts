import { describe, it, expect } from "vitest";
import { isValidUuid, normalizeUuid, isValidJavaUsername, looksLikeBedrockGamertag } from "@/lib/minecraft/uuid";

describe("UUID normalization", () => {
  it("treats hyphenated and bare hex as equivalent", () => {
    const hyphenated = "069a79f4-44e9-4726-a5be-fca90e38aaf5";
    const bare = "069a79f444e94726a5befca90e38aaf5";
    expect(normalizeUuid(hyphenated)).toBe(normalizeUuid(bare));
  });

  it("treats upper and lower case as equivalent", () => {
    const lower = "069a79f4-44e9-4726-a5be-fca90e38aaf5";
    const upper = lower.toUpperCase();
    expect(normalizeUuid(lower)).toBe(normalizeUuid(upper));
  });

  it("normalizes to canonical lowercase-hyphenated form", () => {
    expect(normalizeUuid("069A79F444E94726A5BEFCA90E38AAF5")).toBe(
      "069a79f4-44e9-4726-a5be-fca90e38aaf5"
    );
  });

  it("rejects malformed input", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("069a79f4-44e9-4726-a5be")).toBe(false);
    expect(normalizeUuid("not-a-uuid")).toBeNull();
  });
});

describe("Java username validation", () => {
  it("accepts valid usernames", () => {
    expect(isValidJavaUsername("Notch")).toBe(true);
    expect(isValidJavaUsername("a_b_c123")).toBe(true);
  });

  it("rejects invalid usernames", () => {
    expect(isValidJavaUsername("ab")).toBe(false); // too short
    expect(isValidJavaUsername("a".repeat(17))).toBe(false); // too long
    expect(isValidJavaUsername("has space")).toBe(false);
    expect(isValidJavaUsername("has-dash")).toBe(false);
  });
});

describe("Bedrock gamertag heuristic", () => {
  it("flags space-containing input that isn't a valid UUID or Java username", () => {
    expect(looksLikeBedrockGamertag("Cool Gamer 123")).toBe(true);
  });

  it("does not flag valid Java usernames or UUIDs", () => {
    expect(looksLikeBedrockGamertag("Notch")).toBe(false);
    expect(looksLikeBedrockGamertag("069a79f4-44e9-4726-a5be-fca90e38aaf5")).toBe(false);
  });
});
