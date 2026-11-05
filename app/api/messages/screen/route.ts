import { NextResponse } from "next/server";
import { z } from "zod";
import { screenMessage } from "@/lib/contact-screen";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const Body = z.object({ text: z.string().min(1).max(500) });

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request.headers, "screen"), 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  return NextResponse.json(screenMessage(parsed.data.text));
}
