"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Shuffle, RotateCcw, Link as LinkIcon, Check, Plus } from "lucide-react";
import { BannerCanvas } from "@/components/BannerCanvas";
import { DyeColorPicker } from "@/components/DyeColorPicker";
import { BannerLayerList } from "@/components/BannerLayerList";
import { composeBanner, downloadCanvasAsPng } from "@/lib/minecraft/bannerRender";
import { DYE_COLORS, BANNER_PATTERNS, MAX_LAYERS, DEFAULT_DESIGN } from "@/lib/minecraft/banners";
import { encodeBannerToParams, decodeBannerFromParams } from "@/lib/bannerShareState";
import type { BannerDesign } from "@/lib/minecraft/banners";

function randomDesign(): BannerDesign {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;
  const layerCount = 1 + Math.floor(Math.random() * 4);
  return {
    baseColorId: pick(DYE_COLORS).id,
    layers: Array.from({ length: layerCount }, () => ({
      patternId: pick(BANNER_PATTERNS).id,
      colorId: pick(DYE_COLORS).id,
    })),
  };
}

function BannerMaker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = useMemo(() => decodeBannerFromParams(searchParams) ?? DEFAULT_DESIGN, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [design, setDesign] = useState<BannerDesign>(initial);
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const params = encodeBannerToParams(design);
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design]);

  function addLayer() {
    if (design.layers.length >= MAX_LAYERS) return;
    setDesign((d) => ({ ...d, layers: [...d.layers, { patternId: "border", colorId: "black" }] }));
  }

  async function download() {
    const temp = document.createElement("canvas");
    await composeBanner(temp, design, 20);
    downloadCanvasAsPng(temp, `grovus-banner-${design.baseColorId}.png`);
  }

  function copyShareLink() {
    const params = encodeBannerToParams(design);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-2xl font-bold text-[var(--color-ink-50)]">Banner Maker</h1>
        <button
          onClick={copyShareLink}
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-200)] transition-colors hover:text-[var(--color-ink-50)]"
        >
          {copiedLink ? <Check size={13} aria-hidden="true" /> : <LinkIcon size={13} aria-hidden="true" />}
          {copiedLink ? "Link copied" : "Copy Share Link"}
        </button>
      </div>
      <p className="mb-6 text-sm text-[var(--color-ink-400)]">
        Design a Minecraft banner with real loom patterns, then download it as a PNG or copy the loom recipe to
        build it in-game.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col items-center justify-center gap-4 grovus-panel p-8">
          <BannerCanvas design={design} canvasRef={canvasRef} />
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={download}
              className="flex items-center gap-2 rounded-md border border-green-500 bg-[var(--color-green-950)] px-4 py-2 text-sm font-semibold text-[var(--color-green-400)] transition-colors hover:bg-[var(--color-green-950)]/70"
            >
              <Download size={15} aria-hidden="true" /> Download PNG
            </button>
            <button
              onClick={() => setDesign(randomDesign())}
              className="flex items-center gap-2 rounded-md border border-[var(--color-purple-500)] bg-[var(--color-purple-950)] px-4 py-2 text-sm font-semibold text-[var(--color-purple-300)] transition-colors hover:bg-[var(--color-purple-950)]/70"
            >
              <Shuffle size={15} aria-hidden="true" /> Randomize
            </button>
            <button
              onClick={() => setDesign(DEFAULT_DESIGN)}
              className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink-400)] transition-colors hover:border-[var(--color-border-bright)] hover:text-[var(--color-ink-50)]"
            >
              <RotateCcw size={15} aria-hidden="true" /> Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <section className="grovus-panel p-4">
            <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-green-400)]">
              1 · Base Color
            </h2>
            <DyeColorPicker value={design.baseColorId} onChange={(baseColorId) => setDesign((d) => ({ ...d, baseColorId }))} />
          </section>

          <section className="grovus-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-green-400)]">
                2 · Pattern Layers
              </h2>
              <span className="font-mono text-xs text-[var(--color-ink-600)]">
                {design.layers.length} / {MAX_LAYERS}
              </span>
            </div>
            <BannerLayerList layers={design.layers} onChange={(layers) => setDesign((d) => ({ ...d, layers }))} />
            <button
              onClick={addLayer}
              disabled={design.layers.length >= MAX_LAYERS}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--color-border-bright)] py-2.5 text-sm font-medium text-[var(--color-ink-400)] transition-colors hover:border-[var(--color-green-500)] hover:text-[var(--color-green-400)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={15} aria-hidden="true" /> Add Layer
            </button>
            <p className="mt-2 text-xs text-[var(--color-ink-600)]">
              Vanilla Minecraft caps banners at {MAX_LAYERS} pattern layers on top of the base color. Patterns marked
              &quot;needs item&quot; require a crafted pattern item in the loom&apos;s third slot, not just dye.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function BannerMakerClient() {
  return (
    <Suspense fallback={null}>
      <BannerMaker />
    </Suspense>
  );
}
