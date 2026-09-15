import { DYE_COLORS } from "@/lib/minecraft/banners";

export function DyeColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  return (
    <div>
      {label ? (
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-600)]">{label}</p>
      ) : null}
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label ?? "Dye color"}>
        {DYE_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={value === c.id}
            title={c.name}
            onClick={() => onChange(c.id)}
            style={{ backgroundColor: c.hex }}
            className={`h-7 w-7 rounded-md border-2 transition-transform hover:scale-110 ${
              value === c.id
                ? "border-[var(--color-green-400)] scale-110"
                : "border-black/30"
            }`}
          >
            <span className="sr-only">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
