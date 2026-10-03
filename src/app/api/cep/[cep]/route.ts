import { NextResponse } from "next/server";
import { lookupCep } from "@/providers/cep";
import { env } from "@/config/env";
import { handleRouteError, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/normalize";
import { rateLimit } from "@/security/rate-limit";

export async function GET(req: Request, context: { params: Promise<{ cep: string }> }) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (!rateLimit(`cep:${ip}`, 30, 60_000).ok) return jsonError("Muitas consultas. Aguarde um minuto.", 429);
    const { cep } = await context.params;
    const result = await lookupCep(cep);
    if (normalizeText(result.city) !== normalizeText(env().MUNICIPALITY_NAME) || result.state.toUpperCase() !== env().MUNICIPALITY_STATE.toUpperCase()) {
      return jsonError(`O CEP informado não pertence ao município de ${env().MUNICIPALITY_NAME}.`, 422, "OUTSIDE_MUNICIPALITY");
    }
    const municipality = await prisma.municipality.findFirst({ where: { name: env().MUNICIPALITY_NAME, state: env().MUNICIPALITY_STATE } });
    const neighborhood = municipality && result.neighborhood ? await prisma.neighborhood.findFirst({ where: { municipalityId: municipality.id, normalizedName: normalizeText(result.neighborhood), active: true } }) : null;
    const street = municipality && result.street ? await prisma.street.findFirst({ where: { municipalityId: municipality.id, normalizedName: normalizeText(result.street), active: true } }) : null;
    return NextResponse.json({ ...result, matches: { neighborhood: neighborhood ? { id: neighborhood.id, name: neighborhood.name } : null, street: street ? { id: street.id, name: street.name } : null } });
  } catch (e) {
    if (e instanceof Error && ["CEP_PROVIDER_ERROR", "CORREIOS_PROVIDER_NOT_CONFIGURED"].includes(e.message)) return NextResponse.json({ error: "Não foi possível consultar o CEP neste momento. Você pode continuar preenchendo o endereço.", code: "CEP_TEMPORARILY_UNAVAILABLE" }, { status: 503 });
    return handleRouteError(e);
  }
}
