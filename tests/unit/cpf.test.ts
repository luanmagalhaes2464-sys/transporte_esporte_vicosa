import { describe, expect, it } from "vitest";
import { isValidCpf, maskCpf } from "@/lib/normalize";

describe("CPF", () => {
  it("aceita um CPF matematicamente válido", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("recusa dígitos repetidos e dígito verificador incorreto", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("529.982.247-24")).toBe(false);
  });

  it("mascara o CPF para listagens administrativas", () => {
    expect(maskCpf("52998224725")).toBe("***.982.247-**");
  });
});
