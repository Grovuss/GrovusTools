import { getEnchantment } from "@/lib/minecraft/enchantments";
import { toRoman } from "@/lib/minecraft/optimizer";
import { CopyButton } from "./CopyButton";
import type { AnvilStep } from "@/lib/minecraft/types";

function describe(enchants: AnvilStep["leftEnchants"]) {
  return enchants
    .map((e) => `${getEnchantment(e.enchantId).name} ${toRoman(e.level)}`)
    .join(" + ");
}

export function StepList({ steps, itemName }: { steps: AnvilStep[]; itemName: string }) {
  if (steps.length === 0) return null;

  const instructionsText = steps
    .map((s, i) => {
      const left = s.leftLabel === "Your Item" ? itemName : describe(s.leftEnchants) || s.leftLabel;
      const right = describe(s.rightEnchants) || s.rightLabel;
      return `Step ${i + 1}: Put "${left}" in the LEFT slot and "${right}" in the RIGHT slot. Cost: ${
        s.tooExpensive ? "TOO EXPENSIVE" : `${s.cost} levels`
      }. Result: ${describe(s.resultEnchants)}.`;
    })
    .join("\n");

  return (
    <div className="grovus-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[var(--color-ink-400)]">
          Step-by-step instructions
        </h3>
        <CopyButton value={instructionsText} label="Copy instructions" />
      </div>

      <ol className="space-y-3">
        {steps.map((s, i) => {
          const left = s.leftLabel === "Your Item" ? itemName : describe(s.leftEnchants) || s.leftLabel;
          const right = describe(s.rightEnchants) || s.rightLabel;
          return (
            <li key={s.index} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-inset)] p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--color-green-400)]">Step {i + 1}</span>
                <span
                  className={`font-mono text-xs font-bold ${
                    s.tooExpensive ? "text-[var(--color-danger-400)]" : "text-[var(--color-purple-300)]"
                  }`}
                >
                  {s.tooExpensive ? "TOO EXPENSIVE" : `${s.cost} levels`}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-[var(--color-ink-200)]">
                Left slot: <span className="text-[var(--color-ink-50)]">{left}</span>
              </p>
              <p className="text-sm text-[var(--color-ink-200)]">
                Right slot: <span className="text-[var(--color-ink-50)]">{right}</span>
              </p>
              <p className="mt-1.5 text-sm text-[var(--color-ink-400)]">
                Result: <span className="text-[var(--color-ink-200)]">{describe(s.resultEnchants)}</span>{" "}
                <span className="font-mono text-xs text-[var(--color-ink-600)]">
                  (prior work ×{s.resultPriorWork})
                </span>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
