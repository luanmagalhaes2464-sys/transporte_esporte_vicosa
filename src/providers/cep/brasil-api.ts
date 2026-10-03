import { digitsOnly } from "@/lib/normalize";
import type { AddressResult, CepProvider } from "./types";

export class BrasilApiProvider implements CepProvider {
  async lookup(input: string): Promise<AddressResult> {
    const cep = digitsOnly(input);
    if (cep.length !== 8) throw new Error("INVALID_CEP");
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 404 ? "CEP_NOT_FOUND" : "CEP_PROVIDER_ERROR");
    const data = await response.json();
    return { cep, street: data.street || undefined, neighborhood: data.neighborhood || undefined, city: data.city, state: data.state, provider: "brasilapi", raw: data };
  }
}
