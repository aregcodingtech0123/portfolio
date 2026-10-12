import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { forwardRef, useImperativeHandle } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import enMessages from "../../../messages/en.json";

vi.mock("@/components/providers/SiteContentProvider", () => ({
  useSiteContent: () => ({
    contact: { email: "hello@candidate-test.dev", location: "Ankara" },
    social: {
      github: "https://github.com/candidate-test",
      linkedin: "https://linkedin.com/in/candidate-test",
    },
  }),
}));

vi.mock("@/components/providers/ThemeProvider", () => ({
  useTheme: () => ({ mode: "dark" }),
}));

const { resetMock } = vi.hoisted(() => ({ resetMock: vi.fn() }));

// Cloudflare's real widget cannot render in jsdom, so it is replaced with a
// button that triggers onSuccess directly, enough to drive the captchaReady
// state. reset() is recorded: a token is single-use and must be dropped after
// every attempt.
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: forwardRef(function MockTurnstile(
    props: { onSuccess?: (token: string) => void },
    ref,
  ) {
    useImperativeHandle(ref, () => ({ reset: resetMock }));
    return (
      <button type="button" onClick={() => props.onSuccess?.("fake-token")}>
        complete captcha
      </button>
    );
  }),
}));

type ConfigOptions = { sendConfigured: boolean; turnstileConfigured: boolean };

/**
 * @/lib/contact/client-config and @/lib/turnstile each export a module-level
 * const computed once at import time. A fresh module graph per test is the
 * reliable way to flip them: resetModules + doMock + dynamic import.
 */
async function loadContact({ sendConfigured, turnstileConfigured }: ConfigOptions) {
  vi.doMock("@/lib/contact/client-config", () => ({
    contactSendConfigured: sendConfigured,
    CONTACT_SEND_VARS: ["EMAILJS_SERVICE_ID", "EMAILJS_TEMPLATE_ID", "EMAILJS_PUBLIC_KEY", "EMAILJS_PRIVATE_KEY"],
    reportContactSendMissing: vi.fn(),
  }));
  vi.doMock("@/lib/turnstile", () => ({
    turnstileSiteKey: turnstileConfigured ? "site-key" : "",
    turnstileConfigured,
    reportTurnstileMissing: vi.fn(),
  }));
  const { Contact } = await import("./Contact");
  return Contact;
}

async function renderContact(opts: ConfigOptions) {
  const Contact = await loadContact(opts);
  render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <Contact />
    </NextIntlClientProvider>,
  );
}

function submitButtons() {
  return screen.getAllByRole("button", { name: "Send message" });
}

const UNAVAILABLE = /temporarily unavailable/;

function fillForm() {
  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Ada Lovelace" } });
  fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "ada@example.org" } });
  fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "A role" } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello there." } });
}

const fetchMock = vi.fn();

function answer(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce(
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

beforeEach(() => {
  vi.resetModules();
  resetMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Contact: four-state configuration matrix", () => {
  it("state A (neither configured, non-production): both dev banners, the honest unavailable notice, submit disabled", async () => {
    await renderContact({ sendConfigured: false, turnstileConfigured: false });

    submitButtons().forEach((btn) => expect(btn).toBeDisabled());
    expect(screen.getByText(/Contact form disabled: the server cannot send/)).toBeInTheDocument();
    expect(screen.getByText(/Turnstile disabled/)).toBeInTheDocument();
    expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();
  });

  it("state A in production: no dev banner, but the visitor is told to write directly, with the links", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await renderContact({ sendConfigured: false, turnstileConfigured: false });

    expect(screen.queryByText(/Contact form disabled/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Turnstile disabled/)).not.toBeInTheDocument();
    submitButtons().forEach((btn) => expect(btn).toBeDisabled());

    const notice = screen.getByText(UNAVAILABLE).parentElement!;
    expect(within(notice).getByRole("link", { name: "hello@candidate-test.dev" })).toHaveAttribute(
      "href",
      "mailto:hello@candidate-test.dev",
    );
    expect(within(notice).getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
      "href",
      "https://linkedin.com/in/candidate-test",
    );
  });

  it("state B (send unconfigured, Turnstile configured): send banner, the widget renders, unavailable, submit disabled", async () => {
    await renderContact({ sendConfigured: false, turnstileConfigured: true });

    expect(screen.getByText(/Contact form disabled: the server cannot send/)).toBeInTheDocument();
    expect(screen.queryByText(/Turnstile disabled/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "complete captcha" })).toBeInTheDocument();
    expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();
    submitButtons().forEach((btn) => expect(btn).toBeDisabled());
  });

  it("state C (send configured, Turnstile unconfigured, development): submit is enabled with no captcha", async () => {
    await renderContact({ sendConfigured: true, turnstileConfigured: false });

    expect(screen.queryByText(/Contact form disabled/)).not.toBeInTheDocument();
    expect(screen.getByText(/Turnstile disabled/)).toBeInTheDocument();
    expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
    submitButtons().forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it("state C in production: the server requires the captcha, so the form says unavailable instead of failing later", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await renderContact({ sendConfigured: true, turnstileConfigured: false });

    expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();
    submitButtons().forEach((btn) => expect(btn).toBeDisabled());
  });

  it("state D (both configured): submit starts disabled and becomes enabled once the captcha completes", async () => {
    await renderContact({ sendConfigured: true, turnstileConfigured: true });

    expect(screen.queryByText(/Contact form disabled/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Turnstile disabled/)).not.toBeInTheDocument();
    expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
    submitButtons().forEach((btn) => expect(btn).toBeDisabled());

    fireEvent.click(screen.getByRole("button", { name: "complete captcha" }));

    await waitFor(() => submitButtons().forEach((btn) => expect(btn).not.toBeDisabled()));
  });
});

describe("Contact: client-side validation", () => {
  it("submitting the empty form shows required-field errors and never contacts the server", async () => {
    await renderContact({ sendConfigured: true, turnstileConfigured: false });

    fireEvent.click(submitButtons()[0]);

    const errors = await waitFor(() => screen.getAllByText("This field is required."));
    expect(errors).toHaveLength(4); // name, email, subject, message
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Contact: the browser only posts to /api/contact", () => {
  it("sends the fields, the Turnstile token, an empty honeypot and the fill time; nothing else is contacted", async () => {
    answer(200, { outcome: "sent" });
    await renderContact({ sendConfigured: true, turnstileConfigured: true });
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "complete captcha" }));
    await waitFor(() => expect(submitButtons()[0]).not.toBeDisabled());
    fireEvent.click(submitButtons()[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/contact");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.org",
      subject: "A role",
      message: "Hello there.",
      token: "fake-token",
      fax_extension: "",
    });
    expect(typeof body.elapsedMs).toBe("number");
    expect(body.elapsedMs).toBeGreaterThanOrEqual(0);
    // No email credential travels from the browser.
    expect(JSON.stringify(body)).not.toMatch(/service|template|user_id|accessToken|publicKey/i);
  });
});

