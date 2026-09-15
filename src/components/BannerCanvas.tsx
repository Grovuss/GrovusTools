"use client";

import { useEffect, useRef } from "react";
import { composeBanner, CLOTH_WIDTH, CLOTH_HEIGHT } from "@/lib/minecraft/bannerRender";
import type { BannerDesign } from "@/lib/minecraft/banners";

export function BannerCanvas({
  design,
  scale = 12,
  canvasRef,
}: {
  design: BannerDesign;
  scale?: number;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}) {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const ref = canvasRef ?? internalRef;

  useEffect(() => {
    if (ref.current) {
      composeBanner(ref.current, design, scale).catch(() => {
        /* texture failed to load — canvas just stays blank */
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, scale]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-sm shadow-lg"
        style={{
          background: "linear-gradient(180deg, #8a6a45, #6b4f30)",
          height: 10,
          width: (CLOTH_WIDTH * scale) + 14,
        }}
        aria-hidden="true"
      />
      <div className="flex" aria-hidden="true">
        <canvas ref={ref} className="pixelated block shadow-xl" />
        <div
          className="rounded-r-sm"
          style={{ background: "linear-gradient(90deg, #6b4f30, #8a6a45)", width: 10, height: CLOTH_HEIGHT * scale }}
        />
      </div>
    </div>
  );
}
