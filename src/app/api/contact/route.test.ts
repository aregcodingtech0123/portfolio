import { afterEach, describe, expect, it, vi } from "vitest";

const isTurnstileSecretConfiguredMock = vi.fn();
const verifyTurnstileTokenMock = vi.fn();

vi.mock("@/lib/turnstile-server", () => ({
  isTurnstileSecretConfigured: isTurnstileSecretConfiguredMock,
  verifyTurnstileToken: verifyTurnstileTokenMock,
}));

const { POST } = await import("./route");

function postRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  isTurnstileSecretConfiguredMock.mockReset();
  verifyTurnstileTokenMock.mockReset();
});

describe("POST /api/contact: server not configured", () => {
  it("returns 503 and never calls verifyTurnstileToken", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    isTurnstileSecretConfiguredMock.mockReturnValue(false);
    const res = await POST(postRequest({ token: "abc" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Turnstile is not configured on the server",
    });
    expect(verifyTurnstileTokenMock).not.toHaveBeenCalled();
    errorLog.mockRestore();
  });

  it("leaves a server-log trace naming the missing variable, so the block is not silent", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    isTurnstileSecretConfiguredMock.mockReturnValue(false);
    await POST(postRequest({ token: "abc" }));
    expect(errorLog).toHaveBeenCalledTimes(1);
    expect(String(errorLog.mock.calls[0][0])).toContain("TURNSTILE_SECRET_KEY");
    errorLog.mockRestore();
  });
});

describe("POST /api/contact: request validation (secret configured)", () => {
  it("rejects a body that is not valid JSON", async () => {
    isTurnstileSecretConfiguredMock.mockReturnValue(true);
    const res = await POST(postRequest("{not json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON body" });
  });

  it("rejects a non-string token", async () => {
    isTurnstileSecretConfiguredMock.mockReturnValue(true);
    const res = await POST(postRequest({ token: 123 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "token must be a string" });
  });
});

describe("POST /api/contact: verification result", () => {
  it("returns 400 with the verifier's error when verification fails", async () => {
    isTurnstileSecretConfiguredMock.mockReturnValue(true);
    verifyTurnstileTokenMock.mockResolvedValue({
      ok: false,
      error: "Turnstile verification failed",
    });
    const res = await POST(postRequest({ token: "bad-token" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Turnstile verification failed" });
  });

  it("returns 200 ok when verification succeeds", async () => {
    isTurnstileSecretConfiguredMock.mockReturnValue(true);
    verifyTurnstileTokenMock.mockResolvedValue({ ok: true });
    const res = await POST(postRequest({ token: "good-token" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("POST /api/contact: remote IP extraction", () => {
  it("uses the first address in x-forwarded-for, trimmed", async () => {
    isTurnstileSecretConfiguredMock.mockReturnValue(true);
    verifyTurnstileTokenMock.mockResolvedValue({ ok: true });
    await POST(
      postRequest(
        { token: "t" },
        { "x-forwarded-for": "1.2.3.4 , 5.6.7.8" },
      ),
    );
    expect(verifyTurnstileTokenMock).toHaveBeenCalledWith("t", "1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    isTurnstileSecretConfiguredMock.mockReturnValue(true);
    verifyTurnstileTokenMock.mockResolvedValue({ ok: true });
    await POST(postRequest({ token: "t" }, { "x-real-ip": "9.9.9.9" }));
    expect(verifyTurnstileTokenMock).toHaveBeenCalledWith("t", "9.9.9.9");
  });

  it("passes null when neither header is present", async () => {
    isTurnstileSecretConfiguredMock.mockReturnValue(true);
    verifyTurnstileTokenMock.mockResolvedValue({ ok: true });
    await POST(postRequest({ token: "t" }));
    expect(verifyTurnstileTokenMock).toHaveBeenCalledWith("t", null);
  });
});
