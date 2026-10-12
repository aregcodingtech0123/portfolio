import { describe, expect, it } from "vitest";
import {
  CSP_HEADER_NAME,
  CSP_MODE,
  SITE_CSP,
  SITE_CSP_DIRECTIVES,
  STUDIO_CSP,
  buildCsp,
} from "@/lib/csp";

describe("site CSP", () => {
  it("is exactly the audited policy", () => {
    expect(SITE_CSP).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self'",
        "font-src 'self'",
        "connect-src 'self' https://api.emailjs.com https://challenges.cloudflare.com",
        "frame-src https://challenges.cloudflare.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; "),
    );
  });

  it("never upgrades insecure requests (it breaks the localhost e2e run)", () => {
    expect(SITE_CSP).not.toContain("upgrade-insecure-requests");
  });

  it("allows no eval and no wildcard or scheme-only source", () => {
    expect(SITE_CSP).not.toContain("unsafe-eval");
    for (const sources of Object.values(SITE_CSP_DIRECTIVES)) {
      for (const s of sources) {
        expect(s).not.toBe("*");
        expect(s).not.toMatch(/^(https?|data|blob):?$/);
      }
    }
  });

  it("names only the two third-party origins the browser contacts", () => {
    const origins = new Set(SITE_CSP.match(/https:\/\/[a-z.]+/g));
    expect([...origins].sort()).toEqual([
      "https://api.emailjs.com",
      "https://challenges.cloudflare.com",
    ]);
  });
});

describe("studio CSP", () => {
  it("carries only the directives that need no origin list", () => {
    expect(STUDIO_CSP).toBe("frame-ancestors 'none'; object-src 'none'; base-uri 'self'");
  });
});

describe("delivery mode", () => {
  it("ships report-only, so the policy cannot block a real resource yet", () => {
    expect(CSP_MODE).toBe("report-only");
    expect(CSP_HEADER_NAME).toBe("Content-Security-Policy-Report-Only");
  });
});

describe("buildCsp", () => {
  it("joins directives with semicolons and sources with spaces", () => {
    expect(buildCsp({ "default-src": ["'self'"], "img-src": ["'self'", "https://a.test"] })).toBe(
      "default-src 'self'; img-src 'self' https://a.test",
    );
  });
});
