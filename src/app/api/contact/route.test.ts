import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HONEYPOT_FIELD, MIN_FILL_MS } from "@/lib/contact/rules";

/*
 * The two outside services are replaced at their module boundaries: Turnstile
 * verification (Cloudflare siteverify) and the email transport (EmailJS). No
 * test here reaches the network or sends anything.
 */
const { verifyMock, secretSetMock, readConfigMock, sendMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(),
  secretSetMock: vi.fn(),
  readConfigMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock("@/lib/turnstile-server", async () => {
  const actual = await vi.importActual<typeof import("@/lib/turnstile-server")>("@/lib/turnstile-server");
  return { ...actual, verifyTurnstile: verifyMock, isTurnstileSecretSet: secretSetMock };
});

vi.mock("@/lib/contact/email-transport", () => ({
  readEmailjsConfig: readConfigMock,
  sendContactEmail: sendMock,
}));

const { POST } = await import("./route");

const CONFIG = {
  serviceId: "s",
  templateId: "t",
  publicKey: "p",
  privateKey: "k",
  origin: "https://api.emailjs.com",
};

const FIELDS = {
  name: "Ada Lovelace",
  email: "ada@example.org",
  subject: "A role",
  message: "Hello, I would like to talk.",
};

function payload(overrides: Record<string, unknown> = {}) {
  return { ...FIELDS, token: "valid-token", [HONEYPOT_FIELD]: "", elapsedMs: 15_000, ...overrides };
}

function post(body: unknown, headers: Record<string, string> = { "Content-Type": "application/json" }) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

let logs: string[];

beforeEach(() => {
  logs = [];
  for (const level of ["error", "warn", "info"] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "));
    });
  }
  // A fully configured production server unless a test says otherwise.
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "0x4AAAAAAAsite");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portfolio.example.dev");
  secretSetMock.mockReturnValue(true);
  readConfigMock.mockReturnValue(CONFIG);
  verifyMock.mockResolvedValue({ ok: true });
  sendMock.mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  verifyMock.mockReset();
  secretSetMock.mockReset();
  readConfigMock.mockReset();
  sendMock.mockReset();
});

async function outcomeOf(res: Response) {
  return (await res.json()) as { outcome: string };
}

