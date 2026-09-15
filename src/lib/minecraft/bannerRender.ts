import { getDyeColor, getPattern, BASE_MASK_TEXTURE, type BannerDesign } from "./banners";

/**
 * The pattern textures are a 64x64 atlas containing the banner's front and
 * back faces side by side (the back is a mirror of the front — confirmed by
 * cropping both halves and comparing), followed by the wooden pole/crossbar
 * used for the in-game item render. Only the front face is used here; the
 * pole/crossbar is drawn separately in `BannerCanvas`.
 */
export const CLOTH_WIDTH = 21;
export const CLOTH_HEIGHT = 41;

/**
 * Recolors a mask's opaque pixels in place: RGB becomes the target dye
 * color scaled by the mask's own luminance (Minecraft's pattern textures
 * bake in subtle fabric shading, which this preserves), alpha is left
 * untouched so soft/anti-aliased edges stay soft. Pure pixel math, no DOM
 * dependency, so it's directly unit-testable.
 */
export function tintMaskPixels(data: Uint8ClampedArray, r: number, g: number, b: number): void {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (!a) continue;
    // Luminance of the (near-white/gray) source pixel, used as a shading multiplier.
    const lum = (data[i]! + data[i + 1]! + data[i + 2]!) / (3 * 255);
    data[i] = Math.round(r * lum);
    data[i + 1] = Math.round(g * lum);
    data[i + 2] = Math.round(b * lum);
  }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  let cached = imageCache.get(src);
  if (!cached) {
    cached = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    imageCache.set(src, cached);
  }
  return cached;
}

function textureUrl(name: string): string {
  return `/textures/banner/${name}.png`;
}

/** Renders a tinted mask layer onto a same-sized scratch canvas and returns it. */
async function renderLayer(textureName: string, hex: string): Promise<HTMLCanvasElement> {
  const img = await loadImage(textureUrl(textureName));
  const scratch = document.createElement("canvas");
  scratch.width = CLOTH_WIDTH;
  scratch.height = CLOTH_HEIGHT;
  const ctx = scratch.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, CLOTH_WIDTH, CLOTH_HEIGHT, 0, 0, CLOTH_WIDTH, CLOTH_HEIGHT);
  const imageData = ctx.getImageData(0, 0, CLOTH_WIDTH, CLOTH_HEIGHT);
  const { r, g, b } = hexToRgb(hex);
  tintMaskPixels(imageData.data, r, g, b);
  ctx.putImageData(imageData, 0, 0);
  return scratch;
}

/**
 * Composites a full banner design (base color + ordered pattern layers)
 * onto `canvas` at `scale`x the native 42x41 cloth resolution, pixelated.
 */
export async function composeBanner(
  canvas: HTMLCanvasElement,
  design: BannerDesign,
  scale = 8
): Promise<void> {
  canvas.width = CLOTH_WIDTH * scale;
  canvas.height = CLOTH_HEIGHT * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const baseLayer = await renderLayer(BASE_MASK_TEXTURE, getDyeColor(design.baseColorId).hex);
  ctx.drawImage(baseLayer, 0, 0, canvas.width, canvas.height);

  for (const layer of design.layers) {
    const pattern = getPattern(layer.patternId);
    const rendered = await renderLayer(pattern.texture, getDyeColor(layer.colorId).hex);
    ctx.drawImage(rendered, 0, 0, canvas.width, canvas.height);
  }
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
