import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

const { sendFormMock } = vi.hoisted(() => ({ sendFormMock: vi.fn() }));
vi.mock("@emailjs/browser", () => ({
  default: { sendForm: sendFormMock },
  EmailJSResponseStatus: class MockEmailJSResponseStatus extends Error {},
}));

// Cloudflare's real widget cannot render in jsdom/automation (see the audit's
// flakiness notes), so it is replaced with a button that triggers onSuccess
// directly -- enough to drive the captchaReady state the matrix below tests.
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: forwardRef(function MockTurnstile(
    props: { onSuccess?: (token: string) => void },
    ref,
  ) {
    useImperativeHandle(ref, () => ({ reset: () => {} }));
    return (
      <button type="button" onClick={() => props.onSuccess?.("fake-token")}>
        complete captcha
      </button>
    );
  }),
}));

type ConfigOptions = { emailjsConfigured: boolean; turnstileConfigured: boolean };

/**
 * @/lib/emailjs and @/lib/turnstile each export a module-level const computed
 * once from env vars at import time, mirroring sanityConfigured in
 * src/sanity/fetch.ts. The only reliable way to flip them between tests is a
 * fresh module graph per test: resetModules + doMock + dynamic import of the
 * component itself, not just the two libs.
 */
async function loadContact({ emailjsConfigured, turnstileConfigured }: ConfigOptions) {
  vi.doMock("@/lib/emailjs", () => ({
    emailjsConfig: { serviceId: "svc", templateId: "tpl", publicKey: "pub" },
    emailjsMissing: emailjsConfigured ? [] : ["NEXT_PUBLIC_EMAILJS_SERVICE_ID"],
    emailjsConfigured,
    reportEmailjsMissing: vi.fn(),
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

beforeEach(() => {
  vi.resetModules();
  sendFormMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Contact: four-state configuration matrix", () => {
  it("state A (neither configured, non-production): both dev banners show, submit stays disabled", async () => {
    await renderContact({ emailjsConfigured: false, turnstileConfigured: false });

    submitButtons().forEach((btn) => expect(btn).toBeDisabled());
    expect(screen.getByText(/Contact form disabled/)).toBeInTheDocument();
    expect(screen.getByText(/Turnstile disabled/)).toBeInTheDocument();
  });

  it("state A in production: neither dev banner renders, even though nothing is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await renderContact({ emailjsConfigured: false, turnstileConfigured: false });

    expect(screen.queryByText(/Contact form disabled/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Turnstile disabled/)).not.toBeInTheDocument();
    submitButtons().forEach((btn) => expect(btn).toBeDisabled());
  });

  it("state B (EmailJS unconfigured, Turnstile configured): EmailJS banner shows, the widget renders instead of its banner, submit disabled", async () => {
    await renderContact({ emailjsConfigured: false, turnstileConfigured: true });

    expect(screen.getByText(/Contact form disabled/)).toBeInTheDocument();
    expect(screen.queryByText(/Turnstile disabled/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "complete captcha" })).toBeInTheDocument();
    submitButtons().forEach((btn) => expect(btn).toBeDisabled());
  });

  it("state C (EmailJS configured, Turnstile unconfigured): submit is enabled with no captcha interaction needed", async () => {
    await renderContact({ emailjsConfigured: true, turnstileConfigured: false });

    expect(screen.queryByText(/Contact form disabled/)).not.toBeInTheDocument();
    expect(screen.getByText(/Turnstile disabled/)).toBeInTheDocument();
    submitButtons().forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it("state D (both configured): submit starts disabled and becomes enabled once the captcha completes", async () => {
    await renderContact({ emailjsConfigured: true, turnstileConfigured: true });

    expect(screen.queryByText(/Contact form disabled/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Turnstile disabled/)).not.toBeInTheDocument();
    submitButtons().forEach((btn) => expect(btn).toBeDisabled());

    fireEvent.click(screen.getByRole("button", { name: "complete captcha" }));

    await waitFor(() => submitButtons().forEach((btn) => expect(btn).not.toBeDisabled()));
  });
});

describe("Contact: client-side validation", () => {
  it("submitting the empty form shows required-field errors and never calls emailjs.sendForm", async () => {
    // State C: submit is enabled without any captcha interaction, so this
    // isolates validate() itself rather than the configuration matrix above.
    await renderContact({ emailjsConfigured: true, turnstileConfigured: false });

    fireEvent.click(submitButtons()[0]);

    const errors = await waitFor(() => screen.getAllByText("This field is required."));
    expect(errors).toHaveLength(4); // name, email, subject, message
    expect(sendFormMock).not.toHaveBeenCalled();
  });
});