describe("POST /api/contact: the happy path", () => {
  it("verifies the token, then sends the fields from the server, and answers sent", async () => {
    const res = await POST(post(payload()));
    expect(res.status).toBe(200);
    expect(await outcomeOf(res)).toEqual({ outcome: "sent" });
    expect(res.headers.get("cache-control")).toBe("no-store");

    expect(verifyMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(FIELDS, CONFIG);
    // Verification strictly before the send.
    expect(verifyMock.mock.invocationCallOrder[0]).toBeLessThan(sendMock.mock.invocationCallOrder[0]);
  });

  it("asks Cloudflare to check the hostname (from the site URL), the action and the visitor's IP", async () => {
    await POST(post(payload(), { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4, 10.0.0.1" }));
    expect(verifyMock).toHaveBeenCalledWith("valid-token", {
      expectedHostnames: ["portfolio.example.dev", "www.portfolio.example.dev"],
      expectedAction: "contact",
      remoteip: "1.2.3.4",
    });
  });
});

describe("POST /api/contact: the captcha gate cannot be skipped", () => {
  it("a request with no token is refused and nothing is sent", async () => {
    verifyMock.mockResolvedValue({ ok: false, reason: "invalid", detail: "no token in the request" });
    const res = await POST(post(payload({ token: "" })));
    expect(res.status).toBe(403);
    expect(await outcomeOf(res)).toEqual({ outcome: "captcha_failed" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("a forged or reused token is refused and nothing is sent", async () => {
    verifyMock.mockResolvedValue({ ok: false, reason: "invalid", detail: "siteverify rejected the token: invalid-input-response" });
    const res = await POST(post(payload({ token: "forged" })));
    expect(res.status).toBe(403);
    expect(sendMock).not.toHaveBeenCalled();
    expect(logs.join("\n")).toContain("invalid-input-response");
  });

  it("verification is not skipped in production even if a build somehow has no keys at all", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    secretSetMock.mockReturnValue(false);
    const res = await POST(post(payload()));
    expect(res.status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("skips Turnstile only in development with neither key set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    secretSetMock.mockReturnValue(false);
    const res = await POST(post(payload({ token: "" })));
    expect(res.status).toBe(200);
    expect(verifyMock).not.toHaveBeenCalled();
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("in development, a single configured key still makes the captcha mandatory", async () => {
    vi.stubEnv("NODE_ENV", "development");
    verifyMock.mockResolvedValue({ ok: false, reason: "invalid", detail: "x" });
    const res = await POST(post(payload()));
    expect(res.status).toBe(403);
    expect(sendMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/contact: the misconfigured server is honest (unavailable), never silent", () => {
  it("no EmailJS configuration: unavailable, logged with the variable names, token not spent", async () => {
    readConfigMock.mockReturnValue(null);
    const res = await POST(post(payload()));
    expect(res.status).toBe(503);
    const body = await outcomeOf(res);
    expect(body).toEqual({ outcome: "unavailable" });
    expect(JSON.stringify(body)).not.toMatch(/EMAILJS|KEY/);
    expect(logs.join("\n")).toContain("EMAILJS_PRIVATE_KEY");
    expect(verifyMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("Turnstile secret missing (the audit's silent-block case): unavailable, not captcha_failed", async () => {
    verifyMock.mockResolvedValue({ ok: false, reason: "unavailable", detail: "TURNSTILE_SECRET_KEY is not set" });
    const res = await POST(post(payload()));
    expect(res.status).toBe(503);
    expect(await outcomeOf(res)).toEqual({ outcome: "unavailable" });
    expect(logs.join("\n")).toContain("TURNSTILE_SECRET_KEY");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("site key missing from the build: unavailable, since the page could not show a captcha", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    const res = await POST(post(payload()));
    expect(res.status).toBe(503);
    expect(logs.join("\n")).toContain("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("Cloudflare unreachable: unavailable", async () => {
    verifyMock.mockResolvedValue({ ok: false, reason: "unavailable", detail: "siteverify unreachable: TimeoutError" });
    const res = await POST(post(payload()));
    expect(res.status).toBe(503);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("EmailJS refuses the account settings or keys: unavailable, with the provider's answer only in the log", async () => {
    sendMock.mockResolvedValue({ ok: false, kind: "misconfigured", detail: "EmailJS answered 403: API calls are disabled for non-browser applications" });
    const res = await POST(post(payload()));
    expect(res.status).toBe(503);
    const body = await outcomeOf(res);
    expect(body).toEqual({ outcome: "unavailable" });
    expect(JSON.stringify(body)).not.toContain("non-browser");
    expect(logs.join("\n")).toContain("non-browser");
  });
});

describe("POST /api/contact: a failed send is distinct from a misconfiguration", () => {
  it("a transient provider failure answers send_failed (worth retrying)", async () => {
    sendMock.mockResolvedValue({ ok: false, kind: "transient", detail: "EmailJS answered 500: oops" });
    const res = await POST(post(payload()));
    expect(res.status).toBe(502);
    const body = await outcomeOf(res);
    expect(body).toEqual({ outcome: "send_failed" });
    expect(JSON.stringify(body)).not.toContain("oops");
    expect(logs.join("\n")).toContain("EmailJS answered 500");
  });
});

describe("POST /api/contact: spam friction refuses visibly and sends nothing", () => {
  it("a filled honeypot is rejected before any outside call", async () => {
    const res = await POST(post(payload({ [HONEYPOT_FIELD]: "https://spam.example" })));
    expect(res.status).toBe(422);
    expect(await outcomeOf(res)).toEqual({ outcome: "rejected" });
    expect(verifyMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
    expect(logs.join("\n")).toContain("honeypot");
  });

  it.each([0, 500, MIN_FILL_MS - 1])("a form sent %i ms after it opened is rejected", async (elapsedMs) => {
    const res = await POST(post(payload({ elapsedMs })));
    expect(res.status).toBe(422);
    expect(verifyMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("exactly the minimum fill time is accepted", async () => {
    const res = await POST(post(payload({ elapsedMs: MIN_FILL_MS })));
    expect(res.status).toBe(200);
  });

  it("never logs the visitor's message or address", async () => {
    await POST(post(payload({ [HONEYPOT_FIELD]: "x" })));
    await POST(post(payload()));
    const all = logs.join("\n");
    expect(all).not.toContain(FIELDS.email);
    expect(all).not.toContain(FIELDS.message);
  });
});

describe("POST /api/contact: request shape and size", () => {
  it.each(["text/plain", "application/x-www-form-urlencoded", "multipart/form-data"])(
    "rejects Content-Type %s with 415",
    async (type) => {
      const res = await POST(post(JSON.stringify(payload()), { "Content-Type": type }));
      expect(res.status).toBe(415);
      expect(sendMock).not.toHaveBeenCalled();
    },
  );

  it("refuses a body over the cap by Content-Length without reading it", async () => {
    const res = await POST(post(payload(), { "Content-Type": "application/json", "Content-Length": String(70 * 1024) }));
    expect(res.status).toBe(413);
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("refuses a real oversized body with 413", async () => {
    const res = await POST(post(payload({ message: "a".repeat(200_000) })));
    expect(res.status).toBe(413);
  });

  it("rejects a body that is not JSON", async () => {
    const res = await POST(post("{not json"));
    expect(res.status).toBe(400);
    expect(await outcomeOf(res)).toEqual({ outcome: "invalid" });
  });

  it.each([
    ["a missing field", { message: undefined }],
    ["an empty name", { name: "   " }],
    ["a bad address", { email: "nope" }],
    ["an over-long subject", { subject: "a".repeat(201) }],
    ["an over-long message", { message: "a".repeat(4001) }],
    ["a non-numeric fill time", { elapsedMs: "10000" }],
  ])("rejects %s with 400 invalid (the browser checks are not trusted)", async (_label, override) => {
    const res = await POST(post(payload(override)));
    expect(res.status).toBe(400);
    expect(await outcomeOf(res)).toEqual({ outcome: "invalid" });
    expect(verifyMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
