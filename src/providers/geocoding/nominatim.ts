import { env } from "@/config/env";
import type { GeocodingProvider } from "./types";

export class NominatimProvider implements GeocodingProvider {
  async search(query: string) {
    const url = new URL("/search", env().NOMINATIM_BASE_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "br");
    const response = await fetch(url, { headers: { "User-Agent": "PortalVicosa/1.0 (municipal public service)" }, signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!response.ok) throw new Error("GEOCODING_PROVIDER_ERROR");
    const rows = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
    return rows.map(r => ({ latitude: Number(r.lat), longitude: Number(r.lon), label: r.display_name, provider: "nominatim" }));
  }
}
