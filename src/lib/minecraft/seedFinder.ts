import {
  getStructureConfig,
  predictStructureChunk,
  blockToChunk,
  floorDiv,
  isObservationPlausible,
  type StructureObservation,
} from "./structureSeed";

/**
 * ## Why this doesn't brute-force the full 48-bit structure-seed space
 *
 * Structure placement only ever depends on the lower 48 bits of the world
 * seed (`setSeed` masks everything else away), so in principle "cracking" a
 * seed means searching up to 2^48 (~281 trillion) candidates. Cubiomes does
 * this in raw, heavily-optimized C — plausible in minutes on a desktop.
 * Reproducing that speed in JavaScript is not: even a tight, allocation-free
 * loop tops out somewhere in the tens of millions of checks per second per
 * core, which puts an exhaustive 48-bit search at many hours, not something
 * a browser tab can reasonably promise.
 *
 * Real-world Minecraft seeds are overwhelmingly *not* random 48-bit numbers,
 * though. When a world is created, Minecraft turns whatever the person typed
 * into a seed one of two ways:
 *   - a plain number is used directly, or
 *   - any other text is run through Java's 32-bit `String.hashCode()` and
 *     sign-extended to a 64-bit seed.
 * Both cases collapse into the same practical search space: every seed
 * whose value fits in a signed 32-bit integer (-2^31 .. 2^31-1), about 4.3
 * billion candidates. That's the space this finder actually searches by
 * default — tractable in a browser (see `seedFinder.worker.ts`) and covers
 * the vast majority of seeds people actually share or remember. A custom,
 * explicitly-sized range is also available for advanced use, with a warning
 * once it gets large enough to be impractical.
 *
 * This is a genuine scope boundary, not a shortcut taken quietly — it's
 * surfaced in the UI every time a search runs.
 */
export const COMMON_SEED_RANGE = {
  start: -(2n ** 31n),
  count: 2n ** 32n,
};

export const CUSTOM_RANGE_WARNING_THRESHOLD = 20_000_000_000n; // 20B candidates

export interface SearchProgress {
  checked: bigint;
  total: bigint;
  matches: bigint[];
  ratePerSecond: number;
  done: boolean;
}

/**
 * Checks a contiguous batch of candidate seeds against every observation,
 * short-circuiting per-candidate on the first mismatch. Designed to be
 * called repeatedly with small batches (from a Web Worker) so progress can
 * be reported and the search can be cancelled between batches.
 */
export function searchBatch(
  observations: StructureObservation[],
  batchStart: bigint,
  batchSize: bigint
): bigint[] {
  const matches: bigint[] = [];
  const prepared = observations.map((obs) => {
    const config = getStructureConfig(obs.structureId);
    const { chunkX, chunkZ } = blockToChunk(obs.x, obs.z);
    const regionX = floorDiv(chunkX, config.regionSize);
    const regionZ = floorDiv(chunkZ, config.regionSize);
    return { config, chunkX, chunkZ, regionX, regionZ };
  });

  const end = batchStart + batchSize;
  for (let seed = batchStart; seed < end; seed++) {
    let ok = true;
    for (const p of prepared) {
      const predicted = predictStructureChunk(p.config, seed, p.regionX, p.regionZ);
      if (predicted.chunkX !== p.chunkX || predicted.chunkZ !== p.chunkZ) {
        ok = false;
        break;
      }
    }
    if (ok) matches.push(seed);
  }
  return matches;
}

export function validateObservations(observations: StructureObservation[]): string | null {
  if (observations.length === 0) return "Add at least one structure observation.";
  for (const obs of observations) {
    try {
      getStructureConfig(obs.structureId);
    } catch {
      return `"${obs.structureId}" isn't a supported structure yet.`;
    }
    if (!isObservationPlausible(obs)) {
      const config = getStructureConfig(obs.structureId);
      return `${config.name} at (${obs.x}, ${obs.z}) falls in that structure's "separation" gap — no seed can place a ${config.name} exactly there. Double-check the coordinates.`;
    }
  }
  return null;
}
