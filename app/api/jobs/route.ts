import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/request-guard";
import { validateJob } from "@/lib/validation";

/** Checks a job card. It saves nothing yet: the database insert goes here once accounts exist. */
export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request.headers, "jobs"), 30, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
  }
  const body = await readJson(request, z.unknown());
  if (!body.ok) return body.response;

  const result = validateJob(body.data);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 422 });
  return NextResponse.json({ valid: true, saved: false });
}
