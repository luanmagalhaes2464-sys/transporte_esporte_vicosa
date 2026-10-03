import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geocode } from "@/providers/geocoding";
import { handleRouteError, jsonError } from "@/lib/http";
import { rateLimit } from "@/security/rate-limit";
import { env } from "@/config/env";
const q = z.object({ q: z.string().min(3).max(200) });
export async function GET(req: NextRequest) {
  try { const ip=req.headers.get("x-forwarded-for")?.split(",")[0]??"unknown"; if(!rateLimit(`geocode:${ip}`,20,60_000).ok)return jsonError("Muitas pesquisas de endereço. Aguarde um minuto.",429); const parsed=q.parse({ q: req.nextUrl.searchParams.get("q") }).q; const scoped=`${parsed}, ${env().MUNICIPALITY_NAME}, ${env().MUNICIPALITY_STATE}, Brasil`; return NextResponse.json({ results: await geocode(scoped) }); }
  catch (e) { return handleRouteError(e); }
}
