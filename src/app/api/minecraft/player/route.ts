import { NextResponse } from "next/server";
import { isValidUuid, normalizeUuid, isValidJavaUsername, looksLikeBedrockGamertag } from "@/lib/minecraft/uuid";
import { computeLocatorColor } from "@/lib/minecraft/locator-color";
import { resolveUsername } from "@/lib/minecraft/mojang";
import { getPlayerDatabase } from "@/lib/minecraft/playerDatabase";
import { checkRateLimit, clientKeyFrom } from "@/lib/rateLimit";

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: Request) {
  const { ok } = checkRateLimit(`player:${clientKeyFrom(request)}`, 30);
  if (!ok) return fail("rate_limited", "Too many requests. Try again in a minute.", 429);

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!query) return fail("invalid_input", "Enter a username or UUID.", 400);

  if (looksLikeBedrockGamertag(query)) {
    return fail(
      "bedrock_unsupported",
      'Bedrock Locator Bar colors are not derived from a stable Java UUID, so this calculator cannot predict a permanent Bedrock marker color. This tool is Java Edition only.',
      400
    );
  }

  let uuid: string;
  let username: string | null = null;
  let source: "uuid" | "mojang";

  if (isValidUuid(query)) {
    uuid = normalizeUuid(query)!;
    source = "uuid";
  } else if (isValidJavaUsername(query)) {
    let lookup;
    try {
      lookup = await resolveUsername(query);
    } catch {
      return fail("upstream_error", "Couldn't reach Mojang's profile service. Try again shortly.", 502);
    }
    if (!lookup.found || !lookup.uuid) {
      return fail(
        "not_found",
        "No Java Edition profile found for that username. Offline-mode/cracked-server accounts aren't in Mojang's records — search by UUID instead if you have it.",
        404
      );
    }
    uuid = normalizeUuid(lookup.uuid)!;
    username = lookup.username ?? query;
    source = "mojang";
  } else {
    return fail("invalid_input", "That doesn't look like a valid Java username or UUID.", 400);
  }

  const color = computeLocatorColor(uuid);
  if (!color) return fail("invalid_input", "Couldn't parse that UUID.", 400);

  // UUID-only lookups have no confirmed username — index them under the
  // UUID itself rather than guessing, so the color-match list never shows a
  // fabricated name.
  const indexedUsername = username ?? uuid;
  try {
    await getPlayerDatabase().upsertPlayer({ uuid, username: indexedUsername, color: color.hex });
  } catch {
    // Indexing failure shouldn't block showing the person their own color.
  }

  return NextResponse.json({
    uuid,
    username,
    color,
    source,
  });
}
