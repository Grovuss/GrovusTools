"use client";

import { useEffect, useRef } from "react";
import { composePatternPreview } from "@/lib/minecraft/bannerRender";

export function PatternThumbnail({
  baseColorHex,
  patternTexture,
  patternColorHex,
  scale = 4,
}: {
  baseColorHex: string;
  patternTexture: string;
  patternColorHex: string;
  scale?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) {
      composePatternPreview(ref.current, baseColorHex, patternTexture, patternColorHex, scale).catch(() => {});
    }
  }, [baseColorHex, patternTexture, patternColorHex, scale]);

  return <canvas ref={ref} className="pixelated block" />;
}
