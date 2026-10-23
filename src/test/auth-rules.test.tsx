import { describe, expect, it } from "vitest";
import { normalizeWhatsapp, validatePassword, isActiveGrant } from "@/hooks/use-auth";

describe("Package 02 rules", () => {
  it("normalizes Brazilian 10/11 digit numbers with country code 55", () => {
    expect(normalizeWhatsapp("(11) 99999-9999")).toBe("5511999999999");
    expect(normalizeWhatsapp("(21) 3333-4444")).toBe("552133334444");
    expect(normalizeWhatsapp("+55 (11) 99999-9999")).toBe("5511999999999");
    expect(() => normalizeWhatsapp("00999999999")).toThrow();
    expect(() => normalizeWhatsapp("abc11999999999")).toThrow();
  });
  it("requires at least eight password characters", () => {
    expect(() => validatePassword("1234567")).toThrow();
    expect(() => validatePassword("12345678")).not.toThrow();
  });
  const now = Date.parse("2026-10-23T20:35:00Z");
  const grant = { starts_at: "2026-10-23T20:35:00Z", expires_at: null, revoked_at: null };
  it("never grants access for a revoked grant", () => {
    expect(isActiveGrant({ ...grant, revoked_at: "2026-10-23T20:34:00Z" }, now)).toBe(false);
    expect(isActiveGrant(grant, now)).toBe(true);
  });
  it("only grants access when starts_at is now or earlier", () => {
    expect(isActiveGrant({ ...grant, starts_at: "2026-10-23T20:35:01Z" }, now)).toBe(false);
    expect(isActiveGrant(grant, now)).toBe(true);
  });
  it("requires no expiry or strictly future expiry", () => {
    expect(isActiveGrant({ ...grant, expires_at: "2026-10-23T20:35:00Z" }, now)).toBe(false);
    expect(isActiveGrant({ ...grant, expires_at: "2026-10-23T20:35:01Z" }, now)).toBe(true);
    expect(isActiveGrant(grant, now)).toBe(true);
  });
});