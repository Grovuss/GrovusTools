import { describe, it, expect } from "vitest";
import {
  predictStructureChunk,
  verifySeedAgainstObservations,
  isObservationPlausible,
  getStructureConfig,
  blockToChunk,
  floorDiv,
} from "@/lib/minecraft/structureSeed";
import { searchBatch, validateObservations } from "@/lib/minecraft/seedFinder";

describe("blockToChunk / floorDiv", () => {
  it("floors correctly for negative coordinates", () => {
    expect(floorDiv(-1, 16)).toBe(-1);
    expect(floorDiv(-17, 16)).toBe(-2);
    expect(blockToChunk(-2876, -2876)).toEqual({ chunkX: -180, chunkZ: -180 });
  });
});

describe("predictStructureChunk", () => {
  it("is deterministic for a fixed seed and region", () => {
    const config = getStructureConfig("desert_pyramid");
    const a = predictStructureChunk(config, 12345n, 2, -3);
    const b = predictStructureChunk(config, 12345n, 2, -3);
    expect(a).toEqual(b);
  });

  it("places the chunk within the region's valid offset window", () => {
    const config = getStructureConfig("swamp_hut");
    for (let seed = 0n; seed < 20n; seed++) {
      const pos = predictStructureChunk(config, seed, 0, 0);
      expect(pos.chunkX).toBeGreaterThanOrEqual(0);
      expect(pos.chunkX).toBeLessThan(config.chunkRange);
      expect(pos.chunkZ).toBeGreaterThanOrEqual(0);
      expect(pos.chunkZ).toBeLessThan(config.chunkRange);
    }
  });
});

describe("seed cracking round-trip (forward model <-> search)", () => {
  it("finds the true seed when searching a range that contains it", () => {
    const trueSeed = 123456789n;
    const config = getStructureConfig("desert_pyramid");
    const pos = predictStructureChunk(config, trueSeed, 0, 0);
    const observation = { structureId: "desert_pyramid", x: pos.chunkX * 16 + 3, z: pos.chunkZ * 16 + 9 };

    expect(isObservationPlausible(observation)).toBe(true);
    expect(verifySeedAgainstObservations(trueSeed, [observation])).toBe(true);

    const matches = searchBatch([observation], trueSeed - 5n, 20n);
    expect(matches).toContain(trueSeed);
  });

  it("narrows to a small candidate set given two independent structures", () => {
    const trueSeed = 42n;
    const desert = getStructureConfig("desert_pyramid");
    const igloo = getStructureConfig("igloo");
    const p1 = predictStructureChunk(desert, trueSeed, 0, 0);
    const p2 = predictStructureChunk(igloo, trueSeed, 1, 0);
    const obs1 = { structureId: "desert_pyramid", x: p1.chunkX * 16, z: p1.chunkZ * 16 };
    const obs2 = { structureId: "igloo", x: p2.chunkX * 16, z: p2.chunkZ * 16 };

    const matches = searchBatch([obs1, obs2], trueSeed - 1000n, 2000n);
    expect(matches).toContain(trueSeed);
    // Combining two structures should be at least as constraining as one.
    const singleMatches = searchBatch([obs1], trueSeed - 1000n, 2000n);
    expect(matches.length).toBeLessThanOrEqual(singleMatches.length);
  });

  it("rejects a seed that does not reproduce the observation", () => {
    const config = getStructureConfig("jungle_pyramid");
    const pos = predictStructureChunk(config, 5n, 0, 0);
    const wrongObservation = {
      structureId: "jungle_pyramid",
      x: pos.chunkX * 16 + 1000, // clearly a different chunk
      z: pos.chunkZ * 16 + 1000,
    };
    expect(verifySeedAgainstObservations(5n, [wrongObservation])).toBe(false);
  });
});

describe("validateObservations", () => {
  it("flags an observation in the separation gap as implausible", () => {
    // chunkRange is 24 out of a 32-chunk region, so local offset 24-31 is impossible.
    const config = getStructureConfig("desert_pyramid");
    const impossibleChunkX = config.chunkRange; // == 24, first invalid offset
    const error = validateObservations([
      { structureId: "desert_pyramid", x: impossibleChunkX * 16, z: 0 },
    ]);
    expect(error).toMatch(/separation/i);
  });

  it("requires at least one observation", () => {
    expect(validateObservations([])).toMatch(/at least one/i);
  });

  it("accepts a plausible observation", () => {
    expect(validateObservations([{ structureId: "swamp_hut", x: 100, z: 100 }])).toBeNull();
  });
});
