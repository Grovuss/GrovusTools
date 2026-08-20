import { ITEMS } from "@/lib/minecraft/items";
import type { ItemCategory } from "@/lib/minecraft/types";
import { PixelIcon } from "./PixelIcon";
import { Shield } from "lucide-react";

export function ItemPicker({
  value,
  onChange,
}: {
  value: ItemCategory;
  onChange: (id: ItemCategory) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Your item">
      {ITEMS.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="radio"
            aria-checked={active}
            title={item.name}
            onClick={() => onChange(item.id)}
            className={`group flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border transition-colors ${
              active
                ? "border-[var(--color-green-500)] bg-[var(--color-green-950)]"
                : "border-[var(--color-border)] bg-[var(--color-bg-inset)] hover:border-[var(--color-border-bright)]"
            }`}
          >
            {item.texture ? (
              <PixelIcon src={item.texture} alt="" size={28} />
            ) : (
              <Shield
                size={22}
                className={active ? "text-[var(--color-green-400)]" : "text-[var(--color-ink-400)]"}
                aria-hidden="true"
              />
            )}
            <span className="sr-only">{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}
