import { NextResponse } from "next/server";
import type { z } from "zod";

const refuse = (error: string, status: number) => ({ ok: false as const, response: NextResponse.json({ error }, { status }) });

/** Blocks other sites from posting through a visitor's browser. Tools with no Origin still pass the other checks. */
export function isSameSite(headers: Headers) {
  if (headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (headers.get("x-forwarded-host") ?? headers.get("host"));
  } catch {
    return false;
  }
}

/** Reads no further than the limit, even when the sender lies about the length. */
async function readLimited(request: Request, maxBytes: number) {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** The front door for every API route: same site, JSON only, size limit, then the schema. */
export async function readJson<S extends z.ZodType>(request: Request, schema: S, maxBytes = 8 * 1024) {
  if (!isSameSite(request.headers)) return refuse("Not allowed", 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return refuse("Send JSON", 415);
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes) return refuse("Too large", 413);

  const text = await readLimited(request, maxBytes);
  if (text === null) return refuse("Too large", 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return refuse("Invalid request", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return refuse("Invalid request", 400);
  return { ok: true as const, data: parsed.data as z.infer<S> };
}
