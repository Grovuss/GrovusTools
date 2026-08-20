"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Info, Link as LinkIcon, Check } from "lucide-react";
import { ItemPicker } from "@/components/ItemPicker";
import { EnchantmentPicker } from "@/components/EnchantmentPicker";
import { AdvancedOptions } from "@/components/AdvancedOptions";
import { CombineTree } from "@/components/CombineTree";
import { ResultCard } from "@/components/ResultCard";
import { StepList } from "@/components/StepList";
import { runOptimizer } from "@/lib/minecraft/optimizer";
import { getEnchantment } from "@/lib/minecraft/enchantments";
import { getItem } from "@/lib/minecraft/items";
import { CURRENT_VERSION } from "@/lib/minecraft/versions";
import { encodeStateToParams, decodeStateFromParams } from "@/lib/shareState";
import type { CalculatorInput, EnchantSelection, ItemCategory, OptimizationMode } from "@/lib/minecraft/types";

const MODES: { id: OptimizationMode; label: string }[] = [
  { id: "levels", label: "Lowest Levels" },
  { id: "xp", label: "Lowest XP" },
  { id: "work", label: "Lowest Work" },
];

const PRIOR_WORK_OPTIONS = [
  { value: 0, label: "0 — fresh item" },
  { value: 1, label: "1 — worked once" },
  { value: 2, label: "2 — worked twice" },
  { value: 3, label: "3 — worked three times" },
  { value: 4, label: "4 — worked four times" },
  { value: 5, label: "5 — worked five times" },
  { value: 6, label: "6 — worked six times" },
];

