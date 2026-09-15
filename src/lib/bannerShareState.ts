import { DYE_COLORS, BANNER_PATTERNS, type BannerDesign, MAX_LAYERS } from "./minecraft/banners";

const DYE_IDS = new Set(DYE_COLORS.map((c) => c.id));
const PATTERN_IDS = new Set(BANNER_PATTERNS.map((p) => p.id));

export function encodeBannerToParams(design: BannerDesign): URLSearchParams {
  const params = new URLSearchParams();
  params.set("base", design.baseColorId);
  if (design.layers.length > 0) {
    params.set("layers", design.layers.map((l) => `${l.patternId}:${l.colorId}`).join(","));
  }
  return params;
}

export function decodeBannerFromParams(params: URLSearchParams): BannerDesign | null {
  const base = params.get("base");
  const layersRaw = params.get("layers");
  if (!base || !DYE_IDS.has(base)) return null;
  const layers = (layersRaw ?? "")
    .split(",")
    .filter(Boolean)
    .map((pair) => {
      const [patternId, colorId] = pair.split(":");
      if (!patternId || !colorId || !PATTERN_IDS.has(patternId) || !DYE_IDS.has(colorId)) return null;
      return { patternId, colorId };
    })
    .filter((x): x is { patternId: string; colorId: string } => x !== null)
    .slice(0, MAX_LAYERS);
  return { baseColorId: base, layers };
}
