import { NextResponse } from "next/server";
import { screenMessage } from "@/lib/contact-screen";
import { FeedbackInput } from "@/lib/feedback";
import { saveFeedback } from "@/lib/feedback-store";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/request-guard";

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request.headers, "feedback"), 5, 10 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  const body = await readJson(request, FeedbackInput);
  if (!body.ok) return body.response;

  try {
    // Phone numbers, emails and links never reach the file, even if someone adds them.
    await saveFeedback({ ...body.data, message: screenMessage(body.data.message).redacted });
  } catch {
    return NextResponse.json({ error: "Could not save" }, { status: 503 });
  }
  return NextResponse.json({ saved: true }, { status: 201 });
}
