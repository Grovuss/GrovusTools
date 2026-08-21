# Grovus Tools

Minecraft utilities without the bullshit. A real Next.js app, not a spreadsheet.

**Tools:**

- **[Enchantment Calculator](/tools/enchantments)** — cheapest valid order to
  combine enchanted books/gear in a Java Edition anvil, via a real subset
  dynamic-program optimizer (not `sum of levels`).
- **[Coordinate Calculator](/tools/coordinates)** — Overworld ↔ Nether
  conversion (8:1 ratio), correct on negative numbers, with F3-paste support.
- **[Locator Bar Color Finder](/tools/locator-color)** — a player's default
  Locator Bar color from their username or UUID, plus other known players who
  share it.

## Why the enchantment calculator is more than a formula

Java Edition's anvil cost isn't `sum of enchantment levels`. It's shaped by:

- **Prior work penalty** — every anvil operation adds a hidden "uses"
  counter; each future operation costs `2^uses - 1` extra levels.
- **Book vs. item cost** — enchantments have different multipliers depending
  on whether they arrive via a book or a non-book item.
- **Order asymmetry** — `A + B` ≠ `B + A` in cost, because only the
  *sacrifice* (right slot) side's content gets charged.
- **The 39-level cap** — any single operation costing 40+ levels is rejected.

So the *order* you combine books in changes total cost, sometimes a lot —
finding the cheapest order is a real search problem. See
[`src/lib/minecraft/optimizer.ts`](src/lib/minecraft/optimizer.ts) for the
algorithm (a Held–Karp-style subset DP) and why it's shaped that way.

## Locator Bar Color Finder

### The color algorithm

Reverse-engineered from Java Edition, not a documented Mojang contract —
see [`src/lib/minecraft/locator-color.ts`](src/lib/minecraft/locator-color.ts):

```text
hilo = mostSigBits XOR leastSigBits          (UUID split into two 64-bit halves)
hash = int(hilo >> 32) XOR int(hilo)         (java.util.UUID.hashCode())
R,G,B = bytes 2,1,0 of hash, each × 0.9, floored
```

Verified against the known pair `069a79f4-44e9-4726-a5be-fca90e38aaf5`
(Notch) → `#DC5D7F` in `tests/locator-color.test.ts`.

### Player database provider decision

The "known players with this color" feature needs to query players *by
color*, not by a known username/UUID. We researched the options the project
brief pointed at before building anything:

| Provider | Lookup | Bulk/query-by-field | Rate limit | Verdict |
| --- | --- | --- | --- | --- |
| **Mojang** (`api.mojang.com`) | username ⇄ UUID only | No | Undocumented, historically strict | Authoritative for resolving a *specific* username — used for that only. |
| **Mowojang** | username/UUID lookup, batches of ≤10 | No bulk export documented | Not published | Mirrors Mojang's contract; no way to query by color. |
| **Rebel Core** | username/UUID → profile + history | No bulk export documented | 60 req/min, no key | 65M+ usernames indexed, but still lookup-by-known-identifier only. |

None of the three expose "give me every player with color X" or a
licensable bulk dump. Building that index by looping their lookup endpoints
over millions of accounts is exactly the brute-force approach this project
explicitly rules out — and scraping/leaked dumps are off the table on legal
and ethical grounds regardless of size.

**So the index grows organically instead:** every real username/UUID looked
up through Grovus gets upserted into our own `minecraft_players` table
(UUID, username, precomputed color — see `src/lib/minecraft/playerDatabase.ts`).
"Known players with this color" always means *players who've been looked up
through Grovus*, never "everyone in Minecraft," and the UI says so. If a
legitimately licensable bulk dataset shows up later, `scripts/import-players.ts`
bulk-loads it into the same table without any app code changing.

### Setup

Without `DATABASE_URL` set, matches are stored in memory and reset on every
restart — fine for local dev, not for production. To persist them:

