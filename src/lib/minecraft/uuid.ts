/** UUID + username parsing shared by the Locator Bar Color Finder. */

const UUID_HEX = /^[0-9a-f]{32}$/i;
const UUID_HYPHENATED = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JAVA_USERNAME = /^[A-Za-z0-9_]{3,16}$/;

/** Strips hyphens and lowercases; does not validate. */
function strip(input: string): string {
  return input.trim().replace(/-/g, "").toLowerCase();
}

/** Accepts hyphenated or bare, upper or lower case, 32 hex chars either way. */
export function isValidUuid(input: string): boolean {
  const s = input.trim();
  return UUID_HYPHENATED.test(s) || UUID_HEX.test(strip(s));
}

/** Normalizes any valid UUID input to canonical lowercase-hyphenated form. */
export function normalizeUuid(input: string): string | null {
  if (!isValidUuid(input)) return null;
  const hex = strip(input);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function isValidJavaUsername(input: string): boolean {
  return JAVA_USERNAME.test(input.trim());
}

/**
 * A rough heuristic for "this looks like a Bedrock gamertag, not a Java
 * username or UUID" — gamertags allow spaces and run longer than Java's
 * 16-character cap. There's no reliable way to detect Bedrock identifiers
 * with certainty; this only exists to give a clearer error message.
 */
export function looksLikeBedrockGamertag(input: string): boolean {
  const s = input.trim();
  if (isValidUuid(s) || isValidJavaUsername(s)) return false;
  return /\s/.test(s) || s.length > 16;
}
