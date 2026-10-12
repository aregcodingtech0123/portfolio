import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { expectedHostnamesFor, verifyTurnstile } from "@/lib/turnstile-server";

/*
 * Cloudflare's siteverify is replaced by an injected fetch: no request leaves
 * the test process.
 */

const REAL_SECRET = "0x4AAAAAAAAkg0s2VIOD34y5_real_secret";
const CHECK = { expectedHostnames: ["portfolio.example.dev", "www.portfolio.example.dev"], expectedAction: "contact" };

function siteverify(body: unknown, status = 200) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  vi.stubEnv("TURNSTILE_SECRET_KEY", REAL_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("verifyTurnstile: the request", () => {
  it("posts secret, token and remote IP to siteverify with a timeout", async () => {
    const fetchMock = siteverify({ success: true, hostname: "portfolio.example.dev", action: "contact" });
    const verdict = await verifyTurnstile("tok", { ...CHECK, remoteip: "1.2.3.4" }, fetchMock);

    expect(verdict).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(JSON.parse(String(init.body))).toEqual({ secret: REAL_SECRET, response: "tok", remoteip: "1.2.3.4" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("never calls Cloudflare for an empty token", async () => {
    const fetchMock = siteverify({ success: true });
    expect(await verifyTurnstile("  ", CHECK, fetchMock)).toMatchObject({ ok: false, reason: "invalid" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is unavailable, not invalid, when the secret is missing (a server fault, not the visitor's)", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const fetchMock = siteverify({ success: true });
    expect(await verifyTurnstile("tok", CHECK, fetchMock)).toMatchObject({ ok: false, reason: "unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("verifyTurnstile: Cloudflare's verdict", () => {
  it.each(["invalid-input-response", "timeout-or-duplicate", "missing-input-response"])(
    "%s means the visitor must solve the challenge again",
    async (code) => {
      const verdict = await verifyTurnstile("tok", CHECK, siteverify({ success: false, "error-codes": [code] }));
      expect(verdict).toMatchObject({ ok: false, reason: "invalid" });
      expect(!verdict.ok && verdict.detail).toContain(code);
    },
  );

  it.each(["invalid-input-secret", "missing-input-secret", "bad-request"])(
    "%s is our misconfiguration: unavailable, so the visitor is not sent round a retry loop",
    async (code) => {
      expect(await verifyTurnstile("tok", CHECK, siteverify({ success: false, "error-codes": [code] }))).toMatchObject({
        ok: false,
        reason: "unavailable",
      });
    },
  );

  it("an HTTP error from siteverify is unavailable", async () => {
    expect(await verifyTurnstile("tok", CHECK, siteverify({}, 503))).toMatchObject({ ok: false, reason: "unavailable" });
  });

  it("a timeout or network failure is unavailable", async () => {
    const failing = vi.fn(async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    const verdict = await verifyTurnstile("tok", CHECK, failing);
    expect(verdict).toMatchObject({ ok: false, reason: "unavailable" });
    expect(!verdict.ok && verdict.detail).toContain("TimeoutError");
  });
});

describe("verifyTurnstile: hostname and action checks", () => {
  it("accepts the canonical host and its www twin", async () => {
    for (const hostname of ["portfolio.example.dev", "www.portfolio.example.dev"]) {
      expect(await verifyTurnstile("tok", CHECK, siteverify({ success: true, hostname, action: "contact" }))).toEqual({ ok: true });
    }
  });

  it("rejects a token solved on another site", async () => {
    const verdict = await verifyTurnstile("tok", CHECK, siteverify({ success: true, hostname: "evil.example", action: "contact" }));
    expect(verdict).toMatchObject({ ok: false, reason: "invalid" });
    expect(!verdict.ok && verdict.detail).toContain("evil.example");
  });

  it("rejects a token with no hostname when one is expected", async () => {
    expect(await verifyTurnstile("tok", CHECK, siteverify({ success: true, action: "contact" }))).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("rejects a token issued for another action", async () => {
    const verdict = await verifyTurnstile("tok", CHECK, siteverify({ success: true, hostname: "portfolio.example.dev", action: "login" }));
    expect(verdict).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("skips the hostname check when no site URL is known (development)", async () => {
    expect(
      await verifyTurnstile("tok", { expectedHostnames: [], expectedAction: "contact" }, siteverify({ success: true, hostname: "anything", action: "contact" })),
    ).toEqual({ ok: true });
  });

  it("with Cloudflare's dummy secret, skips hostname/action (undocumented for test keys) but still needs success", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    expect(await verifyTurnstile("XXXX.DUMMY.TOKEN.XXXX", CHECK, siteverify({ success: true }))).toEqual({ ok: true });
    expect(
      await verifyTurnstile("forged", CHECK, siteverify({ success: false, "error-codes": ["invalid-input-response"] })),
    ).toMatchObject({ ok: false, reason: "invalid" });
  });
});

describe("expectedHostnamesFor", () => {
  it.each([
    ["https://portfolio.example.dev", ["portfolio.example.dev", "www.portfolio.example.dev"]],
    ["https://www.portfolio.example.dev/en", ["www.portfolio.example.dev", "portfolio.example.dev"]],
    ["http://localhost:3100", ["localhost", "www.localhost"]],
    [undefined, []],
    ["", []],
    ["not a url", []],
  ])("%j -> %j", (url, expected) => {
    expect(expectedHostnamesFor(url)).toEqual(expected);
  });
});
