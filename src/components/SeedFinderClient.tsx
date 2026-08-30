"use client";

import { useEffect, useRef, useState } from "react";
import { Search, AlertTriangle, Info, Square, Copy, Check } from "lucide-react";
import { StructureObservationForm } from "@/components/StructureObservationForm";
import {
  validateObservations,
  COMMON_SEED_RANGE,
  CUSTOM_RANGE_WARNING_THRESHOLD,
} from "@/lib/minecraft/seedFinder";
import { SUPPORTED_VERSIONS } from "@/lib/minecraft/structureSeed";
import type { StructureObservation } from "@/lib/minecraft/structureSeed";
import type { WorkerOutMessage, WorkerStartMessage } from "@/workers/seedFinder.worker";

const BATCH_SIZE = 200_000n;

type RangeMode = "common" | "custom";

export default function SeedFinderClient() {
  const [version, setVersion] = useState(SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]);
  const [observations, setObservations] = useState<StructureObservation[]>([
    { structureId: "desert_pyramid", x: 224, z: 160 },
  ]);
  const [rangeMode, setRangeMode] = useState<RangeMode>("common");
  const [customStart, setCustomStart] = useState("0");
  const [customEnd, setCustomEnd] = useState("1000000000");

  const [running, setRunning] = useState(false);
  const [checked, setChecked] = useState(0n);
  const [total, setTotal] = useState(0n);
  const [matches, setMatches] = useState<bigint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedSeed, setCopiedSeed] = useState<bigint | null>(null);

  const workersRef = useRef<Worker[]>([]);
  const startTimeRef = useRef<number>(0);
  const doneCountRef = useRef(0);
  const [rate, setRate] = useState(0);

  useEffect(() => {
    return () => stopWorkers();
  }, []);

  function stopWorkers() {
    workersRef.current.forEach((w) => w.terminate());
    workersRef.current = [];
  }

  function getRange(): { start: bigint; count: bigint } | null {
    if (rangeMode === "common") return COMMON_SEED_RANGE;
    try {
      const start = BigInt(customStart.trim());
      const end = BigInt(customEnd.trim());
      if (end <= start) {
        setError("Range end must be greater than start.");
        return null;
      }
      return { start, count: end - start };
    } catch {
      setError("Custom range must be whole numbers.");
      return null;
    }
  }

  function start() {
    setError(null);
    const validationError = validateObservations(observations);
    if (validationError) {
      setError(validationError);
      return;
    }
    const range = getRange();
    if (!range) return;
    if (rangeMode === "custom" && range.count > CUSTOM_RANGE_WARNING_THRESHOLD) {
      setError(
        `That range has ${range.count.toLocaleString()} candidates — too large to finish in a browser tab. Try a smaller range, or use "Common seeds" (numbers and hashed text, ~4.3 billion) as the practical default.`
      );
      return;
    }

    stopWorkers();
    setMatches([]);
    setChecked(0n);
    setTotal(range.count);
    setRunning(true);
    startTimeRef.current = performance.now();
    doneCountRef.current = 0;

    const numWorkers = Math.min(navigator.hardwareConcurrency || 4, 8);
    const perWorker = range.count / BigInt(numWorkers);
    const progressByWorker = new Array(numWorkers).fill(0n) as bigint[];

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(new URL("../workers/seedFinder.worker.ts", import.meta.url));
      const workerStart = range.start + perWorker * BigInt(i);
      const workerCount = i === numWorkers - 1 ? range.count - perWorker * BigInt(i) : perWorker;

      worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
        const msg = event.data;
        if (msg.type === "progress") {
          progressByWorker[i] = msg.checked;
          const sum = progressByWorker.reduce((a, b) => a + b, 0n);
          setChecked(sum);
          const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
          if (elapsedSec > 0) setRate(Number(sum) / elapsedSec);
          if (msg.matches.length > 0) {
            setMatches((prev) => [...prev, ...msg.matches]);
          }
        } else if (msg.type === "done") {
          progressByWorker[i] = msg.checked;
          doneCountRef.current += 1;
          if (doneCountRef.current >= numWorkers) {
            setRunning(false);
          }
        }
      };

      const startMsg: WorkerStartMessage = {
        type: "start",
        observations,
        rangeStart: workerStart,
        rangeCount: workerCount,
        batchSize: BATCH_SIZE,
      };
      worker.postMessage(startMsg);
      workersRef.current.push(worker);
    }
  }

  function stop() {
    workersRef.current.forEach((w) => w.postMessage({ type: "cancel" }));
    stopWorkers();
    setRunning(false);
  }

  function copySeed(seed: bigint) {
    navigator.clipboard.writeText(seed.toString()).then(() => {
      setCopiedSeed(seed);
      setTimeout(() => setCopiedSeed(null), 1500);
    });
  }

  const pct = total > 0n ? Number((checked * 10000n) / total) / 100 : 0;
  const etaSeconds = rate > 0 ? Number(total - checked) / rate : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-mono text-2xl font-bold text-[var(--color-ink-50)]">World Seed Finder</h1>
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-raised)] px-3 py-1 font-mono text-xs text-[var(--color-green-400)]">
          Version
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="bg-transparent font-mono text-xs text-[var(--color-ink-50)]"
          >
            {SUPPORTED_VERSIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mb-6 text-sm text-[var(--color-ink-400)]">
        Enter structures you&apos;ve found in your world. Grovus works backward through Java Edition&apos;s real
        structure-placement math to find which seeds could have produced them — then verifies every candidate
        against everything you entered before showing it to you.
      </p>

      <section className="grovus-panel p-4">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-green-400)]">
          Known Structures
        </h2>
        <StructureObservationForm observations={observations} onChange={setObservations} />
      </section>

      <section className="mt-4 grovus-panel p-4">
        <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-green-400)]">
          Search Range
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRangeMode("common")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              rangeMode === "common"
                ? "bg-[var(--color-green-950)] text-[var(--color-green-400)]"
                : "border border-[var(--color-border)] text-[var(--color-ink-400)]"
            }`}
          >
            Common seeds (~4.3B)
          </button>
          <button
            onClick={() => setRangeMode("custom")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              rangeMode === "custom"
                ? "bg-[var(--color-green-950)] text-[var(--color-green-400)]"
                : "border border-[var(--color-border)] text-[var(--color-ink-400)]"
            }`}
          >
            Custom range
          </button>
        </div>
        {rangeMode === "custom" ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink-50)]"
              placeholder="start"
            />
            <span className="text-[var(--color-ink-600)]">to</span>
            <input
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-inset)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink-50)]"
              placeholder="end"
            />
          </div>
        ) : (
          <p className="mt-2 text-xs text-[var(--color-ink-600)]">
            Every seed a typed number or piece of text can produce (-2³¹ to 2³¹−1). Covers the vast majority of
            real, human-chosen seeds — not the full 64-bit space. See &quot;How this works&quot; below.
          </p>
        )}
      </section>

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-[var(--color-danger-500)]/40 bg-[var(--color-danger-500)]/10 px-3 py-2.5 text-sm text-[var(--color-danger-400)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-5 flex gap-2">
        {!running ? (
          <button
            onClick={start}
            className="flex items-center gap-2 rounded-md border border-green-500 bg-[var(--color-green-950)] px-5 py-2.5 text-sm font-semibold text-[var(--color-green-400)] transition-colors hover:bg-[var(--color-green-950)]/70"
          >
            <Search size={15} aria-hidden="true" /> Start Search
          </button>
        ) : (
          <button
            onClick={stop}
            className="flex items-center gap-2 rounded-md border border-[var(--color-danger-500)] bg-[var(--color-danger-500)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--color-danger-400)]"
          >
            <Square size={14} aria-hidden="true" /> Stop
          </button>
        )}
      </div>

      {running || checked > 0n ? (
        <div className="mt-5 grovus-panel p-4">
          <div className="mb-2 flex items-center justify-between font-mono text-xs text-[var(--color-ink-400)]">
            <span>
              {checked.toLocaleString()} / {total.toLocaleString()} checked ({pct.toFixed(2)}%)
            </span>
            <span>
              {rate > 0 ? `${(rate / 1_000_000).toFixed(1)}M/s` : ""}
              {etaSeconds !== null && running ? ` · ETA ${Math.ceil(etaSeconds)}s` : ""}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-inset)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-green-500)] to-[var(--color-purple-500)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-3 font-mono text-sm font-bold uppercase tracking-wider text-[var(--color-ink-400)]">
          {matches.length > 0 ? `${matches.length} matching seed${matches.length === 1 ? "" : "s"}` : "Results"}
        </h2>
        {matches.length === 0 ? (
          <div className="grovus-panel p-6 text-center text-sm text-[var(--color-ink-600)]">
            {running ? "Searching…" : "No matches yet — start a search."}
          </div>
        ) : (
          <div className="grovus-panel divide-y divide-[var(--color-border)]">
            {matches.map((seed) => (
              <div key={seed.toString()} className="flex items-center justify-between px-4 py-3">
                <span className="font-mono text-sm text-[var(--color-ink-50)]">{seed.toString()}</span>
                <button
                  onClick={() => copySeed(seed)}
                  className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-ink-400)] hover:border-[var(--color-border-bright)] hover:text-[var(--color-ink-50)]"
                >
                  {copiedSeed === seed ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                  {copiedSeed === seed ? "Copied" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grovus-panel flex items-start gap-2.5 p-4 text-sm text-[var(--color-ink-400)]">
        <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-purple-400)]" aria-hidden="true" />
        <div className="space-y-2">
          <p>
            <strong className="text-[var(--color-ink-200)]">How this works:</strong> every match above was verified
            by re-simulating Java Edition&apos;s actual structure-placement random-number sequence for that seed and
            confirming it lands on the exact chunk you reported for every structure you entered — never a guess.
          </p>
          <p>
            Structure placement only depends on a seed&apos;s lower 48 bits, so a fully exhaustive search would mean
            checking up to ~281 trillion candidates — many hours even in a fast browser. Grovus instead searches the
            ~4.3 billion seeds that correspond to how Minecraft actually creates a seed from typed text or a plain
            number, which covers the vast majority of real seeds people share. A biome check to pin down the exact
            64-bit seed beyond that isn&apos;t implemented — see the README for the full scope and reasoning.
          </p>
          <p>
            Supported structures use Java Edition&apos;s uniform region-placement algorithm (Desert Pyramid, Igloo,
            Jungle Temple, Swamp Hut). Structures using triangular placement (Ocean Monument, Woodland Mansion) or
            ones we couldn&apos;t confirm current constants for aren&apos;t supported yet.
          </p>
        </div>
      </div>
    </div>
  );
}
