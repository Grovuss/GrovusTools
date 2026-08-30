import { JavaRandom } from "./javaRandom";

/**
 * Structure region-placement configuration, sourced directly from
 * Cubitect/cubiomes (`finders.h`/`finders.c`) — the reference implementation
 * named in the project brief — rather than invented or guessed.
 *
 * Only structures using the simple "Feature" placement type are included:
 * one region grid (`regionSize` chunks square), one `nextInt(chunkRange)`
 * roll per axis, uniformly distributed. Structures using the "large
 * structure" triangular-distribution placement (Ocean Monument, Woodland
 * Mansion, End City) or ones whose current-version salt/spacing values we
 * could not confirm from source (Shipwreck, Pillager Outpost past 1.16) are
 * deliberately left out — see README "Seed Finder scope" for why.
 */
export interface StructureConfig {
  id: string;
  name: string;
  /** cubiomes' per-structure RNG salt. */
  salt: number;
  /** Region size, in chunks (32 chunks = 512 blocks). */
  regionSize: number;
  /** Width of the valid offset roll within a region, in chunks (spacing - separation). */
  chunkRange: number;
  /** Path under /public to a representative block texture. */
  texture: string;
  versions: string[];
}

const SUPPORTED_VERSIONS = ["1.21.6", "1.21.7", "1.21.8", "26.1", "26.2"];
export { SUPPORTED_VERSIONS };

export const STRUCTURE_CONFIGS: StructureConfig[] = [
  {
    id: "desert_pyramid",
    name: "Desert Pyramid",
    salt: 14357617,
    regionSize: 32,
    chunkRange: 24,
    texture: "/textures/block/chiseled_sandstone.png",
    versions: SUPPORTED_VERSIONS,
  },
  {
    id: "igloo",
    name: "Igloo",
    salt: 14357618,
    regionSize: 32,
    chunkRange: 24,
    texture: "/textures/block/packed_ice.png",
    versions: SUPPORTED_VERSIONS,
  },
  {
    id: "jungle_pyramid",
    name: "Jungle Temple",
    salt: 14357619,
    regionSize: 32,
    chunkRange: 24,
    texture: "/textures/block/mossy_cobblestone.png",
    versions: SUPPORTED_VERSIONS,
  },
  {
    id: "swamp_hut",
    name: "Swamp Hut",
    salt: 14357620,
    regionSize: 32,
    chunkRange: 24,
    texture: "/textures/block/mud.png",
    versions: SUPPORTED_VERSIONS,
  },
];

const BY_ID = new Map(STRUCTURE_CONFIGS.map((s) => [s.id, s]));

export function getStructureConfig(id: string): StructureConfig {
  const cfg = BY_ID.get(id);
  if (!cfg) throw new Error(`Unknown or unsupported structure: ${id}`);
  return cfg;
}

export function floorDiv(a: number, b: number): number {
  return Math.floor(a / b);
}

export interface ChunkPos {
  chunkX: number;
  chunkZ: number;
}

export function blockToChunk(x: number, z: number): ChunkPos {
  return { chunkX: floorDiv(x, 16), chunkZ: floorDiv(z, 16) };
}

/**
 * Predicts the generation-attempt chunk for a structure's region, given a
 * candidate lower-48-bit world seed. Mirrors cubiomes' `getRegPos`:
 *
 *   setSeed(regionX*341873128712 + regionZ*132897987541 + seed + salt)
 *   chunkX = regionX*regionSize + nextInt(chunkRange)
 *   chunkZ = regionZ*regionSize + nextInt(chunkRange)
 */
export function predictStructureChunk(
  config: StructureConfig,
  worldSeedLow48: bigint,
  regionX: number,
  regionZ: number
): ChunkPos {
  const regionSeed =
    BigInt(regionX) * 341873128712n +
    BigInt(regionZ) * 132897987541n +
    worldSeedLow48 +
    BigInt(config.salt);
  const rand = new JavaRandom(regionSeed);
  const offsetX = rand.nextInt(config.chunkRange);
  const offsetZ = rand.nextInt(config.chunkRange);
  return {
    chunkX: regionX * config.regionSize + offsetX,
    chunkZ: regionZ * config.regionSize + offsetZ,
  };
}

export interface StructureObservation {
  structureId: string;
  x: number;
  z: number;
}

/** True if a candidate seed reproduces every supplied observation exactly. */
export function verifySeedAgainstObservations(
  worldSeedLow48: bigint,
  observations: StructureObservation[]
): boolean {
  return observations.every((obs) => {
    const config = getStructureConfig(obs.structureId);
    const { chunkX, chunkZ } = blockToChunk(obs.x, obs.z);
    const regionX = floorDiv(chunkX, config.regionSize);
    const regionZ = floorDiv(chunkZ, config.regionSize);
    const predicted = predictStructureChunk(config, worldSeedLow48, regionX, regionZ);
    return predicted.chunkX === chunkX && predicted.chunkZ === chunkZ;
  });
}

/**
 * Checks whether an observation is even geometrically possible for its
 * structure type — i.e. its chunk falls in the region's valid offset range,
 * not the "separation" dead zone no seed could ever produce.
 */
export function isObservationPlausible(obs: StructureObservation): boolean {
  const config = getStructureConfig(obs.structureId);
  const { chunkX, chunkZ } = blockToChunk(obs.x, obs.z);
  const regionX = floorDiv(chunkX, config.regionSize);
  const regionZ = floorDiv(chunkZ, config.regionSize);
  const localX = chunkX - regionX * config.regionSize;
  const localZ = chunkZ - regionZ * config.regionSize;
  return localX >= 0 && localX < config.chunkRange && localZ >= 0 && localZ < config.chunkRange;
}
