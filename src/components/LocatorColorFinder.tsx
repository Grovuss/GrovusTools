"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, AlertTriangle, Info, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { LocatorBarPreview } from "@/components/LocatorBarPreview";
import { PlayerHead } from "@/components/PlayerHead";
import { CopyButton } from "@/components/CopyButton";

interface LocatorColor {
  hex: string;
  r: number;
  g: number;
  b: number;
}

interface PlayerResult {
  uuid: string;
  username: string | null;
  color: LocatorColor;
  source: "uuid" | "mojang";
}

interface PlayerRecord {
  uuid: string;
  username: string;
  color: string;
}

interface MatchesPage {
  total: number;
  totalIndexed: number;
  players: PlayerRecord[];
  isPersistent: boolean;
}

const PAGE_SIZE = 25;

function LocatorColorFinder() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [input, setInput] = useState(() => searchParams.get("uuid") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlayerResult | null>(null);

  const [matches, setMatches] = useState<MatchesPage | null>(null);
  const [page, setPage] = useState(1);
  const [matchesLoading, setMatchesLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setMatches(null);
    try {
      const res = await fetch(`/api/minecraft/player?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Something went wrong.");
        return;
      }
      setResult(data);
      setPage(1);
      router.replace(`?uuid=${data.uuid}`, { scroll: false });
    } catch {
      setError("Couldn't reach Grovus's API. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Resolve a shared/bookmarked ?uuid= link on load.
  useEffect(() => {
    const uuid = searchParams.get("uuid");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount from the URL; there's nothing to synchronize without it.
    if (uuid) search(uuid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMatches = useCallback(async (colorHex: string, pageNum: number) => {
    setMatchesLoading(true);
    try {
      const res = await fetch(
        `/api/minecraft/color-matches?color=${encodeURIComponent(colorHex)}&page=${pageNum}&pageSize=${PAGE_SIZE}`
      );
      const data: MatchesPage = await res.json();
      setMatches(data);
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!result) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-[result,page]-change; this effect's whole job is to load that page.
    loadMatches(result.color.hex, page);
  }, [result, page, loadMatches]);

  const otherMatches = matches?.players.filter((p) => p.uuid !== result?.uuid) ?? [];
  const totalPages = matches ? Math.max(1, Math.ceil(matches.total / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-border-bright)] bg-[var(--color-purple-950)] text-[var(--color-purple-400)]">
          <MapPin size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-mono text-2xl font-bold text-[var(--color-ink-50)]">Locator Bar Color Finder</h1>
          <p className="text-sm text-[var(--color-ink-400)]">
            Java Edition 26.2 · derived from a player&apos;s UUID, not their username
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(input);
        }}
        className="grovus-panel flex flex-col gap-3 p-4 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-600)]" aria-hidden="true" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Notch or 069a79f4-44e9-4726-a5be-fca90e38aaf5"
            aria-label="Minecraft username or UUID"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] py-2.5 pl-9 pr-3 font-mono text-sm text-[var(--color-ink-50)] placeholder:text-[var(--color-ink-600)] focus-visible:border-[var(--color-green-500)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-[var(--color-green-500)] bg-[var(--color-green-950)] px-5 py-2.5 text-sm font-semibold text-[var(--color-green-400)] transition-colors hover:bg-[var(--color-green-950)]/70 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Find Color"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-[var(--color-danger-500)]/40 bg-[var(--color-danger-500)]/10 px-3 py-2.5 text-sm text-[var(--color-danger-400)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="mt-6 grovus-panel relative overflow-hidden p-6">
            <div className="grovus-glint pointer-events-none absolute inset-0" />
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-600)]">
              {result.username ? result.username : "This UUID's"} Locator Bar color
            </p>

            <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div
                className="h-24 w-24 shrink-0 rounded-xl border border-white/10 shadow-inner"
                style={{ backgroundColor: result.color.hex }}
                aria-hidden="true"
              />
              <div className="flex-1 space-y-1">
                {result.username ? (
                  <p className="font-mono text-xl font-bold text-[var(--color-ink-50)]">{result.username}</p>
                ) : null}
                <p className="font-mono text-2xl font-bold" style={{ color: result.color.hex }}>
                  {result.color.hex}
                </p>
                <p className="font-mono text-sm text-[var(--color-ink-400)]">
                  RGB {result.color.r}, {result.color.g}, {result.color.b}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col">
                <CopyButton value={result.color.hex} label="Copy Hex" />
                <CopyButton value={`${result.color.r}, ${result.color.g}, ${result.color.b}`} label="Copy RGB" />
                <CopyButton value={result.uuid} label="Copy UUID" />
              </div>
            </div>

            <div className="mt-5">
              <LocatorBarPreview color={result.color.hex} />
            </div>

            <p className="mt-3 break-all font-mono text-xs text-[var(--color-ink-600)]">UUID: {result.uuid}</p>
          </div>

          <div className="mt-4 grovus-panel flex items-start gap-2.5 p-4 text-sm text-[var(--color-ink-400)]">
            <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-purple-400)]" aria-hidden="true" />
            <p>
              This is the player&apos;s <strong className="text-[var(--color-ink-200)]">default</strong> UUID-derived
              color. Team colors and explicit waypoint overrides can make the color shown in-game different — Grovus
              has no access to a player&apos;s current server state.
              {result.source === "mojang" ? (
                <span className="block mt-1">
                  Resolved via Mojang, so this only covers premium accounts. Offline-mode/cracked-server UUIDs
                  aren&apos;t in Mojang&apos;s records — search by UUID directly if you have it.
                </span>
              ) : null}
            </p>
          </div>

          <section className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[var(--color-ink-400)]">
                Known players with this color
              </h2>
              {matches ? (
                <span className="font-mono text-xs text-[var(--color-ink-600)]">
                  {matches.total.toLocaleString()} known
                </span>
              ) : null}
            </div>

            {matchesLoading && !matches ? (
              <div className="grovus-panel p-6 text-center text-sm text-[var(--color-ink-600)]">Loading matches…</div>
            ) : matches && otherMatches.length === 0 ? (
              <div className="grovus-panel p-6 text-center text-sm text-[var(--color-ink-600)]">
                No other players in Grovus&apos;s indexed database share this exact color yet.
              </div>
            ) : matches ? (
              <div className="grovus-panel divide-y divide-[var(--color-border)] overflow-hidden">
                {otherMatches.map((p) => (
                  <div key={p.uuid} className="flex items-center gap-3 px-4 py-2.5">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/10"
                      style={{ backgroundColor: p.color }}
                      aria-hidden="true"
                    />
                    <PlayerHead uuid={p.uuid} />
                    <span className="flex-1 truncate text-sm text-[var(--color-ink-50)]">{p.username}</span>
                    <span className="hidden truncate font-mono text-xs text-[var(--color-ink-600)] sm:block">
                      {p.uuid}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {matches && totalPages > 1 ? (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-ink-400)] disabled:opacity-30"
                >
                  <ChevronLeft size={14} aria-hidden="true" /> Previous
                </button>
                <span className="font-mono text-xs text-[var(--color-ink-600)]">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-ink-400)] disabled:opacity-30"
                >
                  Next <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            ) : null}

            <div className="mt-4 grovus-panel p-4 text-sm text-[var(--color-ink-400)]">
              <h3 className="mb-1 font-medium text-[var(--color-ink-200)]">Why do other players have my color?</h3>
              <p>
                The Locator Bar color comes from a player&apos;s UUID, but the final color only has 24 bits of range
                (about 16.7 million possible values, and fewer still after the 0.9 shading). With far more Minecraft
                accounts than that, some players are guaranteed to land on the exact same color — it&apos;s not a
                sign of anything special, and Minecraft doesn&apos;t assign colors from a finite per-player palette.
              </p>
              <p className="mt-2">
                &ldquo;Known players&rdquo; means players who have been looked up through Grovus Tools — see the{" "}
                <a href="#dataset-note" className="underline decoration-dotted underline-offset-2">
                  note below
                </a>
                . It is never a claim about every Minecraft account.
              </p>
            </div>

            <p id="dataset-note" className="mt-4 text-xs leading-relaxed text-[var(--color-ink-600)]">
              {matches?.isPersistent
                ? `Grovus indexes players as people search for them — it does not import a third-party bulk dataset (see the README for why). ${matches.totalIndexed.toLocaleString()} players indexed so far.`
                : "This deployment has no database configured (DATABASE_URL unset), so matches aren't persisted between server restarts — see the README's \"Locator Bar player database\" section to connect one."}
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default function LocatorColorPage() {
  return (
    <Suspense fallback={null}>
      <LocatorColorFinder />
    </Suspense>
  );
}
