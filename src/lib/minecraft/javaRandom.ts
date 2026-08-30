/**
 * A faithful port of `java.util.Random` — the linear congruential generator
 * Minecraft Java Edition uses for structure placement, biome decoration,
 * loot, and nearly everything else seed-dependent.
 *
 * Implemented with BigInt throughout so the arithmetic is unambiguously
 * correct (no float-precision edge cases), even though that makes it slower
 * than a hand-rolled 32-bit split implementation would be. For the seed
 * finder's search loop, correctness matters far more than shaving off a
 * constant factor — see `seedFinder.ts` for how the search space itself is
 * kept tractable instead.
 */
const MULTIPLIER = 0x5deece66dn;
const INCREMENT = 0xbn;
const MASK48 = (1n << 48n) - 1n;

export class JavaRandom {
  private state: bigint;

  constructor(seed: bigint) {
    this.state = 0n;
    this.setSeed(seed);
  }

  setSeed(seed: bigint): void {
    this.state = (BigInt.asUintN(64, seed) ^ MULTIPLIER) & MASK48;
  }

  /** Advances the state and returns the top `bits` bits, matching `next(int)`. */
  private next(bits: number): number {
    this.state = (this.state * MULTIPLIER + INCREMENT) & MASK48;
    const shifted = this.state >> BigInt(48 - bits);
    // `next` returns a signed 32-bit int in Java; only matters for bits=32.
    return Number(BigInt.asIntN(32, shifted));
  }

  nextInt(bound: number): number {
    if (bound <= 0) throw new Error("bound must be positive");
    if ((bound & -bound) === bound) {
      // Power of two: Java takes a shortcut that avoids rejection sampling.
      return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
    }
    let bits: number;
    let val: number;
    do {
      bits = this.next(31);
      val = bits % bound;
      // Java rejects and retries on the (astronomically rare) overflow case
      // `bits - val + (bound - 1) < 0` as a 32-bit signed int. We mirror it
      // exactly rather than assuming it never happens.
    } while (((bits - val + (bound - 1)) | 0) < 0);
    return val;
  }
}

/** Directly derives the internal 48-bit LCG state `setSeed(seed)` produces. */
export function scrambleSeed(seed: bigint): bigint {
  return (BigInt.asUintN(64, seed) ^ MULTIPLIER) & MASK48;
}
