import { describe,it,expect } from "vitest";
import { canTransitionTransportRequest } from "@/modules/school-transport/service";
describe('fluxo do transporte escolar',()=>{it('permite análise após envio',()=>expect(canTransitionTransportRequest('SUBMITTED','UNDER_REVIEW')).toBe(true));it('não permite aprovar diretamente um rascunho',()=>expect(canTransitionTransportRequest('DRAFT','APPROVED')).toBe(false));it('não reabre indeferido por transição comum',()=>expect(canTransitionTransportRequest('DENIED','UNDER_REVIEW')).toBe(false))});
