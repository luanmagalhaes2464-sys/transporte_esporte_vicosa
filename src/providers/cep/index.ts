import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";
import { digitsOnly } from "@/lib/normalize";
import { BrasilApiProvider } from "./brasil-api";
import { ViaCepProvider } from "./viacep";
import type { CepProvider } from "./types";

function provider(): CepProvider {
  if (env().CEP_PROVIDER === "brasilapi") return new BrasilApiProvider();
  if (env().CEP_PROVIDER === "correios") throw new Error("CORREIOS_PROVIDER_NOT_CONFIGURED");
  return new ViaCepProvider();
}

export async function lookupCep(input: string) {
  const cep = digitsOnly(input);
  const cached = await prisma.cepCache.findUnique({ where: { cep } });
  if (cached) return { cep, street: cached.street ?? undefined, neighborhood: cached.neighborhood ?? undefined, city: cached.city, state: cached.state, provider: `cache:${cached.provider}` };
  const result = await provider().lookup(cep);
  await prisma.cepCache.upsert({
    where: { cep },
    update: { street: result.street, neighborhood: result.neighborhood, city: result.city, state: result.state, provider: result.provider, raw: result.raw as object },
    create: { cep, street: result.street, neighborhood: result.neighborhood, city: result.city, state: result.state, provider: result.provider, raw: result.raw as object }
  });
  return result;
}
