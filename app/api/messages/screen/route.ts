import { NextResponse } from "next/server";
import { z } from "zod";
import { screenMessage } from "@/lib/contact-screen";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/request-guard";
import { safeText } from "@/lib/validation";

const Body = z.strictObject({ text: safeText(1, 500) });

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request.headers, "screen"), 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  const body = await readJson(request, Body);
  if (!body.ok) return body.response;
  return NextResponse.json(screenMessage(body.data.text));
}