function EnchantmentsCalculator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = useMemo(() => decodeStateFromParams(searchParams), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [itemId, setItemId] = useState<ItemCategory>(initial.itemId ?? "sword");
  const [itemPriorWork, setItemPriorWork] = useState(initial.itemPriorWork ?? 0);
  const [existingEnchants, setExistingEnchants] = useState<EnchantSelection[]>(
    initial.existingEnchants ?? []
  );
  const [newEnchants, setNewEnchants] = useState<EnchantSelection[]>(initial.newEnchants ?? []);
  const [mode, setMode] = useState<OptimizationMode>(initial.mode ?? "levels");
  const [allowIncompatible, setAllowIncompatible] = useState(initial.allowIncompatible ?? false);
  const [ignoreLevelCap, setIgnoreLevelCap] = useState(initial.ignoreLevelCap ?? false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Item switch resets selections that no longer make sense.
  function handleItemChange(next: ItemCategory) {
    setItemId(next);
    setExistingEnchants([]);
    setNewEnchants([]);
  }

  function toggleEnchant(id: string) {
    setNewEnchants((prev) => {
      const exists = prev.find((e) => e.enchantId === id);
      if (exists) return prev.filter((e) => e.enchantId !== id);
      const ench = getEnchantment(id);
      return [...prev, { enchantId: id, level: ench.maxLevel }];
    });
  }

  function setEnchantLevel(id: string, level: number) {
    setNewEnchants((prev) => prev.map((e) => (e.enchantId === id ? { ...e, level } : e)));
  }

  const input: CalculatorInput = {
    itemId,
    itemPriorWork,
    existingEnchants,
    newEnchants,
    mode,
    allowIncompatible,
    ignoreLevelCap,
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- `input` is rebuilt every render from these primitives/arrays; listing it would just re-add itself.
  const result = useMemo(() => runOptimizer(input), [
    itemId,
    itemPriorWork,
    existingEnchants,
    newEnchants,
    mode,
    allowIncompatible,
    ignoreLevelCap,
  ]);

  // Keep the URL in sync so the configuration is always shareable, and
  // remember the last-used tool/preferences locally (not the config itself
  // — the URL remains the source of truth for that).
  useEffect(() => {
    const params = encodeStateToParams(input);
    router.replace(`?${params.toString()}`, { scroll: false });
    try {
      window.localStorage.setItem("grovus:lastTool", "enchantments");
      window.localStorage.setItem("grovus:enchantMode", mode);
    } catch {
      /* localStorage unavailable (private browsing, etc.) — safe to ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, itemPriorWork, existingEnchants, newEnchants, mode, allowIncompatible, ignoreLevelCap]);

  function copyShareLink() {
    const params = encodeStateToParams(input);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    });
  }

  const item = getItem(itemId);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-raised)] px-3 py-1 font-mono text-xs text-[var(--color-green-400)]">
          Version
          <select
            value={CURRENT_VERSION}
            disabled
            className="cursor-not-allowed bg-transparent font-mono text-xs text-[var(--color-ink-50)]"
            aria-label="Minecraft version"
          >
            <option>{CURRENT_VERSION}</option>
          </select>
        </div>
        <button
          onClick={copyShareLink}
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-200)] transition-colors hover:text-[var(--color-ink-50)]"
        >
          {copiedLink ? <Check size={13} aria-hidden="true" /> : <LinkIcon size={13} aria-hidden="true" />}
          {copiedLink ? "Link copied" : "Copy Share Link"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left configuration panel */}
        <div className="space-y-4">
          <div className="grovus-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-green-400)]">
                1 · Your Item
              </h2>
              <span className="text-xs text-[var(--color-ink-600)]">{item.name}</span>
            </div>
            <ItemPicker value={itemId} onChange={handleItemChange} />

            <div className="mt-4">
              <label htmlFor="prior-work" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-400)]">
                Prior Anvil Uses
                <span title="Every anvil operation on an item increases a hidden use-count. Each future operation adds 2^uses - 1 extra levels.">
                  <Info size={12} className="text-[var(--color-ink-600)]" aria-hidden="true" />
                </span>
              </label>
              <select
                id="prior-work"
                value={itemPriorWork}
                onChange={(e) => setItemPriorWork(Number(e.target.value))}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-2.5 py-2 text-sm text-[var(--color-ink-50)]"
              >
                {PRIOR_WORK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grovus-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-green-400)]">
                2 · Enchantments
              </h2>
              <span className="text-xs text-[var(--color-ink-600)]">
                {newEnchants.length} book{newEnchants.length === 1 ? "" : "s"} selected
              </span>
            </div>
            <EnchantmentPicker
              itemId={itemId}
              selections={newEnchants}
              existing={existingEnchants}
              allowIncompatible={allowIncompatible}
              onToggle={toggleEnchant}
              onLevelChange={setEnchantLevel}
            />
          </div>

          <AdvancedOptions
            itemId={itemId}
            existingEnchants={existingEnchants}
            setExistingEnchants={setExistingEnchants}
            allowIncompatible={allowIncompatible}
            setAllowIncompatible={setAllowIncompatible}
            ignoreLevelCap={ignoreLevelCap}
            setIgnoreLevelCap={setIgnoreLevelCap}
            newEnchants={newEnchants}
            setNewEnchants={setNewEnchants}
          />
        </div>

        {/* Result area */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Optimization mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                role="radio"
                aria-checked={mode === m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === m.id
                    ? "bg-[var(--color-green-950)] text-[var(--color-green-400)]"
                    : "border border-[var(--color-border)] text-[var(--color-ink-400)] hover:border-[var(--color-border-bright)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
            <CombineTree
              steps={result.steps}
              itemId={itemId}
              finalEnchants={result.finalEnchants}
              success={result.success}
            />
            <ResultCard
              itemId={itemId}
              enchants={result.finalEnchants}
              priorWork={result.finalPriorWork}
              totalCost={result.totalCost}
              totalXp={result.totalXp}
              largestStep={result.largestStep}
              success={result.success}
              reason={result.reason}
            />
          </div>

          <StepList steps={result.steps} itemName={item.name} />
        </div>
      </div>
    </div>
  );
}

export default function EnchantmentsPage() {
  return (
    <Suspense fallback={null}>
      <EnchantmentsCalculator />
    </Suspense>
  );
}
