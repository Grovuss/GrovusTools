import { Plus, X } from "lucide-react";
import { PixelIcon } from "./PixelIcon";
import { STRUCTURE_CONFIGS } from "@/lib/minecraft/structureSeed";
import type { StructureObservation } from "@/lib/minecraft/structureSeed";

export function StructureObservationForm({
  observations,
  onChange,
}: {
  observations: StructureObservation[];
  onChange: (next: StructureObservation[]) => void;
}) {
  function update(index: number, patch: Partial<StructureObservation>) {
    onChange(observations.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function remove(index: number) {
    onChange(observations.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...observations, { structureId: STRUCTURE_CONFIGS[0]!.id, x: 0, z: 0 }]);
  }

  return (
    <div className="space-y-3">
      {observations.map((obs, i) => {
        const config = STRUCTURE_CONFIGS.find((s) => s.id === obs.structureId);
        return (
          <div key={i} className="grovus-panel flex items-end gap-2 p-3">
            <PixelIcon src={config?.texture ?? null} alt="" size={28} className="mb-2 shrink-0 rounded" />
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-600)]">
                Structure #{i + 1}
              </label>
              <select
                value={obs.structureId}
                onChange={(e) => update(i, { structureId: e.target.value })}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-2 py-1.5 text-sm text-[var(--color-ink-50)]"
              >
                {STRUCTURE_CONFIGS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-600)]">X</label>
              <input
                type="number"
                value={obs.x}
                onChange={(e) => update(i, { x: Number(e.target.value) })}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink-50)]"
              />
            </div>
            <div className="w-20">
              <label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-600)]">Z</label>
              <input
                type="number"
                value={obs.z}
                onChange={(e) => update(i, { z: Number(e.target.value) })}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink-50)]"
              />
            </div>
            <button
              aria-label={`Remove structure ${i + 1}`}
              onClick={() => remove(i)}
              className="mb-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-md text-[var(--color-ink-600)] hover:text-[var(--color-danger-400)]"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--color-border-bright)] py-2.5 text-sm font-medium text-[var(--color-ink-400)] transition-colors hover:border-[var(--color-green-500)] hover:text-[var(--color-green-400)]"
      >
        <Plus size={15} aria-hidden="true" /> Add Structure
      </button>
    </div>
  );
}
