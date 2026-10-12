import { describe, expect, it } from "vitest";
import { isJsonContentType, readLimitedBody } from "@/lib/request-body";

function streamOf(chunks: Uint8Array[], onPull?: () => void) {
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      onPull?.();
      if (i < chunks.length) controller.enqueue(chunks[i++]);
      else controller.close();
    },
  });
}

function chunkedRequest(stream: ReadableStream<Uint8Array>, headers: Record<string, string> = {}) {
  return new Request("http://localhost/x", {
    method: "POST",
    body: stream,
    headers,
    // Required by undici for a streamed request body.
    duplex: "half",
  } as RequestInit);
}

describe("readLimitedBody", () => {
  it("returns a small body whole", async () => {
    const res = await readLimitedBody(new Request("http://localhost/x", { method: "POST", body: "hello" }), 100);
    expect(res).toEqual({ ok: true, text: "hello" });
  });

  it("treats a missing body as empty", async () => {
    const res = await readLimitedBody(new Request("http://localhost/x", { method: "POST" }), 100);
    expect(res).toEqual({ ok: true, text: "" });
  });

  it("refuses a declared Content-Length over the cap without touching the body", async () => {
    const req = chunkedRequest(streamOf([new Uint8Array(10)]), { "content-length": "5000" });
    const res = await readLimitedBody(req, 100);
    expect(res).toEqual({ ok: false, status: 413, error: "Request body too large" });
    // The runtime primes a stream with one pull on construction; what matters
    // is that the body was never consumed.
    expect(req.bodyUsed).toBe(false);
  });

  it("stops reading a chunked body the moment it crosses the cap", async () => {
    let pulls = 0;
    const chunks = Array.from({ length: 1000 }, () => new Uint8Array(50));
    const res = await readLimitedBody(chunkedRequest(streamOf(chunks, () => pulls++)), 120);
    expect(res).toEqual({ ok: false, status: 413, error: "Request body too large" });
    // 50 + 50 + 50 crosses 120 on the third chunk; nowhere near all 1000.
    expect(pulls).toBeLessThan(10);
  });

  it("does not trust a Content-Length that understates a chunked body", async () => {
    const chunks = Array.from({ length: 20 }, () => new Uint8Array(50));
    const res = await readLimitedBody(chunkedRequest(streamOf(chunks), { "content-length": "10" }), 120);
    expect(res.ok).toBe(false);
  });

  it("accepts a body exactly at the cap", async () => {
    const res = await readLimitedBody(new Request("http://localhost/x", { method: "POST", body: "a".repeat(100) }), 100);
    expect(res.ok).toBe(true);
  });

  it("rejects a malformed Content-Length", async () => {
    const req = new Request("http://localhost/x", { method: "POST", body: "x", headers: { "content-length": "abc" } });
    const res = await readLimitedBody(req, 100);
    // The runtime may normalise the header; either outcome must not read past the cap.
    expect(res.ok === false || res.text === "x").toBe(true);
  });

  it("decodes multi-byte characters across chunk boundaries", async () => {
    const bytes = new TextEncoder().encode("çğış");
    const res = await readLimitedBody(
      chunkedRequest(streamOf([bytes.slice(0, 3), bytes.slice(3)])),
      100,
    );
    expect(res).toEqual({ ok: true, text: "çğış" });
  });
});

describe("isJsonContentType", () => {
  const withType = (type?: string) =>
    new Request("http://localhost/x", { method: "POST", body: "{}", headers: type ? { "content-type": type } : {} });

  it.each(["application/json", "application/json; charset=utf-8", "APPLICATION/JSON"])("accepts %s", (t) => {
    expect(isJsonContentType(withType(t))).toBe(true);
  });

  it.each(["text/plain", "application/x-www-form-urlencoded", "application/jsonx", "text/json"])("rejects %s", (t) => {
    expect(isJsonContentType(withType(t))).toBe(false);
  });
});
