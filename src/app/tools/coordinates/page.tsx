"use client";

import { useState } from "react";
import { ArrowLeftRight, Copy, Check, ClipboardPaste } from "lucide-react";
import {
  overworldToNether,
  netherToOverworld,
  parseF3String,
  formatCoord,
} from "@/lib/minecraft/coordinates";

type Axis = "x" | "y" | "z";
type Fields = Record<Axis, string>;

const EMPTY: Fields = { x: "", y: "", z: "" };

function toNumbers(f: Fields): { x: number; y: number; z: number } | null {
  const x = Number(f.x);
  const y = Number(f.y);
  const z = Number(f.z);
  if (f.x === "" || f.y === "" || f.z === "" || [x, y, z].some(Number.isNaN)) return null;
  return { x, y, z };
}

export default function CoordinatesPage() {
  const [overworld, setOverworld] = useState<Fields>({ x: "800", y: "64", z: "-1600" });
  const [nether, setNether] = useState<Fields>({ x: "100", y: "64", z: "-200" });
  const [pasteValue, setPasteValue] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"overworld" | "nether" | null>(null);

  function updateOverworld(axis: Axis, value: string) {
    const next = { ...overworld, [axis]: value };
    setOverworld(next);
    const nums = toNumbers(next);
    if (nums) {
      const converted = overworldToNether(nums);
      setNether({
        x: formatCoord(converted.x),
        y: formatCoord(converted.y),
        z: formatCoord(converted.z),
      });
    }
  }

  function updateNether(axis: Axis, value: string) {
    const next = { ...nether, [axis]: value };
    setNether(next);
    const nums = toNumbers(next);
    if (nums) {
      const converted = netherToOverworld(nums);
      setOverworld({
        x: formatCoord(converted.x),
        y: formatCoord(converted.y),
        z: formatCoord(converted.z),
      });
    }
  }

  function handlePaste() {
    const parsed = parseF3String(pasteValue);
    if (!parsed) {
      setPasteError("Couldn't find X, Y, Z in that text. Try \"123, 64, -456\" or an F3 XYZ line.");
      return;
    }
    setPasteError(null);
    const fields = { x: formatCoord(parsed.x), y: formatCoord(parsed.y), z: formatCoord(parsed.z) };
    setOverworld(fields);
    setNether({
      x: formatCoord(parsed.x / 8),
      y: formatCoord(parsed.y),
      z: formatCoord(parsed.z / 8),
    });
    setPasteValue("");
  }

  function swap() {
    setOverworld(nether);
    const nums = toNumbers(nether);
    if (nums) {
      const converted = netherToOverworld(nums);
      setNether({ x: formatCoord(converted.x), y: formatCoord(converted.y), z: formatCoord(converted.z) });
    }
  }

  function copy(which: "overworld" | "nether") {
    const f = which === "overworld" ? overworld : nether;
    navigator.clipboard.writeText(`${f.x}, ${f.y}, ${f.z}`).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-mono text-2xl font-bold text-[var(--color-ink-50)]">Coordinate Calculator</h1>
      <p className="mt-2 max-w-xl text-[var(--color-ink-400)]">
        1 block traveled in the Nether corresponds to 8 blocks in the
        Overworld. X and Z are divided or multiplied by 8 — Y stays
        unchanged.
      </p>

      <div className="mt-6 grovus-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label htmlFor="paste-coords" className="flex items-center gap-2 whitespace-nowrap font-mono text-xs uppercase tracking-wider text-[var(--color-ink-400)]">
          <ClipboardPaste size={14} aria-hidden="true" />
          Paste coordinates
        </label>
        <input
          id="paste-coords"
          type="text"
          value={pasteValue}
          onChange={(e) => setPasteValue(e.target.value)}
          placeholder='"123, 64, -456" or an F3 "XYZ:" line'
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-3 py-2 font-mono text-sm text-[var(--color-ink-50)] placeholder:text-[var(--color-ink-600)] focus-visible:border-[var(--color-green-500)]"
        />
        <button
          onClick={handlePaste}
          className="whitespace-nowrap rounded-md border border-[var(--color-border-bright)] bg-[var(--color-green-950)] px-4 py-2 text-sm font-medium text-[var(--color-green-400)] transition-colors hover:bg-[var(--color-green-950)]/70"
        >
          Fill Overworld
        </button>
      </div>
      {pasteError ? <p className="mt-2 text-sm text-[var(--color-danger-400)]">{pasteError}</p> : null}

      <div className="mt-6 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <CoordPanel
          title="Overworld"
          accent="green"
          values={overworld}
          onChange={updateOverworld}
          onCopy={() => copy("overworld")}
          copied={copied === "overworld"}
        />

        <div className="flex items-center justify-center md:flex-col">
          <button
            onClick={swap}
            aria-label="Swap Overworld and Nether values"
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-raised)] text-[var(--color-purple-400)] transition-transform hover:scale-105"
          >
            <ArrowLeftRight size={18} aria-hidden="true" />
          </button>
          <span className="mt-2 hidden font-mono text-xs text-[var(--color-ink-600)] md:block">×8 / ÷8</span>
        </div>

        <CoordPanel
          title="Nether"
          accent="purple"
          values={nether}
          onChange={updateNether}
          onCopy={() => copy("nether")}
          copied={copied === "nether"}
        />
      </div>
    </div>
  );
}

function CoordPanel({
  title,
  accent,
  values,
  onChange,
  onCopy,
  copied,
}: {
  title: string;
  accent: "green" | "purple";
  values: Fields;
  onChange: (axis: Axis, value: string) => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const color = accent === "green" ? "var(--color-green-400)" : "var(--color-purple-400)";
  return (
    <div className="grovus-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider" style={{ color }}>
          {title}
        </h2>
        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-ink-400)] transition-colors hover:border-[var(--color-border-bright)] hover:text-[var(--color-ink-50)]"
        >
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(["x", "y", "z"] as Axis[]).map((axis) => (
          <div key={axis}>
            <label htmlFor={`${title}-${axis}`} className="mb-1 block font-mono text-xs text-[var(--color-ink-600)]">
              {axis.toUpperCase()}
            </label>
            <input
              id={`${title}-${axis}`}
              type="text"
              inputMode="decimal"
              value={values[axis]}
              onChange={(e) => onChange(axis, e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-2.5 py-2 text-center font-mono text-sm text-[var(--color-ink-50)] focus-visible:border-[var(--color-green-500)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
