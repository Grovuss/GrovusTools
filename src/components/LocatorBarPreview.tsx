export function LocatorBarPreview({ color }: { color: string }) {
  const ticks = Array.from({ length: 13 }, (_, i) => i);
  return (
    <div className="relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-black/70 px-5 py-4">
      <div className="flex items-center gap-3 font-mono text-xs font-bold text-[var(--color-ink-400)]">
        <span>W</span>
        <div className="relative h-9 flex-1">
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
            {ticks.map((i) => (
              <span
                key={i}
                className={`w-px bg-[var(--color-border-bright)] ${i % 6 === 0 ? "h-3" : "h-1.5"}`}
              />
            ))}
          </div>
          <div
            className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] shadow-[0_0_10px_var(--marker-glow)]"
            style={{ backgroundColor: color, ["--marker-glow" as string]: color }}
          />
        </div>
        <span>E</span>
      </div>
    </div>
  );
}
