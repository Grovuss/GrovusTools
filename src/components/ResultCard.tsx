import { AlertTriangle } from "lucide-react";
import { getEnchantment } from "@/lib/minecraft/enchantments";
import { getItem } from "@/lib/minecraft/items";
import { toRoman } from "@/lib/minecraft/optimizer";
import { PixelIcon } from "./PixelIcon";
import type { EnchantSelection, ItemCategory } from "@/lib/minecraft/types";
import { SURVIVAL_LEVEL_CAP } from "@/lib/minecraft/xp";

export function ResultCard({
  itemId,
  enchants,
  priorWork,
  totalCost,
  totalXp,
  largestStep,
  success,
  reason,
}: {
  itemId: ItemCategory;
  enchants: EnchantSelection[];
  priorWork: number;
  totalCost: number;
  totalXp: number;
  largestStep: number;
  success: boolean;
  reason?: string;
}) {
  const item = getItem(itemId);
  const cap = SURVIVAL_LEVEL_CAP - 1;
  const pct = Math.min(100, (largestStep / cap) * 100);
  const overCap = largestStep >= SURVIVAL_LEVEL_CAP;

  return (
    <div
      className={`grovus-panel relative overflow-hidden p-5 ${
        success ? "border-[var(--color-purple-500)]/50" : "border-[var(--color-danger-500)]/60"
      }`}
    >
      {success ? <div className="grovus-glint pointer-events-none absolute inset-0" /> : null}

      <div className="mb-4 flex items-center gap-3">
        {item.texture ? (
          <PixelIcon src={item.texture} alt="" size={32} className="grovus-glow-purple" />
        ) : null}
        <h3 className="font-mono text-base font-bold text-[var(--color-ink-50)]">
          Enchanted {item.name}
        </h3>
      </div>

      {!success ? (
        <div className="flex items-start gap-2 rounded-md border border-[var(--color-danger-500)]/40 bg-[var(--color-danger-500)]/10 px-3 py-2.5 text-sm text-[var(--color-danger-400)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{reason ?? "This combination isn't currently supported."}</span>
        </div>
      ) : enchants.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-600)]">No enchantments selected yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {enchants.map((e) => {
            const ench = getEnchantment(e.enchantId);
            return (
              <li key={e.enchantId} className="flex items-center justify-between text-sm">
                <span className="text-[var(--color-ink-50)]">{ench.name}</span>
                <span className="font-mono text-[var(--color-purple-300)]">{toRoman(e.level)}</span>
              </li>
            );
          })}
        </ul>
      )}

      {enchants.length > 0 && success ? (
        <p className="mt-3 font-mono text-[11px] text-[var(--color-ink-600)]">
          prior work penalty: {Math.pow(2, priorWork) - 1} (worked ×{priorWork})
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--color-border)] pt-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-600)]">
            Total anvil cost
          </p>
          <p className="mt-0.5 font-mono text-xl font-bold text-[var(--color-green-400)]">
            {totalCost} <span className="text-sm font-normal text-[var(--color-ink-400)]">levels</span>
          </p>
          <p className="font-mono text-[11px] text-[var(--color-ink-600)]">
            ≈{Math.round(totalXp)} XP from scratch
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-600)]">
            Biggest single step
          </p>
          <p
            className={`mt-0.5 font-mono text-xl font-bold ${
              overCap ? "text-[var(--color-danger-400)]" : "text-[var(--color-ink-50)]"
            }`}
          >
            {largestStep} <span className="text-sm font-normal text-[var(--color-ink-400)]">/ 39 cap</span>
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-inset)]">
            <div
              className={`h-full rounded-full transition-all ${
                overCap ? "bg-[var(--color-danger-500)]" : "bg-gradient-to-r from-[var(--color-green-500)] to-[var(--color-purple-500)]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
