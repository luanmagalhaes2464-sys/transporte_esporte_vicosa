import { describe,it,expect } from "vitest";
import { timeRangesOverlap } from "@/lib/time";
describe('conflitos de agenda',()=>{
  it('detecta sobreposição',()=>expect(timeRangesOverlap(new Date('2026-10-02T10:00:00Z'),new Date('2026-10-02T12:00:00Z'),new Date('2026-10-02T11:00:00Z'),new Date('2026-10-02T13:00:00Z'))).toBe(true));
  it('permite viagens encostadas sem sobreposição',()=>expect(timeRangesOverlap(new Date('2026-10-02T10:00:00Z'),new Date('2026-10-02T12:00:00Z'),new Date('2026-10-02T12:00:00Z'),new Date('2026-10-02T13:00:00Z'))).toBe(false));
});
