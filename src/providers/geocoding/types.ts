export type GeocodeResult = { latitude: number; longitude: number; label: string; provider: string };
export interface GeocodingProvider { search(query: string): Promise<GeocodeResult[]>; }
