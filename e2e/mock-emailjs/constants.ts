/**
 * Where the EmailJS stand-in (server.mjs) listens, shared by
 * playwright.config.ts and the specs. The private key is the one the mock
 * insists on, like EmailJS with "Use Private Key" enabled.
 */
export const MOCK_EMAILJS_PORT = 3199;
export const MOCK_EMAILJS_ORIGIN = `http://127.0.0.1:${MOCK_EMAILJS_PORT}`;
export const MOCK_EMAILJS_PRIVATE_KEY = "e2e-private-key";
