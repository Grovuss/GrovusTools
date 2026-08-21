"use client";

import { useState } from "react";

/**
 * Minecraft head render via Crafatar (crafatar.com), a long-running public
 * skin-rendering service keyed by UUID. Optional per the spec — if it fails
 * to load we just fall back to the color swatch, never blocking the rest of
 * the row.
 */
export function PlayerHead({ uuid, size = 24 }: { uuid: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- external pixel-art avatar, skip Next's optimizer
    <img
      src={`https://crafatar.com/avatars/${uuid.replace(/-/g, "")}?size=${size}&overlay`}
      alt=""
      width={size}
      height={size}
      className="pixelated rounded-sm"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
