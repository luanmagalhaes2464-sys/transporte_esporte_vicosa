import { digitsOnly } from "@/lib/normalize";
import type { AddressResult, CepProvider } from "./types";

export class ViaCepProvider implements CepProvider {
  async lookup(input: string): Promise<AddressResult> {
    const cep = digitsOnly(input);
    if (cep.length !== 8) throw new Error("INVALID_CEP");
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!response.ok) throw new Error("CEP_PROVIDER_ERROR");
    const data = await response.json();
    if (data.erro) throw new Error("CEP_NOT_FOUND");
    return { cep, street: data.logradouro || undefined, neighborhood: data.bairro || undefined, city: data.localidade, state: data.uf, provider: "viacep", raw: data };
  }
}
