import { NextResponse } from "next/server";
import { FeedbackInput } from "@/lib/feedback";
import { saveFeedback } from "@/lib/feedback-store";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const sameSite = (headers: Headers) => {
  const origin = headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (headers.get("x-forwarded-host") ?? headers.get("host"));
  } catch {
    return false;
  }
};

export async function POST(request: Request) {
  if (!sameSite(request.headers)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const limit = rateLimit(clientKey(request.headers, "feedback"), 5, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }

  const parsed = FeedbackInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });

  try {
    await saveFeedback(parsed.data);
  } catch {
    return NextResponse.json({ error: "Could not save" }, { status: 503 });
  }
  return NextResponse.json({ saved: true }, { status: 201 });
}
