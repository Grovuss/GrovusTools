"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getEnchantment, enchantmentsForItem } from "@/lib/minecraft/enchantments";
import { toRoman } from "@/lib/minecraft/optimizer";
import type { EnchantSelection, ItemCategory } from "@/lib/minecraft/types";

interface Props {
  itemId: ItemCategory;
  existingEnchants: EnchantSelection[];
  setExistingEnchants: (v: EnchantSelection[]) => void;
  allowIncompatible: boolean;
  setAllowIncompatible: (v: boolean) => void;
  ignoreLevelCap: boolean;
  setIgnoreLevelCap: (v: boolean) => void;
  newEnchants: EnchantSelection[];
  setNewEnchants: (v: EnchantSelection[]) => void;
}

export function AdvancedOptions({
  itemId,
  existingEnchants,
  setExistingEnchants,
  allowIncompatible,
  setAllowIncompatible,
  ignoreLevelCap,
  setIgnoreLevelCap,
  newEnchants,
  setNewEnchants,
}: Props) {
  const [open, setOpen] = useState(false);
  const compatible = enchantmentsForItem(itemId);

  function toggleExisting(id: string) {
    const has = existingEnchants.find((e) => e.enchantId === id);
    if (has) {
      setExistingEnchants(existingEnchants.filter((e) => e.enchantId !== id));
    } else {
      const ench = getEnchantment(id);
      setExistingEnchants([...existingEnchants, { enchantId: id, level: ench.maxLevel }]);
    }
  }

  function setExistingLevel(id: string, level: number) {
    setExistingEnchants(existingEnchants.map((e) => (e.enchantId === id ? { ...e, level } : e)));
  }

  function setBookPriorWork(id: string, priorWork: number) {
    setNewEnchants(newEnchants.map((e) => (e.enchantId === id ? { ...e, priorWork } : e)));
  }

  return (
    <div className="grovus-panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-ink-400)]">
          Advanced Options
        </span>
        <ChevronDown
          size={16}
          className={`text-[var(--color-ink-600)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="space-y-5 border-t border-[var(--color-border)] px-4 py-4">
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={allowIncompatible}
              onChange={(e) => setAllowIncompatible(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-purple-500)]"
            />
            <span className="text-sm text-[var(--color-ink-200)]">
              Allow incompatible enchantments
              <span className="block text-xs text-[var(--color-ink-600)]">
                Bypass conflict rules (Sharpness + Smite, Fortune + Silk Touch, etc.) for theoretical builds.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={ignoreLevelCap}
              onChange={(e) => setIgnoreLevelCap(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--color-purple-500)]"
            />
            <span className="text-sm text-[var(--color-ink-200)]">
              Ignore 39-level limit
              <span className="block text-xs text-[var(--color-ink-600)]">
                Allow steps a survival anvil would reject, for theoretical calculations.
              </span>
            </span>
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--color-ink-200)]">Item already has</p>
            <div className="flex flex-wrap gap-1.5">
              {compatible.map((ench) => {
                const has = existingEnchants.find((e) => e.enchantId === ench.id);
                return (
                  <button
                    key={ench.id}
                    onClick={() => toggleExisting(ench.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      has
                        ? "border-[var(--color-green-500)] bg-[var(--color-green-950)] text-[var(--color-green-400)]"
                        : "border-[var(--color-border)] text-[var(--color-ink-400)] hover:border-[var(--color-border-bright)]"
                    }`}
                  >
                    {ench.name}
                  </button>
                );
              })}
            </div>
            {existingEnchants.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {existingEnchants.map((e) => {
                  const ench = getEnchantment(e.enchantId);
                  return (
                    <div key={e.enchantId} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-ink-400)]">{ench.name}</span>
                      <select
                        value={e.level}
                        onChange={(ev) => setExistingLevel(e.enchantId, Number(ev.target.value))}
                        className="rounded border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-ink-50)]"
                      >
                        {Array.from({ length: ench.maxLevel }, (_, i) => i + 1).map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {toRoman(lvl)}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {newEnchants.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--color-ink-200)]">
                Prior anvil uses per book
                <span className="block text-xs font-normal text-[var(--color-ink-600)]">
                  Only matters if you already combined that book with something else.
                </span>
              </p>
              <div className="space-y-1.5">
                {newEnchants.map((e) => {
                  const ench = getEnchantment(e.enchantId);
                  return (
                    <div key={e.enchantId} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-ink-400)]">{ench.name} book</span>
                      <input
                        type="number"
                        min={0}
                        max={6}
                        value={e.priorWork ?? 0}
                        onChange={(ev) => setBookPriorWork(e.enchantId, Number(ev.target.value))}
                        className="w-14 rounded border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-1.5 py-0.5 text-right font-mono text-xs text-[var(--color-ink-50)]"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
