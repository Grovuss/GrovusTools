"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PatternThumbnail } from "./PatternThumbnail";
import { BANNER_PATTERNS } from "@/lib/minecraft/banners";

export function PatternPicker({
  value,
  onChange,
  baseColorHex,
  colorHex,
}: {
  value: string;
  onChange: (patternId: string) => void;
  baseColorHex: string;
  colorHex: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = BANNER_PATTERNS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="relative mb-2">
        <Search
          size={13}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-600)]"
          aria-hidden="true"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patterns..."
          aria-label="Search patterns"
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] py-1.5 pl-8 pr-2 text-xs text-[var(--color-ink-50)] placeholder:text-[var(--color-ink-600)] focus-visible:border-[var(--color-green-500)]"
        />
      </div>
      <div
        className="grovus-scroll grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-5"
        role="radiogroup"
        aria-label="Pattern"
      >
        {filtered.map((p) => {
          const active = p.id === value;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={p.name + (p.requiresItem ? " (needs pattern item)" : "")}
              onClick={() => onChange(p.id)}
              className={`flex flex-col items-center gap-1 rounded-md border p-1.5 transition-colors ${
                active
                  ? "border-[var(--color-green-500)] bg-[var(--color-green-950)]"
                  : "border-[var(--color-border)] bg-[var(--color-bg-inset)] hover:border-[var(--color-border-bright)]"
              }`}
            >
              <PatternThumbnail baseColorHex={baseColorHex} patternTexture={p.texture} patternColorHex={colorHex} />
              <span className="line-clamp-2 text-center text-[9px] leading-tight text-[var(--color-ink-400)]">
                {p.name}
                {p.requiresItem ? " *" : ""}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <p className="col-span-full py-4 text-center text-xs text-[var(--color-ink-600)]">No patterns match.</p>
        ) : null}
      </div>
      <p className="mt-1.5 text-[10px] text-[var(--color-ink-600)]">* needs a crafted pattern item in-game</p>
    </div>
  );
}
