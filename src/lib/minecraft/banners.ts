/**
 * Minecraft's 16 standard dye colors, as used for wool, leather armor, and
 * banners. Values match the game's established dye-color palette (Minecraft
 * Wiki "Dye").
 */
export interface DyeColor {
  id: string;
  name: string;
  hex: string;
}

export const DYE_COLORS: DyeColor[] = [
  { id: "white", name: "White", hex: "#F9FFFE" },
  { id: "light_gray", name: "Light Gray", hex: "#9D9D97" },
  { id: "gray", name: "Gray", hex: "#474F52" },
  { id: "black", name: "Black", hex: "#1D1D21" },
  { id: "brown", name: "Brown", hex: "#835432" },
  { id: "red", name: "Red", hex: "#B02E26" },
  { id: "orange", name: "Orange", hex: "#F9801D" },
  { id: "yellow", name: "Yellow", hex: "#FED83D" },
  { id: "lime", name: "Lime", hex: "#80C71F" },
  { id: "green", name: "Green", hex: "#5E7C16" },
  { id: "cyan", name: "Cyan", hex: "#169C9C" },
  { id: "light_blue", name: "Light Blue", hex: "#3AB3DA" },
  { id: "blue", name: "Blue", hex: "#3C44AA" },
  { id: "purple", name: "Purple", hex: "#8932B8" },
  { id: "magenta", name: "Magenta", hex: "#C74EBD" },
  { id: "pink", name: "Pink", hex: "#F38BAA" },
];

const BY_DYE_ID = new Map(DYE_COLORS.map((c) => [c.id, c]));
export function getDyeColor(id: string): DyeColor {
  return BY_DYE_ID.get(id) ?? DYE_COLORS[0]!;
}

/**
 * Every pattern texture in the supplied asset pack, excluding the two
 * structural files (`base.png`, the solid-fill mask; `banner_base.png`, the
 * item-render template — neither is a selectable pattern). Names follow the
 * game's own pattern names where confirmed (the "charge" patterns that need
 * a physical pattern item in-game, e.g. Creeper Charge/Thing/Snout), and
 * the closest standard heraldic term for the geometric loom patterns.
 */
export interface BannerPattern {
  id: string;
  name: string;
  texture: string;
  /** True for patterns that need a crafted pattern item in vanilla, not just a loom + dye. */
  requiresItem?: boolean;
}

export const BANNER_PATTERNS: BannerPattern[] = [
  { id: "stripe_bottom", name: "Base", texture: "stripe_bottom" },
  { id: "stripe_top", name: "Chief", texture: "stripe_top" },
  { id: "stripe_left", name: "Pale Dexter", texture: "stripe_left" },
  { id: "stripe_right", name: "Pale Sinister", texture: "stripe_right" },
  { id: "stripe_center", name: "Pale", texture: "stripe_center" },
  { id: "stripe_middle", name: "Fess", texture: "stripe_middle" },
  { id: "stripe_downright", name: "Bend", texture: "stripe_downright" },
  { id: "stripe_downleft", name: "Bend Sinister", texture: "stripe_downleft" },
  { id: "small_stripes", name: "Paly", texture: "small_stripes" },
  { id: "cross", name: "Saltire", texture: "cross" },
  { id: "straight_cross", name: "Cross", texture: "straight_cross" },
  { id: "diagonal_left", name: "Per Bend Sinister", texture: "diagonal_left" },
  { id: "diagonal_right", name: "Per Bend", texture: "diagonal_right" },
  { id: "diagonal_up_left", name: "Per Bend Sinister Inverted", texture: "diagonal_up_left" },
  { id: "diagonal_up_right", name: "Per Bend Inverted", texture: "diagonal_up_right" },
  { id: "half_vertical", name: "Per Pale", texture: "half_vertical" },
  { id: "half_vertical_right", name: "Per Pale Inverted", texture: "half_vertical_right" },
  { id: "half_horizontal", name: "Per Fess", texture: "half_horizontal" },
  { id: "half_horizontal_bottom", name: "Per Fess Inverted", texture: "half_horizontal_bottom" },
  { id: "square_top_left", name: "Chief Dexter Canton", texture: "square_top_left" },
  { id: "square_top_right", name: "Chief Sinister Canton", texture: "square_top_right" },
  { id: "square_bottom_left", name: "Base Dexter Canton", texture: "square_bottom_left" },
  { id: "square_bottom_right", name: "Base Sinister Canton", texture: "square_bottom_right" },
  { id: "triangle_top", name: "Chief Triangle", texture: "triangle_top" },
  { id: "triangle_bottom", name: "Base Triangle", texture: "triangle_bottom" },
  { id: "triangles_top", name: "Chief Triangles", texture: "triangles_top" },
  { id: "triangles_bottom", name: "Base Indented", texture: "triangles_bottom" },
  { id: "circle", name: "Roundel", texture: "circle" },
  { id: "rhombus", name: "Lozenge", texture: "rhombus" },
  { id: "border", name: "Border", texture: "border" },
  { id: "curly_border", name: "Bordure Indented", texture: "curly_border" },
  { id: "gradient", name: "Gradient", texture: "gradient" },
  { id: "gradient_up", name: "Base Gradient", texture: "gradient_up" },
  { id: "bricks", name: "Field Masoned", texture: "bricks" },
  { id: "flow", name: "Flow", texture: "flow" },
  { id: "guster", name: "Guster", texture: "guster" },
  { id: "globe", name: "Globe", texture: "globe" },
  { id: "flower", name: "Flower Charge", texture: "flower", requiresItem: true },
  { id: "creeper", name: "Creeper Charge", texture: "creeper", requiresItem: true },
  { id: "skull", name: "Skull Charge", texture: "skull", requiresItem: true },
  { id: "mojang", name: "Thing", texture: "mojang", requiresItem: true },
  { id: "piglin", name: "Snout", texture: "piglin", requiresItem: true },
];

const BY_PATTERN_ID = new Map(BANNER_PATTERNS.map((p) => [p.id, p]));
export function getPattern(id: string): BannerPattern {
  return BY_PATTERN_ID.get(id) ?? BANNER_PATTERNS[0]!;
}

export const BASE_MASK_TEXTURE = "base";
/** Matches vanilla: base color plus up to 6 additional pattern layers. */
export const MAX_LAYERS = 6;

export interface BannerLayer {
  patternId: string;
  colorId: string;
}

export interface BannerDesign {
  baseColorId: string;
  layers: BannerLayer[];
}

export const DEFAULT_DESIGN: BannerDesign = {
  baseColorId: "white",
  layers: [
    { patternId: "border", colorId: "black" },
    { patternId: "mojang", colorId: "red" },
  ],
};
