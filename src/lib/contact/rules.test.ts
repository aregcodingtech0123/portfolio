import { describe, expect, it } from "vitest";
import {
  CONTACT_LIMITS,
  HONEYPOT_FIELD,
  parseContactPayload,
  validateFields,
} from "@/lib/contact/rules";

const GOOD = {
  name: "Ada Lovelace",
  email: "ada@example.org",
  subject: "Hello",
  message: "I would like to talk about a role.",
  token: "XXXX.DUMMY.TOKEN.XXXX",
  [HONEYPOT_FIELD]: "",
  elapsedMs: 12_000,
};

describe("validateFields", () => {
  it("accepts a normal message", () => {
    expect(validateFields(GOOD)).toEqual({});
  });

  it.each(["name", "email", "subject", "message"] as const)("requires %s (whitespace counts as empty)", (key) => {
    expect(validateFields({ ...GOOD, [key]: "   " })[key]).toBe("required");
  });

  it.each(["name", "subject", "message"] as const)("caps %s at its limit", (key) => {
    const limit = CONTACT_LIMITS[key];
    expect(validateFields({ ...GOOD, [key]: "a".repeat(limit) })[key]).toBeUndefined();
    expect(validateFields({ ...GOOD, [key]: "a".repeat(limit + 1) })[key]).toBe("maxLength");
  });

  it.each(["no-at-sign", "a@b", "a b@c.d", "@c.d"])("rejects the address %j", (email) => {
    expect(validateFields({ ...GOOD, email }).email).toBe("email");
  });
});

describe("parseContactPayload", () => {
  it("returns typed fields, token, honeypot and timing", () => {
    expect(parseContactPayload(GOOD)).toEqual({
      ok: true,
      fields: { name: GOOD.name, email: GOOD.email, subject: GOOD.subject, message: GOOD.message },
      token: GOOD.token,
      honeypot: "",
      elapsedMs: 12_000,
    });
  });

  it("trims the email and the token", () => {
    const parsed = parseContactPayload({ ...GOOD, email: "  ada@example.org ", token: " t " });
    expect(parsed.ok && parsed.fields.email).toBe("ada@example.org");
    expect(parsed.ok && parsed.token).toBe("t");
  });

  it("treats a missing honeypot as empty", () => {
    const rest: Record<string, unknown> = { ...GOOD };
    delete rest[HONEYPOT_FIELD];
    expect(parseContactPayload(rest)).toMatchObject({ ok: true, honeypot: "" });
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["a string", "hello"],
    ["a numeric name", { ...GOOD, name: 42 }],
    ["a missing message", { ...GOOD, message: undefined }],
    ["a non-string token", { ...GOOD, token: 1 }],
    ["a non-string honeypot", { ...GOOD, [HONEYPOT_FIELD]: ["x"] }],
    ["a non-numeric elapsedMs", { ...GOOD, elapsedMs: "5000" }],
    ["an infinite elapsedMs", { ...GOOD, elapsedMs: Number.POSITIVE_INFINITY }],
    ["an over-long message", { ...GOOD, message: "a".repeat(CONTACT_LIMITS.message + 1) }],
    ["a bad address", { ...GOOD, email: "not-an-address" }],
    ["an over-long token", { ...GOOD, token: "t".repeat(CONTACT_LIMITS.token + 1) }],
  ])("is invalid for %s", (_label, raw) => {
    expect(parseContactPayload(raw)).toEqual({ ok: false, reason: "invalid" });
  });
});
