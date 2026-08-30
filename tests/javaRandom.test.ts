import { describe, it, expect } from "vitest";
import { JavaRandom, scrambleSeed } from "@/lib/minecraft/javaRandom";

describe("JavaRandom", () => {
  it("scrambles the seed via XOR with the LCG multiplier, masked to 48 bits", () => {
    // setSeed(0) = (0 ^ 0x5DEECE66D) & mask48 = 0x5DEECE66D exactly, since
    // the multiplier already fits in 48 bits. Pure arithmetic, not a
    // memorized reference value.
    expect(scrambleSeed(0n)).toBe(0x5deece66dn);
  });

  it("uses the documented power-of-two shortcut: (bound * next(31)) >> 31", () => {
    // Oracle's javadoc gives this exact formula for power-of-two bounds.
    // We can check it holds by comparing two power-of-two bounds derived
    // from the *same* seed: doubling the bound should roughly double the
    // range of outputs in a way only consistent with that shift-based
    // formula (a modulo-based implementation would not scale this way).
    const seed = 777n;
    const a = new JavaRandom(seed).nextInt(1 << 20);
    const b = new JavaRandom(seed).nextInt(1 << 21);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(1 << 21);
    // The top bit of `a`'s range corresponds to the same underlying
    // next(31) draw as `b`'s top two bits, so b >> 1 must equal a exactly.
    expect(b >> 1).toBe(a);
  });

  it("is deterministic: same seed produces the same sequence", () => {
    const a = new JavaRandom(12345n);
    const b = new JavaRandom(12345n);
    const seqA = [a.nextInt(1000), a.nextInt(1000), a.nextInt(1000)];
    const seqB = [b.nextInt(1000), b.nextInt(1000), b.nextInt(1000)];
    expect(seqA).toEqual(seqB);
  });

  it("different seeds produce different sequences", () => {
    const a = new JavaRandom(1n).nextInt(1_000_000);
    const b = new JavaRandom(2n).nextInt(1_000_000);
    expect(a).not.toBe(b);
  });

  it("nextInt(bound) always returns a value in [0, bound)", () => {
    const rand = new JavaRandom(999n);
    for (let i = 0; i < 500; i++) {
      const v = rand.nextInt(24);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(24);
    }
  });

  it("handles power-of-two bounds via the documented shortcut path", () => {
    const rand = new JavaRandom(42n);
    for (let i = 0; i < 200; i++) {
      const v = rand.nextInt(32); // 32 is a power of 2
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(32);
    }
  });

  it("re-seeding resets the sequence", () => {
    const rand = new JavaRandom(5n);
    const first = rand.nextInt(100);
    rand.setSeed(5n);
    const second = rand.nextInt(100);
    expect(first).toBe(second);
  });
});
