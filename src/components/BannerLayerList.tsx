import { ChevronUp, ChevronDown, X } from "lucide-react";
import { DyeColorPicker } from "./DyeColorPicker";
import { BANNER_PATTERNS, getDyeColor, type BannerLayer } from "@/lib/minecraft/banners";

export function BannerLayerList({
  layers,
  onChange,
}: {
  layers: BannerLayer[];
  onChange: (next: BannerLayer[]) => void;
}) {
  function update(index: number, patch: Partial<BannerLayer>) {
    onChange(layers.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function remove(index: number) {
    onChange(layers.filter((_, i) => i !== index));
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= layers.length) return;
    const next = [...layers];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }

  if (layers.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-sm text-[var(--color-ink-600)]">
        No pattern layers yet — add one below.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {layers.map((layer, i) => (
        <div key={i} className="grovus-panel space-y-2 p-3">
          <div className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center font-mono text-xs text-[var(--color-ink-600)]">{i + 1}</span>
            <select
              value={layer.patternId}
              onChange={(e) => update(i, { patternId: e.target.value })}
              className="flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-2 py-1.5 text-sm text-[var(--color-ink-50)]"
            >
              {BANNER_PATTERNS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.requiresItem ? " (needs item in-game)" : ""}
                </option>
              ))}
            </select>
            <div className="flex shrink-0 flex-col">
              <button
                aria-label="Move layer up"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="grid h-4 w-6 place-items-center text-[var(--color-ink-600)] hover:text-[var(--color-ink-50)] disabled:opacity-20"
              >
                <ChevronUp size={13} aria-hidden="true" />
              </button>
              <button
                aria-label="Move layer down"
                disabled={i === layers.length - 1}
                onClick={() => move(i, 1)}
                className="grid h-4 w-6 place-items-center text-[var(--color-ink-600)] hover:text-[var(--color-ink-50)] disabled:opacity-20"
              >
                <ChevronDown size={13} aria-hidden="true" />
              </button>
            </div>
            <button
              aria-label={`Remove layer ${i + 1}`}
              onClick={() => remove(i)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[var(--color-ink-600)] hover:text-[var(--color-danger-400)]"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
          <DyeColorPicker value={layer.colorId} onChange={(colorId) => update(i, { colorId })} />
          <p className="font-mono text-[10px] text-[var(--color-ink-600)]">
            {getDyeColor(layer.colorId).name}
          </p>
        </div>
      ))}
    </div>
  );
}
