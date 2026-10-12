/**
 * Reads a request body with a hard byte cap, enforced before the body is
 * fully read. `await request.json()` buffers whatever it is sent (a 12 MB
 * body from an anonymous caller was read in full before any length check),
 * so route handlers that take public input read through this instead.
 *
 * Two layers, because Content-Length is only a claim:
 * 1. A declared Content-Length over the cap is refused without reading.
 * 2. Otherwise (absent or lying, e.g. chunked) the stream is consumed
 *    chunk by chunk and cancelled the moment the cap is crossed.
 */

export type LimitedBody =
  | { ok: true; text: string }
  | { ok: false; status: 400 | 413 | 415; error: string };

export function isJsonContentType(request: Request): boolean {
  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  return type === "application/json";
}

export async function readLimitedBody(
  request: Request,
  maxBytes: number,
): Promise<LimitedBody> {
  const tooLarge: LimitedBody = {
    ok: false,
    status: 413,
    error: "Request body too large",
  };

  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isFinite(length) || length < 0) {
      return { ok: false, status: 400, error: "Invalid Content-Length" };
    }
    if (length > maxBytes) return tooLarge;
  }

  if (!request.body) return { ok: true, text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return tooLarge;
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: "Could not read request body" };
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, text: new TextDecoder().decode(bytes) };
}
