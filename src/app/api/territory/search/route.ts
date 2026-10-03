import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { searchTerritory } from "@/modules/territory/service";
import { rateLimit } from "@/security/rate-limit";
import { jsonError, handleRouteError } from "@/lib/http";
export async function GET(req: NextRequest) {
  try {
    const ip=req.headers.get("x-forwarded-for")?.split(",")[0]??"unknown"; if(!rateLimit(`territory-search:${ip}`,60,60_000).ok)return jsonError("Muitas pesquisas. Aguarde um minuto.",429);
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const municipality = await prisma.systemSetting.findUnique({ where: { key: "default_municipality_id" } });
    if (!municipality) return NextResponse.json({ results: [] });
    return NextResponse.json({ results: await searchTerritory(q, municipality.value) });
  } catch(e) { return handleRouteError(e); }
}
