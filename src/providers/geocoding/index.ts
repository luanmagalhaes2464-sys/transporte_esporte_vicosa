import { createHash } from "crypto";
import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";
import { GoogleGeocodingProvider } from "./google";
import { NominatimProvider } from "./nominatim";
import type { GeocodeResult, GeocodingProvider } from "./types";

function provider(): GeocodingProvider | null {
  if (env().GEOCODING_PROVIDER === "none") return null;
  if (env().GEOCODING_PROVIDER === "google") return new GoogleGeocodingProvider();
  return new NominatimProvider();
}

export async function geocode(query: string): Promise<GeocodeResult[]> {
  const current = provider();
  if (!current) return [];
  const providerName = env().GEOCODING_PROVIDER;
  const normalizedQuery = query.trim().replace(/\s+/g," ");
  const queryHash = createHash("sha256").update(`${providerName}:${normalizedQuery.toLowerCase()}`).digest("hex");
  const cached = await prisma.geocodingCache.findUnique({ where: { queryHash } });

  // Resultado positivo pode ser reutilizado. Resultado vazio não fica "preso"
  // para sempre: tentamos novamente, pois a consulta pode ter sido temporariamente
  // limitada pelo provedor ou a base externa pode ter mudado.
  if (cached?.raw && Array.isArray(cached.raw) && cached.raw.length > 0) {
    return cached.raw as unknown as GeocodeResult[];
  }

  const results = await current.search(normalizedQuery);
  const first = results[0];
  await prisma.geocodingCache.upsert({
    where: { queryHash },
    update: { query: normalizedQuery, provider: providerName, latitude: first?.latitude, longitude: first?.longitude, raw: results as unknown as object },
    create: { queryHash, query: normalizedQuery, provider: providerName, latitude: first?.latitude, longitude: first?.longitude, raw: results as unknown as object }
  });
  return results;
}
