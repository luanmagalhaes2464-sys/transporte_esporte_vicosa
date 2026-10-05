import { env } from "@/config/env";
import { geocode } from "@/providers/geocoding";

export type AddressForGeocoding = {
  addressType: string;
  cep?: string | null;
  number?: string | null;
  streetText?: string | null;
  street?: { name: string } | null;
  neighborhood?: { name: string } | null;
  ruralLocality?: { name: string } | null;
  ruralRoad?: string | null;
  km?: string | null;
};

export function readableAddress(a: AddressForGeocoding) {
  if (a.addressType === "RURAL") {
    return [a.ruralLocality?.name, a.ruralRoad, a.km].filter(Boolean).join(", ");
  }
  return [a.street?.name || a.streetText, a.number, a.neighborhood?.name].filter(Boolean).join(", ");
}

export async function geocodeMunicipalAddress(a: AddressForGeocoding) {
  const city = env().MUNICIPALITY_NAME;
  const state = env().MUNICIPALITY_STATE;
  const street = a.street?.name || a.streetText || "";
  const neighborhood = a.neighborhood?.name || "";
  const number = a.number || "";
  const cep = a.cep || "";

  const candidates = a.addressType === "RURAL"
    ? [
        [a.ruralLocality?.name, a.ruralRoad, a.km, city, state, "Brasil"],
        [a.ruralLocality?.name, city, state, "Brasil"]
      ]
    : [
        [street, number, neighborhood, city, state, "Brasil"],
        [street, number, city, state, "Brasil"],
        [street, neighborhood, city, state, "Brasil"],
        [street, city, state, "Brasil"],
        [cep, city, state, "Brasil"]
      ];

  const seen = new Set<string>();
  for (const parts of candidates) {
    const query = parts.filter(Boolean).join(", ").replace(/\s+/g," ").trim();
    if (!query || seen.has(query)) continue;
    seen.add(query);
    try {
      const result = await geocode(query);
      if (result[0]) return { ...result[0], query };
    } catch {
      // tenta a próxima forma menos restritiva
    }
  }
  return null;
}
