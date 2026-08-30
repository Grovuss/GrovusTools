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
- **[World Seed Finder](/tools/seed-finder)** — recovers a world seed from
  known structure locations using Java Edition's real structure-placement
  math, verified against every observation supplied.

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

## World Seed Finder

### Research first

Before writing any placement code we pulled the actual algorithm from
[Cubitect/cubiomes](https://github.com/Cubitect/cubiomes) (`finders.h`/`finders.c`),
the reference implementation the project brief named, rather than guessing:

```text
regionSeed = regionX*341873128712 + regionZ*132897987541 + worldSeed + structureSalt
rand = JavaRandom(regionSeed)
chunkX = regionX*regionSize + rand.nextInt(chunkRange)
chunkZ = regionZ*regionSize + rand.nextInt(chunkRange)
```

`src/lib/minecraft/javaRandom.ts` is a BigInt port of `java.util.Random`,
matched line-for-line against Oracle's own published `nextInt(bound)` source
(including its rejection-sampling edge case) — see its tests for the
hand-verifiable invariants used in place of a possibly-misremembered magic
number. `src/lib/minecraft/structureSeed.ts` carries the cubiomes-sourced
salt/spacing constants and the forward placement function; `tests/structureSeed.test.ts`
round-trips it end to end (generate an observation from a known seed, then
confirm the search finds that exact seed back).

### Why cubiomes wasn't compiled to WASM

The brief's preferred architecture — C/Rust generation core compiled to
WASM, run in a Web Worker — is the right call for full biome-aware
generation. For the specific piece implemented here (structure region
placement: a LCG seed plus two bounded RNG rolls), the "port" is about 100
lines of directly-sourced, directly-testable arithmetic, not a
reimplementation of Minecraft's generation stack. Reaching for a C toolchain
and a WASM build pipeline for that would add real risk (a from-scratch
build in this environment, with no way to regression-test it against actual
Minecraft) without a corresponding accuracy or maintainability win. Web
Workers are still used, for the reason the brief cares about: the search
itself is CPU-heavy and must never block the UI.

### Why the search isn't a full 48-bit brute force

Structure placement depends only on a seed's lower 48 bits, so exhaustive
cracking means up to ~281 trillion candidates. Cubiomes can chew through
that in native, optimized C; a JS Web Worker cannot in any reasonable time
(tens of hours, even parallelized). Rather than promise that and quietly
fail to deliver, the finder searches the ~4.3 billion seeds that correspond
to how Minecraft actually derives a seed from typed text (Java's 32-bit
`String.hashCode()`, sign-extended) or a plain number — which is how the
overwhelming majority of real, shared, human-chosen seeds are made. This is
stated in the tool itself, not just here. A custom range is available for
narrower or more targeted searches.

### Supported structures

Only structures using the simple, uniform "Feature" placement type are
included: **Desert Pyramid, Igloo, Jungle Temple, Swamp Hut**. Structures
using triangular placement (Ocean Monument, Woodland Mansion, End City) or
ones we could not confirm current-version constants for from source
(Shipwreck, Pillager Outpost) are left out rather than shipped with guessed
values — matching the brief's own `biomeValidationSupported` /
`seedCrackingSupported` distinction. Biome validation (confirming the
predicted chunk's biome actually matches the structure, for extra
confidence) is not implemented for any structure; every result is still a
genuine, verified match on placement — see the in-app "How this works" note.

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
    tools/seed-finder/page.tsx      # world seed finder
    api/minecraft/player/route.ts        # username/UUID -> color (+ indexes it)
    api/minecraft/color-matches/route.ts # paginated color match lookup
  components/                       # UI components
  workers/seedFinder.worker.ts      # one search slice; the UI spawns several
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
      javaRandom.ts                 # java.util.Random port (BigInt, verified)
      structureSeed.ts              # cubiomes-sourced structure placement
      seedFinder.ts                 # the search space + per-batch verification
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
