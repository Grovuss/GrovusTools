import { ArrowDown, Plus } from "lucide-react";
import { getEnchantment } from "@/lib/minecraft/enchantments";
import { getItem, ENCHANTED_BOOK_TEXTURE } from "@/lib/minecraft/items";
import { toRoman } from "@/lib/minecraft/optimizer";
import { PixelIcon } from "./PixelIcon";
import type { AnvilStep, EnchantSelection, ItemCategory } from "@/lib/minecraft/types";

/**
 * Renders the optimizer's chosen combine order as a vertical merge tree.
 *
 * The optimizer already resolves the whole plan into an ordered list of
 * binary anvil operations (`steps`) — every internal book-merge and the
 * final application(s) to the target, in the exact sequence they must be
 * performed. That ordered list *is* the combine tree's execution order with
 * no information lost, so it's what drives this visualization directly,
 * rather than re-deriving positions from a separate node graph.
 */
export function CombineTree({
  steps,
  itemId,
  finalEnchants,
  success,
}: {
  steps: AnvilStep[];
  itemId: ItemCategory;
  finalEnchants: EnchantSelection[];
  success: boolean;
}) {
  const item = getItem(itemId);

  if (steps.length === 0) {
    return (
      <div className="grovus-panel flex min-h-[240px] flex-col items-center justify-center gap-3 p-8 text-center">
        {item.texture ? <PixelIcon src={item.texture} alt="" size={40} /> : null}
        <p className="text-sm text-[var(--color-ink-600)]">
          Select enchantments in the left panel to see the combine tree.
        </p>
      </div>
    );
  }

  return (
    <div className="grovus-panel overflow-x-auto p-6">
      <div className="flex min-w-fit flex-col items-center gap-0">
        {steps.map((step, i) => (
          <div key={step.index} className="flex w-full flex-col items-center">
            <div className="flex items-center gap-3 sm:gap-5">
              <TreeSlot label={step.leftLabel} enchants={step.leftEnchants} itemId={itemId} />
              <Plus size={16} className="shrink-0 text-[var(--color-ink-600)]" aria-hidden="true" />
              <TreeSlot label={step.rightLabel} enchants={step.rightEnchants} itemId={null} />
            </div>

            <ArrowDown size={16} className="my-1 text-[var(--color-border-bright)]" aria-hidden="true" />

            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-bold ${
                step.tooExpensive
                  ? "border-[var(--color-danger-500)] bg-[var(--color-danger-500)]/10 text-[var(--color-danger-400)]"
                  : "border-[var(--color-purple-500)] bg-[var(--color-purple-950)] text-[var(--color-purple-300)]"
              }`}
            >
              <span className="opacity-60">{i + 1}</span>
              {step.tooExpensive ? "TOO EXPENSIVE" : `+${step.cost} XP levels`}
            </div>

            <ArrowDown size={16} className="my-1 text-[var(--color-border-bright)]" aria-hidden="true" />
          </div>
        ))}

        <div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-purple-500)] bg-[var(--color-purple-950)]/50 px-6 py-4">
          {item.texture ? (
            <PixelIcon src={item.texture} alt="" size={36} className="grovus-glow-purple" />
          ) : null}
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-purple-300)]">
            {success ? "Result" : "Incomplete"}
          </span>
          <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-center">
            {finalEnchants.map((e) => (
              <span key={e.enchantId} className="font-mono text-[11px] text-[var(--color-ink-200)]">
                {getEnchantment(e.enchantId).name} {toRoman(e.level)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeSlot({
  label,
  enchants,
  itemId,
}: {
  label: string;
  enchants: EnchantSelection[];
  itemId: ItemCategory | null;
}) {
  const item = itemId ? getItem(itemId) : null;
  const texture = item?.texture ?? ENCHANTED_BOOK_TEXTURE;
  return (
    <div className="flex min-w-[110px] flex-col items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-3 py-2.5">
      <PixelIcon src={texture} alt="" size={24} />
      <span className="text-center font-mono text-[10px] leading-tight text-[var(--color-ink-200)]">
        {enchants.length > 0
          ? enchants.map((e) => `${getEnchantment(e.enchantId).name} ${toRoman(e.level)}`).join(" · ")
          : label}
      </span>
    </div>
  );
}
