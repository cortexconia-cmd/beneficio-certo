import { describe, expect, it } from "vitest";
import { FREE_BENEFIT_SLUGS, isFreeBenefit } from "@/hooks/use-benefit-access";

describe("Catálogo gratuito", () => {
  it("permite exatamente três benefícios gratuitos", () => {
    expect([...FREE_BENEFIT_SLUGS].sort()).toEqual(["auxilio-gas", "bolsa-familia", "bpc-loas"]);
  });
  it.each(["salario-maternidade","minha-casa-minha-vida","seguro-desemprego","tarifa-social-energia","pe-de-meia"])("bloqueia %s sem acesso", slug => {
    expect(isFreeBenefit(slug)).toBe(false);
  });
});
