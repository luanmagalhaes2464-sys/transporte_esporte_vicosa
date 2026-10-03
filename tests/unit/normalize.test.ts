import { describe,it,expect } from "vitest";
import { normalizeText,digitsOnly,maskCpf } from "../../src/lib/normalize";
describe('normalização territorial',()=>{
  it('ignora acentos, caixa e espaços',()=>expect(normalizeText('  São   José do Triunfo ')).toBe('sao jose do triunfo'));
  it('normaliza Nova Viçosa',()=>expect(normalizeText('NOVA VIÇOSA')).toBe('nova vicosa'));
  it('mantém somente dígitos',()=>expect(digitsOnly('36570-123')).toBe('36570123'));
  it('mascara CPF',()=>expect(maskCpf('12345678901')).toBe('***.456.789-**'));
});
