# Grovus Tools

Minecraft utilities without the bullshit.

Grovus Tools is a small collection of Minecraft calculators, built as a real
Next.js web app instead of a spreadsheet or a Discord bot command. Everything
runs client-side in your browser — no backend, no database, no accounts.

**Live tools in this release:**

- **[Enchantment Calculator](/tools/enchantments)** — finds the cheapest valid
  order to combine enchanted books and gear in a Java Edition anvil, with a
  real subset dynamic-program optimizer (not a flat "sum the levels" guess).
- **[Coordinate Calculator](/tools/coordinates)** — converts Overworld ↔
  Nether coordinates using the 8:1 ratio, with correct negative-number
  handling and F3 debug-screen paste support.

## Why the enchantment calculator is more than a formula

Java Edition's anvil cost isn't `sum of enchantment levels`. It's shaped by:

- **Prior work penalty** — every anvil operation on an item adds a hidden
  "uses" counter, and each future operation costs an extra `2^uses - 1`
  levels on top of everything else.
- **Book vs. item cost** — every enchantment has two different cost
  multipliers depending on whether it arrives via an enchanted book or a
  non-book item.
- **Order asymmetry** — combining `A + B` is not the same price as `B + A`,
  because only the *sacrifice* (right slot) side's content gets charged; the
  *target* (left slot) side's existing enchantments ride along for free.
- **The 39-level survival cap** — any single anvil operation costing 40+
  levels is rejected outright by a survival anvil.

Because of this, the *order* you combine books in changes the total cost —
sometimes by a lot — and finding the cheapest order is a real combinatorial
search problem, not a lookup. See
[`src/lib/minecraft/optimizer.ts`](src/lib/minecraft/optimizer.ts) for a full
writeup of the algorithm (a Held–Karp-style subset dynamic program) and why
it's structured that way.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- React 19
- [lucide-react](https://lucide.dev) for icons
- [Vitest](https://vitest.dev) for the calculation-engine test suite
- No backend, no database — every calculator runs entirely in the browser

## Local development

```bash
git clone <your-fork-url>
cd grovus-tools
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

The Minecraft mechanics (prior work, enchantment merging, conflicts, the
39-level cap, coordinate conversion, and the optimizer itself) are covered by
a Vitest suite independent of React:

```bash
npm test          # run once
npm run test:watch
```

## Production build

```bash
npm run build
npm run start
```

## Deploying to Vercel

1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), choose **Add New → Project** and import
   the repository. Vercel auto-detects Next.js — no configuration needed.
3. Deploy. Every push to `main` redeploys automatically; every pull request
   gets a preview deployment.

There are no environment variables, no database, and no server that needs to
stay running — the whole app is static/client-rendered pages plus a couple of
prerendered routes.

## Minecraft version / data support

Rules data (enchantment multipliers, max levels, conflicts, item
compatibility) lives behind a small version registry in
[`src/lib/minecraft/versions.ts`](src/lib/minecraft/versions.ts) rather than
being scattered through the UI. Today only **Java Edition 26.2** is
implemented. To add a future version:

1. Duplicate the relevant parts of `enchantments.ts` / `items.ts` for the new
   rules.
2. Add an entry to `MINECRAFT_VERSIONS` in `versions.ts`.
3. Wire a version selector value to it — the calculator UI and optimizer
   don't need to change, since they only ever read through
   `getVersionData()`.

Grovus never claims to support a version whose data isn't actually filled in.

## Project structure

```text
src/
  app/
    page.tsx                    # homepage
    tools/page.tsx               # tool directory
    tools/enchantments/page.tsx  # enchantment calculator
    tools/coordinates/page.tsx   # coordinate calculator
  components/                    # UI components (calculator panels, tree, etc.)
  lib/
    shareState.ts                # URL <-> calculator state (de)serialization
    minecraft/
      types.ts                   # shared engine types
      enchantments.ts            # enchantment database
      items.ts                   # item database
      anvil.ts                   # core anvil mechanics (prior work, merging)
      optimizer.ts                # the combine-order search algorithm
      conflicts.ts                 # enchantment conflict rules
      xp.ts                        # Java Edition XP curve
      coordinates.ts               # Overworld/Nether conversion + parsing
      versions.ts                  # version-aware data registry
tests/                            # Vitest suite for the engine above
public/textures/                  # extracted Minecraft item/block textures
```

The calculation engine under `src/lib/minecraft` is deliberately independent
of React, so it can be unit tested directly, reused by a future CLI, or moved
into a Web Worker without touching any UI code.

## Adding another tool

Grovus is structured so a new tool is mostly additive:

1. Add a route at `src/app/tools/<your-tool>/page.tsx`.
2. Put any real calculation logic in `src/lib/<your-tool>/`, independent of
   React, the same way the enchantment/coordinate engines are.
3. Add a card for it to the homepage and `/tools` directory (or leave it as a
   "Coming Soon" card until it's ready).
4. Add a link to it in `src/components/Header.tsx`.

No shared layout, database, or routing changes are required.

## Texture assets

`public/textures/` contains a small, hand-picked subset of Minecraft's item
and block textures (swords, tools, armor, books, the anvil, the enchanting
table, etc.) — not the full texture pack. Only the files the app actually
references were extracted; everything is rendered with
`image-rendering: pixelated` so the pixel art stays crisp at any display
size instead of blurring.

Minecraft is a trademark of Mojang Studios / Microsoft. Grovus Tools is an
independent fan project, not affiliated with or endorsed by Mojang Studios or
Microsoft. See [`LICENSE`](LICENSE) for details.

## Accessibility

- All interactive controls are real `<button>`/`<input>`/`<select>` elements
  with labels, not `div`s with click handlers.
- Enchantment conflicts are shown with text (strikethrough + tooltip), not
  color alone.
- Focus states are visible everywhere (`:focus-visible` outlines).
- Animations (the enchanted-item glint sweep) respect `prefers-reduced-motion`.

## License

MIT — see [`LICENSE`](LICENSE).
