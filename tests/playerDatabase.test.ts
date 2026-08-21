import { describe, it, expect, beforeEach } from "vitest";
import { MemoryPlayerDatabase } from "@/lib/minecraft/playerDatabase";

describe("MemoryPlayerDatabase", () => {
  let db: MemoryPlayerDatabase;

  beforeEach(() => {
    db = new MemoryPlayerDatabase();
  });

  it("finds all players sharing an exact color", async () => {
    await db.upsertPlayer({ uuid: "u1", username: "Alice", color: "#DC5D7F" });
    await db.upsertPlayer({ uuid: "u2", username: "Bob", color: "#DC5D7F" });
    await db.upsertPlayer({ uuid: "u3", username: "Carol", color: "#111111" });

    const result = await db.findByColor("#DC5D7F", 1, 50);
    expect(result.total).toBe(2);
    expect(result.players.map((p) => p.username)).toEqual(["Alice", "Bob"]);
  });

  it("matches colors case-insensitively", async () => {
    await db.upsertPlayer({ uuid: "u1", username: "Alice", color: "#dc5d7f" });
    const result = await db.findByColor("#DC5D7F", 1, 50);
    expect(result.total).toBe(1);
  });

  it("paginates correctly", async () => {
    for (let i = 0; i < 25; i++) {
      await db.upsertPlayer({ uuid: `u${i}`, username: `Player${i.toString().padStart(2, "0")}`, color: "#ABCDEF" });
    }
    const page1 = await db.findByColor("#ABCDEF", 1, 10);
    const page2 = await db.findByColor("#ABCDEF", 2, 10);
    const page3 = await db.findByColor("#ABCDEF", 3, 10);
    expect(page1.total).toBe(25);
    expect(page1.players).toHaveLength(10);
    expect(page2.players).toHaveLength(10);
    expect(page3.players).toHaveLength(5);
    // No overlap between pages.
    const allUsernames = [...page1.players, ...page2.players, ...page3.players].map((p) => p.username);
    expect(new Set(allUsernames).size).toBe(25);
  });

  it("moves a player between color buckets on re-upsert", async () => {
    await db.upsertPlayer({ uuid: "u1", username: "Alice", color: "#111111" });
    await db.upsertPlayer({ uuid: "u1", username: "Alice", color: "#222222" });
    expect((await db.findByColor("#111111", 1, 10)).total).toBe(0);
    expect((await db.findByColor("#222222", 1, 10)).total).toBe(1);
  });

  it("tracks total indexed players", async () => {
    await db.upsertPlayer({ uuid: "u1", username: "Alice", color: "#111111" });
    await db.upsertPlayer({ uuid: "u2", username: "Bob", color: "#222222" });
    expect(await db.totalIndexed()).toBe(2);
  });

  it("returns an empty page for an unmatched color", async () => {
    const result = await db.findByColor("#000000", 1, 50);
    expect(result).toEqual({ players: [], total: 0 });
  });
});
