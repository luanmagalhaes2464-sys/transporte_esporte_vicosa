import { env } from "@/config/env";
import type { GeocodingProvider } from "./types";

export class GoogleGeocodingProvider implements GeocodingProvider {
  async search(query: string) {
    const key = env().GOOGLE_MAPS_API_KEY;
    if (!key) throw new Error("GOOGLE_GEOCODING_NOT_CONFIGURED");
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query);
    url.searchParams.set("region", "br");
    url.searchParams.set("key", key);
    const response = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!response.ok) throw new Error("GEOCODING_PROVIDER_ERROR");
    const data = await response.json() as {
      status: string;
      results?: Array<{ formatted_address: string; geometry: { location: { lat: number; lng: number } } }>;
    };
    if (data.status === "ZERO_RESULTS") return [];
    if (data.status !== "OK") throw new Error("GEOCODING_PROVIDER_ERROR");
    return (data.results ?? []).slice(0, 5).map(r => ({
      latitude: r.geometry.location.lat,
      longitude: r.geometry.location.lng,
      label: r.formatted_address,
      provider: "google"
    }));
  }
}
