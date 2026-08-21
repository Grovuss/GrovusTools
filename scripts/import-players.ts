/**
 * Bulk-imports a `uuid,username` CSV into the `minecraft_players` table,
 * computing each player's Locator Bar color at import time.
 *
 * This script is NOT wired up to any dataset today — see README "Locator
 * Bar player database" for why Grovus doesn't ship or auto-fetch one. It
 * exists so that *if* a legitimately licensable bulk Minecraft identity
 * dataset is obtained in the future (e.g. one you have redistribution
 * rights to, not a scraped or leaked dump), it can be indexed without
 * writing new application code — it uses the exact same
 * `minecraft_players` table and color algorithm the live app uses.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/import-players.ts players.csv
 *
 * Expected CSV format (header row required):
 *   uuid,username
 *   069a79f4-44e9-4726-a5be-fca90e38aaf5,Notch
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { Pool } from "pg";
import { computeLocatorColor } from "../src/lib/minecraft/locator-color";
import { isValidUuid, normalizeUuid, isValidJavaUsername } from "../src/lib/minecraft/uuid";

const BATCH_SIZE = 500;

async function main() {
  const file = process.argv[2];
  const connectionString = process.env.DATABASE_URL;
  if (!file) {
    console.error("Usage: DATABASE_URL=... npx tsx scripts/import-players.ts <players.csv>");
    process.exit(1);
  }
  if (!connectionString) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS minecraft_players (
      uuid TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      color TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_minecraft_players_color ON minecraft_players (color);
  `);

  const rl = createInterface({ input: createReadStream(file) });
  let batch: { uuid: string; username: string; color: string }[] = [];
  let lineNumber = 0;
  let imported = 0;
  let skipped = 0;

  async function flush() {
    if (batch.length === 0) return;
    const values: string[] = [];
    const params: string[] = [];
    batch.forEach((row, i) => {
      const base = i * 3;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, now())`);
      params.push(row.uuid, row.username, row.color);
    });
    await pool.query(
      `INSERT INTO minecraft_players (uuid, username, color, updated_at)
       VALUES ${values.join(", ")}
       ON CONFLICT (uuid) DO UPDATE
       SET username = EXCLUDED.username, color = EXCLUDED.color, updated_at = now()`,
      params
    );
    imported += batch.length;
    batch = [];
  }

  for await (const line of rl) {
    lineNumber++;
    if (lineNumber === 1) continue; // header
    const [rawUuid, rawUsername] = line.split(",").map((s) => s?.trim());
    if (!rawUuid || !rawUsername || !isValidUuid(rawUuid) || !isValidJavaUsername(rawUsername)) {
      skipped++;
      continue;
    }
    const uuid = normalizeUuid(rawUuid)!;
    const color = computeLocatorColor(uuid);
    if (!color) {
      skipped++;
      continue;
    }
    batch.push({ uuid, username: rawUsername, color: color.hex });
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();
  await pool.end();

  console.log(`Imported ${imported} players, skipped ${skipped} invalid rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