1. Create a Postgres database (e.g. a free [Neon](https://neon.tech) project).
2. Set `DATABASE_URL` (see [`.env.example`](.env.example)) locally and in
   Vercel's project settings.
3. Nothing else — the table and its `color` index are created automatically
   on first write.

Username lookups call Mojang's API server-side (never from the browser),
cached for an hour since usernames rarely change. Offline-mode/cracked-server
accounts aren't in Mojang's records; search by UUID directly for those.
Bedrock gamertags are rejected with an explanation — there's no stable
Java-UUID-derived color to compute for them. The shown color is always the
UUID-derived *default*; team colors and waypoint overrides aren't visible to
a website with no access to a live server.

## Tech stack

Next.js (App Router) + TypeScript, Tailwind CSS v4, React 19, lucide-react,
Vitest. `pg` for the optional Postgres-backed player index. No other backend.

## Local development

```bash
git clone <your-fork-url>
cd grovus-tools
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test          # run once — engine + API logic, independent of React
npm run test:watch
```

## Production build

```bash
npm run build
npm run start
```

## Deploying to Vercel

1. Push to GitHub, then **Add New → Project** in Vercel and import it.
   Next.js is auto-detected — no config needed.
2. (Optional) set `DATABASE_URL` in Vercel's project settings for a
   persistent Locator Bar player index — see above.
3. Deploy. Pushes to `main` redeploy automatically; PRs get previews.

## Minecraft version / data support

Rules data lives behind a small version registry in
[`src/lib/minecraft/versions.ts`](src/lib/minecraft/versions.ts) instead of
being scattered through the UI. Today only **Java Edition 26.2** is
implemented. To add a version: duplicate the relevant `enchantments.ts` /
`items.ts` data, add an entry to `MINECRAFT_VERSIONS`, and wire a selector
value to it — the UI and optimizer only ever read through `getVersionData()`.
Grovus never claims to support a version whose data isn't actually filled in.

## Project structure

```text
src/
  app/
    page.tsx                       # homepage
    tools/page.tsx                  # tool directory
    tools/enchantments/page.tsx     # enchantment calculator
    tools/coordinates/page.tsx      # coordinate calculator
    tools/locator-color/page.tsx    # locator bar color finder
    api/minecraft/player/route.ts        # username/UUID -> color (+ indexes it)
    api/minecraft/color-matches/route.ts # paginated color match lookup
  components/                       # UI components
  lib/
    shareState.ts                   # URL <-> enchant-calculator state
    rateLimit.ts                    # best-effort per-IP rate limiting
    minecraft/
      types.ts / versions.ts        # shared types + version registry
      enchantments.ts / items.ts    # enchantment + item databases
      anvil.ts / optimizer.ts       # anvil mechanics + combine-order search
      conflicts.ts / xp.ts          # conflict rules + Java XP curve
      coordinates.ts                # Overworld/Nether conversion + parsing
      uuid.ts / locator-color.ts    # UUID parsing + the color algorithm
      mojang.ts / playerDatabase.ts # Mojang lookup + swappable player index
scripts/import-players.ts           # bulk-import a legitimate dataset later
tests/                              # Vitest suite for everything above
public/textures/                    # extracted Minecraft item/block textures
```

Calculation/engine code under `src/lib` is deliberately independent of
React, so it's directly unit-testable and reusable outside the UI (a CLI, a
Web Worker, etc.).

## Adding another tool

1. Route at `src/app/tools/<tool>/page.tsx`.
2. Real logic in `src/lib/<tool>/`, independent of React.
3. Card on the homepage + `/tools` directory (or "Coming Soon").
4. Link in `src/components/Header.tsx`.

## Texture assets

`public/textures/` is a small, hand-picked subset of Minecraft's textures —
not the full pack, only what the app references — rendered with
`image-rendering: pixelated` to stay crisp at any size. Minecraft is a
trademark of Mojang Studios / Microsoft; Grovus Tools is an independent fan
project, not affiliated with or endorsed by either. See [`LICENSE`](LICENSE).

## Accessibility

Real `<button>`/`<input>`/`<select>` elements throughout, not clickable
`div`s. Conflicts and errors are shown with text, never color alone. Focus
states are visible everywhere. The glint animation respects
`prefers-reduced-motion`.

## License

MIT — see [`LICENSE`](LICENSE).
