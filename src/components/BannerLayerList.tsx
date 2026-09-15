"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, X, ChevronRight } from "lucide-react";
import { DyeColorPicker } from "./DyeColorPicker";
import { PatternPicker } from "./PatternPicker";
import { PatternThumbnail } from "./PatternThumbnail";
import { getDyeColor, getPattern, type BannerLayer } from "@/lib/minecraft/banners";

export function BannerLayerList({
  layers,
  onChange,
  baseColorHex,
}: {
  layers: BannerLayer[];
  onChange: (next: BannerLayer[]) => void;
  baseColorHex: string;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set(layers.length > 0 ? [0] : []));
  const prevLength = useRef(layers.length);

  useEffect(() => {
    if (layers.length > prevLength.current) {
      // A layer was just added — open its editor automatically.
      setExpanded((prev) => new Set(prev).add(layers.length - 1));
    }
    prevLength.current = layers.length;
  }, [layers.length]);

  function update(index: number, patch: Partial<BannerLayer>) {
    onChange(layers.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  function remove(index: number) {
    onChange(layers.filter((_, i) => i !== index));
    setExpanded((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= layers.length) return;
    const next = [...layers];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }
  function toggle(index: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
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
      {layers.map((layer, i) => {
        const pattern = getPattern(layer.patternId);
        const color = getDyeColor(layer.colorId);
        const isOpen = expanded.has(i);
        return (
          <div key={i} className="grovus-panel overflow-hidden">
            <div className="flex items-center gap-2 p-2">
              <span className="w-4 shrink-0 text-center font-mono text-[10px] text-[var(--color-ink-600)]">
                {i + 1}
              </span>
              <button
                onClick={() => toggle(i)}
                className="flex flex-1 items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-white/5"
                aria-expanded={isOpen}
              >
                <span className="shrink-0 overflow-hidden rounded border border-[var(--color-border)]">
                  <PatternThumbnail
                    baseColorHex={baseColorHex}
                    patternTexture={pattern.texture}
                    patternColorHex={color.hex}
                    scale={2}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-[var(--color-ink-50)]">{pattern.name}</span>
                  <span className="block truncate text-[11px] text-[var(--color-ink-600)]">{color.name}</span>
                </span>
                <ChevronRight
                  size={14}
                  className={`shrink-0 text-[var(--color-ink-600)] transition-transform ${isOpen ? "rotate-90" : ""}`}
                  aria-hidden="true"
                />
              </button>
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

            {isOpen ? (
              <div className="space-y-3 border-t border-[var(--color-border)] p-3">
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink-600)]">
                    Pattern
                  </p>
                  <PatternPicker
                    value={layer.patternId}
                    onChange={(patternId) => update(i, { patternId })}
                    baseColorHex={baseColorHex}
                    colorHex={color.hex}
                  />
                </div>
                <DyeColorPicker
                  label="Color"
                  value={layer.colorId}
                  onChange={(colorId) => update(i, { colorId })}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
