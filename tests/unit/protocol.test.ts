import { describe,it,expect } from "vitest";
import { formatProtocol } from "@/lib/protocol";
describe('protocolos',()=>{it('usa prefixo, ano e sequência com seis dígitos',()=>expect(formatProtocol('TE',2027,145)).toBe('TE-2027-000145'));it('serve ao protocolo de esporte',()=>expect(formatProtocol('ESP',2026,152)).toBe('ESP-2026-000152'))});
