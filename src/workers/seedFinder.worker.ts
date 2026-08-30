import { searchBatch } from "@/lib/minecraft/seedFinder";
import type { StructureObservation } from "@/lib/minecraft/structureSeed";

/**
 * Runs one worker's slice of the search space. The UI spawns one of these
 * per CPU core (capped) and gives each a contiguous sub-range, so the
 * search is parallel and the main thread never blocks — see
 * `SeedFinderClient.tsx` for the orchestration.
 */

export interface WorkerStartMessage {
  type: "start";
  observations: StructureObservation[];
  rangeStart: bigint;
  rangeCount: bigint;
  batchSize: bigint;
}

export type WorkerInMessage = WorkerStartMessage | { type: "cancel" };

export type WorkerOutMessage =
  | { type: "progress"; checked: bigint; matches: bigint[] }
  | { type: "done"; checked: bigint };

let cancelled = false;

self.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const msg = event.data;
  if (msg.type === "cancel") {
    cancelled = true;
    return;
  }

  cancelled = false;
  const { observations, rangeStart, rangeCount, batchSize } = msg;
  let checked = 0n;

  while (checked < rangeCount) {
    if (cancelled) return;
    const thisBatch = batchSize < rangeCount - checked ? batchSize : rangeCount - checked;
    const matches = searchBatch(observations, rangeStart + checked, thisBatch);
    checked += thisBatch;
    const out: WorkerOutMessage = { type: "progress", checked, matches };
    (self as unknown as Worker).postMessage(out);
  }

  const done: WorkerOutMessage = { type: "done", checked };
  (self as unknown as Worker).postMessage(done);
};
