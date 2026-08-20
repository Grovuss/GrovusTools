"use client";

import { useMemo, useState } from "react";
import { Search, Minus, Plus, X } from "lucide-react";
import {
  ENCHANT_CATEGORIES,
  enchantmentsForItem,
  getEnchantment,
} from "@/lib/minecraft/enchantments";
import { conflictingWith } from "@/lib/minecraft/conflicts";
import { toRoman } from "@/lib/minecraft/optimizer";
import { PixelIcon } from "./PixelIcon";
import { ENCHANTED_BOOK_TEXTURE } from "@/lib/minecraft/items";
import type { EnchantSelection, ItemCategory } from "@/lib/minecraft/types";

interface Props {
  itemId: ItemCategory;
  selections: EnchantSelection[];
  existing: EnchantSelection[];
  allowIncompatible: boolean;
  onToggle: (id: string) => void;
  onLevelChange: (id: string, level: number) => void;
}

export function EnchantmentPicker({
  itemId,
  selections,
  existing,
  allowIncompatible,
  onToggle,
  onLevelChange,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const compatible = useMemo(() => enchantmentsForItem(itemId), [itemId]);
  const selectedIds = useMemo(() => new Set(selections.map((s) => s.enchantId)), [selections]);
  const lockedIds = useMemo(
    () => [...existing.map((e) => e.enchantId), ...selections.map((s) => s.enchantId)],
    [existing, selections]
  );

  const filtered = compatible.filter((e) => {
    if (category !== "all" && e.category !== category) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-600)]"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search enchantments..."
            aria-label="Search enchantments"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] py-1.5 pl-8 pr-2 text-sm text-[var(--color-ink-50)] placeholder:text-[var(--color-ink-600)] focus-visible:border-[var(--color-green-500)]"
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Enchantment categories">
        {ENCHANT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={category === c.id}
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              category === c.id
                ? "bg-[var(--color-purple-950)] text-[var(--color-purple-300)]"
                : "text-[var(--color-ink-400)] hover:bg-white/5"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grovus-scroll mb-4 flex max-h-48 flex-wrap gap-1.5 overflow-y-auto pr-1" role="group" aria-label="Available enchantments">
        {filtered.map((ench) => {
          const isSelected = selectedIds.has(ench.id);
          const conflicts = allowIncompatible
            ? []
            : conflictingWith(
                lockedIds.filter((id) => id !== ench.id),
                ench.id
              );
          const disabled = !isSelected && conflicts.length > 0;
          return (
            <button
              key={ench.id}
              disabled={disabled}
              title={
                disabled
                  ? `Conflicts with ${conflicts.map((id) => getEnchantment(id).name).join(", ")}`
                  : ench.description
              }
              onClick={() => onToggle(ench.id)}
              aria-pressed={isSelected}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-[var(--color-purple-500)] bg-[var(--color-purple-950)] text-[var(--color-purple-300)]"
                  : disabled
                  ? "cursor-not-allowed border-[var(--color-border)] text-[var(--color-ink-600)] line-through decoration-[var(--color-danger-500)]/60"
                  : "border-[var(--color-border)] text-[var(--color-ink-200)] hover:border-[var(--color-border-bright)] hover:text-[var(--color-ink-50)]"
              }`}
            >
              {ench.name}
              {ench.maxLevel > 1 ? ` ${toRoman(ench.maxLevel)}` : ""}
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <p className="py-2 text-sm text-[var(--color-ink-600)]">No enchantments match.</p>
        ) : null}
      </div>

      <div className="space-y-2">
        {selections.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-sm text-[var(--color-ink-600)]">
            Pick enchantments above to add them as books.
          </p>
        ) : (
          selections.map((sel) => {
            const ench = getEnchantment(sel.enchantId);
            return (
              <div
                key={sel.enchantId}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-purple-500)]/40 bg-[var(--color-purple-950)]/40 px-3 py-2"
              >
                <PixelIcon src={ENCHANTED_BOOK_TEXTURE} alt="" size={20} className="grovus-glow-purple" />
                <span className="flex-1 text-sm font-medium text-[var(--color-ink-50)]">{ench.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    aria-label={`Decrease ${ench.name} level`}
                    onClick={() => onLevelChange(sel.enchantId, Math.max(1, sel.level - 1))}
                    disabled={sel.level <= 1}
                    className="grid h-6 w-6 place-items-center rounded border border-[var(--color-border)] text-[var(--color-ink-400)] hover:border-[var(--color-border-bright)] disabled:opacity-30"
                  >
                    <Minus size={12} aria-hidden="true" />
                  </button>
                  <span className="w-7 text-center font-mono text-sm text-[var(--color-purple-300)]">
                    {toRoman(sel.level)}
                  </span>
                  <button
                    aria-label={`Increase ${ench.name} level`}
                    onClick={() => onLevelChange(sel.enchantId, Math.min(ench.maxLevel, sel.level + 1))}
                    disabled={sel.level >= ench.maxLevel}
                    className="grid h-6 w-6 place-items-center rounded border border-[var(--color-border)] text-[var(--color-ink-400)] hover:border-[var(--color-border-bright)] disabled:opacity-30"
                  >
                    <Plus size={12} aria-hidden="true" />
                  </button>
                </div>
                <button
                  aria-label={`Remove ${ench.name}`}
                  onClick={() => onToggle(sel.enchantId)}
                  className="grid h-6 w-6 place-items-center rounded text-[var(--color-ink-600)] hover:text-[var(--color-danger-400)]"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
