import { env } from "@/config/env";
import type { GeocodingProvider } from "./types";

export class NominatimProvider implements GeocodingProvider {
  async search(query: string) {
    const url = new URL("/search", env().NOMINATIM_BASE_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "PortalVicosa/1.0 (https://transporte-esporte-vicosa.onrender.com)",
        "Accept-Language": "pt-BR,pt;q=0.9"
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store"
    });
    if (!response.ok) throw new Error("GEOCODING_PROVIDER_ERROR");

    const rows = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
    return rows
      .map(r => ({ latitude: Number(r.lat), longitude: Number(r.lon), label: r.display_name, provider: "nominatim" }))
      .filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
  }
}
