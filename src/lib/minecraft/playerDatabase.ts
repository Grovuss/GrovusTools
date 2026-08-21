/**
 * Player database for the Locator Bar Color Finder's "known players with
 * this color" feature.
 *
 * ## Why this isn't a bulk import of a 66M-row dataset
 *
 * We looked at third-party Minecraft identity APIs (Mowojang, Rebel Core —
 * see README "Player database provider decision" for the full comparison).
 * Both are real, both are free, and both are lookup-by-known-username-or-UUID
 * APIs — neither exposes a way to query "every player with color X", and
 * neither publishes a licensable bulk export we could legally index ourselves.
 * Building that index by calling their lookup endpoints for millions of
 * players is exactly the brute-force approach the project brief rules out.
 *
 * So Grovus grows its own index **organically and legitimately**: every time
 * someone looks up a real username or UUID through this tool, that public
 * identity (UUID, current username, and their deterministically-computed
 * color) is upserted here. "Known players with this color" always means
 * "players who have been looked up through Grovus" — never "everyone in
 * Minecraft" — and the UI says so explicitly.
 *
 * ## Swapping providers
 *
 * Everything below the `PlayerDatabase` interface is swappable. Set
 * `DATABASE_URL` to a Postgres connection string (Neon, Supabase, etc.) to
 * use the real indexed backend; without it, an in-memory store is used so
 * the app still runs (data resets on every server restart — fine for local
 * dev, not for production). If a legitimately licensable bulk dataset
 * becomes available later, it can be bulk-inserted into the same
 * `minecraft_players` table via `scripts/import-players.ts` without any
 * application code changing.
 */

import { Pool } from "pg";

export interface PlayerRecord {
  uuid: string;
  username: string;
  color: string;
}

export interface ColorMatchPage {
  players: PlayerRecord[];
  total: number;
}

export interface PlayerDatabase {
  upsertPlayer(record: PlayerRecord): Promise<void>;
  findByColor(color: string, page: number, pageSize: number): Promise<ColorMatchPage>;
  totalIndexed(): Promise<number>;
}

// ---------------------------------------------------------------------------
// In-memory backend (default; used when DATABASE_URL isn't set)
// ---------------------------------------------------------------------------

export class MemoryPlayerDatabase implements PlayerDatabase {
  private byUuid = new Map<string, PlayerRecord>();
  private byColor = new Map<string, Set<string>>();

  async upsertPlayer(record: PlayerRecord): Promise<void> {
    const color = record.color.toUpperCase();
    const existing = this.byUuid.get(record.uuid);
    if (existing && existing.color.toUpperCase() !== color) {
      this.byColor.get(existing.color.toUpperCase())?.delete(record.uuid);
    }
    this.byUuid.set(record.uuid, { ...record, color });
    if (!this.byColor.has(color)) this.byColor.set(color, new Set());
    this.byColor.get(color)!.add(record.uuid);
  }

  async findByColor(color: string, page: number, pageSize: number): Promise<ColorMatchPage> {
    const uuids = Array.from(this.byColor.get(color.toUpperCase()) ?? []);
    const players = uuids
      .map((id) => this.byUuid.get(id))
      .filter((p): p is PlayerRecord => Boolean(p))
      .sort((a, b) => a.username.localeCompare(b.username));
    const start = (page - 1) * pageSize;
    return { players: players.slice(start, start + pageSize), total: players.length };
  }

  async totalIndexed(): Promise<number> {
    return this.byUuid.size;
  }
}

// ---------------------------------------------------------------------------
// Postgres backend (used when DATABASE_URL is set — Neon, Supabase, etc.)
// ---------------------------------------------------------------------------

class PostgresPlayerDatabase implements PlayerDatabase {
  private pool: Pool;
  private ready: Promise<void>;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 5 });
    this.ready = this.pool.query(`
      CREATE TABLE IF NOT EXISTS minecraft_players (
        uuid TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        color TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_minecraft_players_color ON minecraft_players (color);
    `).then(() => undefined);
  }

  async upsertPlayer(record: PlayerRecord): Promise<void> {
    await this.ready;
    await this.pool.query(
      `INSERT INTO minecraft_players (uuid, username, color, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (uuid) DO UPDATE
       SET username = EXCLUDED.username, color = EXCLUDED.color, updated_at = now()`,
      [record.uuid, record.username, record.color.toUpperCase()]
    );
  }

  async findByColor(color: string, page: number, pageSize: number): Promise<ColorMatchPage> {
    await this.ready;
    const offset = (page - 1) * pageSize;
    const [rows, count] = await Promise.all([
      this.pool.query<PlayerRecord>(
        `SELECT uuid, username, color FROM minecraft_players
         WHERE color = $1 ORDER BY username LIMIT $2 OFFSET $3`,
        [color.toUpperCase(), pageSize, offset]
      ),
      this.pool.query<{ count: string }>(
        `SELECT count(*) FROM minecraft_players WHERE color = $1`,
        [color.toUpperCase()]
      ),
    ]);
    return { players: rows.rows, total: Number(count.rows[0]?.count ?? 0) };
  }

  async totalIndexed(): Promise<number> {
    await this.ready;
    const result = await this.pool.query<{ count: string }>(
      `SELECT count(*) FROM minecraft_players`
    );
    return Number(result.rows[0]?.count ?? 0);
  }
}

// ---------------------------------------------------------------------------
// Factory — one instance per server process
// ---------------------------------------------------------------------------

let instance: PlayerDatabase | null = null;

export function getPlayerDatabase(): PlayerDatabase {
  if (instance) return instance;
  const url = process.env.DATABASE_URL;
  instance = url ? new PostgresPlayerDatabase(url) : new MemoryPlayerDatabase();
  return instance;
}

/** True when results are backed by a real, persistent, indexed database. */
export function hasPersistentPlayerDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
