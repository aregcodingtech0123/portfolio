import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EMAILJS_DEFAULT_ORIGIN,
  readEmailjsConfig,
  resolveEmailjsOrigin,
  sendContactEmail,
  type EmailjsConfig,
} from "@/lib/contact/email-transport";

/*
 * The transport is driven through an injected fetch: no request ever leaves
 * the test process.
 */

const CONFIG: EmailjsConfig = {
  serviceId: "service_x",
  templateId: "template_x",
  publicKey: "public_x",
  privateKey: "private_x",
  origin: EMAILJS_DEFAULT_ORIGIN,
};

const FIELDS = {
  name: "Ada Lovelace",
  email: "ada@example.org",
  subject: "Hello",
  message: "Line one\nLine two",
};

function fakeFetch(status: number, text = "OK") {
  return vi.fn(async () => new Response(text, { status }));
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sendContactEmail: the request", () => {
  it("posts the template, the four template params and the private key to EmailJS's REST endpoint", async () => {
    const fetchMock = fakeFetch(200);
    const result = await sendContactEmail(FIELDS, CONFIG, fetchMock);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.emailjs.com/api/v1.0/email/send");
    expect(init.method).toBe("POST");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(init.body))).toEqual({
      service_id: "service_x",
      template_id: "template_x",
      user_id: "public_x",
      accessToken: "private_x",
      template_params: {
        from_name: "Ada Lovelace",
        reply_to: "ada@example.org",
        subject: "Hello",
        message: "Line one\nLine two",
      },
    });
  });

  it("strips CR/LF from the single-line fields so no mail header can be smuggled in", async () => {
    const fetchMock = fakeFetch(200);
    await sendContactEmail(
      { ...FIELDS, name: "Eve\r\nBcc: victim@example.org", subject: "Hi\nX-Injected: 1", email: "e@x.org\r\n" },
      CONFIG,
      fetchMock,
    );
    const params = JSON.parse(String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body)).template_params;
    expect(params.from_name).not.toMatch(/[\r\n]/);
    expect(params.subject).not.toMatch(/[\r\n]/);
    expect(params.reply_to).toBe("e@x.org");
    // The body keeps its line breaks.
    expect(params.message).toContain("\n");
  });
});

describe("sendContactEmail: how a failure is classified", () => {
  it.each([
    [400, "The user_id parameter is required"],
    [403, "API calls are disabled for non-browser applications"],
    [403, "The Private Key is required"],
    [404, "Account not found"],
    [412, "Template not found"],
    [426, "Monthly limit reached"],
  ])("HTTP %i is a misconfiguration that retrying will not fix", async (status, text) => {
    const result = await sendContactEmail(FIELDS, CONFIG, fakeFetch(status, text));
    expect(result).toMatchObject({ ok: false, kind: "misconfigured" });
    expect(!result.ok && result.detail).toContain(String(status));
  });

  it.each([429, 500, 502, 503])("HTTP %i is transient", async (status) => {
    expect(await sendContactEmail(FIELDS, CONFIG, fakeFetch(status, "x"))).toMatchObject({ ok: false, kind: "transient" });
  });

  it("a network error or timeout is transient", async () => {
    const failing = vi.fn(async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    const result = await sendContactEmail(FIELDS, CONFIG, failing);
    expect(result).toMatchObject({ ok: false, kind: "transient" });
    expect(!result.ok && result.detail).toContain("TimeoutError");
  });
});

describe("readEmailjsConfig", () => {
  function stubAll(values: Partial<Record<string, string>>) {
    for (const name of ["EMAILJS_SERVICE_ID", "EMAILJS_TEMPLATE_ID", "EMAILJS_PUBLIC_KEY", "EMAILJS_PRIVATE_KEY", "EMAILJS_API_ORIGIN", "APP_ENV"]) {
      vi.stubEnv(name, values[name] ?? "");
    }
  }

  it("reads all four values", () => {
    stubAll({ EMAILJS_SERVICE_ID: "s", EMAILJS_TEMPLATE_ID: "t", EMAILJS_PUBLIC_KEY: "p", EMAILJS_PRIVATE_KEY: "k" });
    expect(readEmailjsConfig()).toEqual({
      serviceId: "s",
      templateId: "t",
      publicKey: "p",
      privateKey: "k",
      origin: EMAILJS_DEFAULT_ORIGIN,
    });
  });

  it.each(["EMAILJS_SERVICE_ID", "EMAILJS_TEMPLATE_ID", "EMAILJS_PUBLIC_KEY", "EMAILJS_PRIVATE_KEY"])(
    "is null when %s is missing (a send without the private key is never attempted)",
    (missing) => {
      const all = { EMAILJS_SERVICE_ID: "s", EMAILJS_TEMPLATE_ID: "t", EMAILJS_PUBLIC_KEY: "p", EMAILJS_PRIVATE_KEY: "k" };
      stubAll({ ...all, [missing]: "  " });
      expect(readEmailjsConfig()).toBeNull();
    },
  );
});

describe("resolveEmailjsOrigin: the mock override exists only for the test profile", () => {
  it.each([
    [{ APP_ENV: "test", EMAILJS_API_ORIGIN: "http://127.0.0.1:3199" }, "http://127.0.0.1:3199"],
    [{ APP_ENV: "test", EMAILJS_API_ORIGIN: "http://localhost:3199/anything" }, "http://localhost:3199"],
    [{ APP_ENV: "", EMAILJS_API_ORIGIN: "http://127.0.0.1:3199" }, EMAILJS_DEFAULT_ORIGIN],
    [{ APP_ENV: "production", EMAILJS_API_ORIGIN: "http://127.0.0.1:3199" }, EMAILJS_DEFAULT_ORIGIN],
    [{ APP_ENV: "test", EMAILJS_API_ORIGIN: "https://evil.example" }, EMAILJS_DEFAULT_ORIGIN],
    [{ APP_ENV: "test", EMAILJS_API_ORIGIN: "http://localhost.evil.example" }, EMAILJS_DEFAULT_ORIGIN],
    [{ APP_ENV: "test", EMAILJS_API_ORIGIN: "not a url" }, EMAILJS_DEFAULT_ORIGIN],
    [{ APP_ENV: "test" }, EMAILJS_DEFAULT_ORIGIN],
  ])("%j resolves to %s", (env, expected) => {
    expect(resolveEmailjsOrigin(env)).toBe(expected);
  });
});
