import { describe, expect, it } from "vitest";
import {
  formatCardNumber, formatCep, formatCpfCnpj, formatExpiry, isFutureExpiry, isValidCardNumber, isValidCnpj, isValidCpf, isValidCpfCnpj, parseExpiry,
} from "@/lib/payment-validators";

describe("payment validators", () => {
  it("validates CPF check digits and rejects repeated digits", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224726")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
  it("validates CNPJ check digits", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
    expect(isValidCpfCnpj("11222333000181")).toBe(true);
  });
  it("validates card numbers with Luhn", () => {
    expect(isValidCardNumber("4111 1111 1111 1111")).toBe(true);
    expect(isValidCardNumber("4111 1111 1111 1112")).toBe(false);
    expect(isValidCardNumber("1234")).toBe(false);
  });
  it("parses and checks card expiry", () => {
    expect(parseExpiry("09/29")).toEqual({ month: "09", year: 2029 });
    expect(parseExpiry("13/29")).toBeNull();
    const now = new Date(2026, 9, 28);
    expect(isFutureExpiry("10/26", now)).toBe(true);
    expect(isFutureExpiry("09/26", now)).toBe(false);
    expect(isFutureExpiry("1/26", now)).toBe(false);
  });
  it("formats inputs while typing", () => {
    expect(formatCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(formatCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(formatExpiry("0929")).toBe("09/29");
    expect(formatCep("12345678")).toBe("12345-678");
  });
});
