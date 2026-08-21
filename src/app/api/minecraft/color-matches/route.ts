import { NextResponse } from "next/server";
import { getPlayerDatabase, hasPersistentPlayerDatabase } from "@/lib/minecraft/playerDatabase";
import { checkRateLimit, clientKeyFrom } from "@/lib/rateLimit";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const MAX_PAGE_SIZE = 100;

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: Request) {
  const { ok } = checkRateLimit(`color-matches:${clientKeyFrom(request)}`, 60);
  if (!ok) return fail("rate_limited", "Too many requests. Try again in a minute.", 429);

  const params = new URL(request.url).searchParams;
  const color = params.get("color") ?? "";
  if (!HEX_COLOR.test(color)) return fail("invalid_input", "Expected a #RRGGBB color.", 400);

  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.get("pageSize") ?? "25") || 25));

  const db = getPlayerDatabase();
  const [{ players, total }, totalIndexed] = await Promise.all([
    db.findByColor(color, page, pageSize),
    db.totalIndexed(),
  ]);

  return NextResponse.json({
    color: color.toUpperCase(),
    page,
    pageSize,
    total,
    players,
    totalIndexed,
    isPersistent: hasPersistentPlayerDatabase(),
  });
}