describe("Contact: each server outcome reaches the visitor as a distinct message", () => {
  async function submitAndAnswer(status: number, body: unknown) {
    if (body instanceof Error) fetchMock.mockRejectedValueOnce(body);
    else answer(status, body);
    await renderContact({ sendConfigured: true, turnstileConfigured: true });
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "complete captcha" }));
    await waitFor(() => expect(submitButtons()[0]).not.toBeDisabled());
    fireEvent.click(submitButtons()[0]);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  }

  it("sent: a success status, the fields are cleared, and the spent token is dropped", async () => {
    await submitAndAnswer(200, { outcome: "sent" });
    expect(await screen.findByRole("status")).toHaveTextContent(enMessages.Contact.success);
    expect(screen.getByLabelText("Full Name")).toHaveValue("");
    expect(resetMock).toHaveBeenCalled();
  });

  it.each([
    ["captcha_failed", 403, enMessages.Contact.captchaError],
    ["rejected", 422, enMessages.Contact.rejected],
    ["invalid", 400, enMessages.Contact.invalid],
    ["send_failed", 502, enMessages.Contact.sendFailed],
  ])("%s: an alert with its own message, the token reset, and a new captcha needed", async (outcome, status, text) => {
    await submitAndAnswer(status, { outcome });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(text);
    expect(resetMock).toHaveBeenCalled();
    // The token was spent, so Send waits for a fresh captcha.
    submitButtons().forEach((btn) => expect(btn).toBeDisabled());
    expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
  });

  it("unavailable: the honest notice with the direct links, and no retry loop (Send stays disabled)", async () => {
    await submitAndAnswer(503, { outcome: "unavailable" });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(UNAVAILABLE);
    expect(within(alert).getByRole("link", { name: "hello@candidate-test.dev" })).toBeInTheDocument();
    expect(within(alert).getByRole("link", { name: "LinkedIn" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "complete captcha" }));
    submitButtons().forEach((btn) => expect(btn).toBeDisabled());
    // Editing the form does not hide it: the server is still broken.
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "again" } });
    expect(screen.getByText(UNAVAILABLE)).toBeInTheDocument();
  });

  it("a network failure is a failed send, not a silent nothing", async () => {
    await submitAndAnswer(0, new TypeError("Failed to fetch"));
    expect(await screen.findByRole("alert")).toHaveTextContent(enMessages.Contact.sendFailed);
  });

  it("a non-JSON 503 (proxy page) is treated as unavailable", async () => {
    await submitAndAnswer(503, "<html>Service Unavailable</html>");
    expect(await screen.findByRole("alert")).toHaveTextContent(UNAVAILABLE);
  });

  it("a non-JSON 500 is a failed send", async () => {
    await submitAndAnswer(500, "<html>oops</html>");
    expect(await screen.findByRole("alert")).toHaveTextContent(enMessages.Contact.sendFailed);
  });

  it('a "sent" body on an error status is not believed', async () => {
    await submitAndAnswer(500, { outcome: "sent" });
    expect(await screen.findByRole("alert")).toHaveTextContent(enMessages.Contact.sendFailed);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("Contact: the honeypot is invisible to people and assistive technology", () => {
  it("is out of the tab order, inside an inert, aria-hidden container, and not exposed as a textbox", async () => {
    await renderContact({ sendConfigured: true, turnstileConfigured: true });
    const input = document.querySelector<HTMLInputElement>('input[name="fax_extension"]');
    expect(input).not.toBeNull();
    expect(input!.tabIndex).toBe(-1);
    expect(input!.autocomplete).toBe("off");
    const container = input!.closest("[aria-hidden='true']");
    expect(container).not.toBeNull();
    expect(container!.hasAttribute("inert")).toBe(true);
    expect(screen.queryByRole("textbox", { name: enMessages.Contact.honeypotLabel })).not.toBeInTheDocument();
  });
});
