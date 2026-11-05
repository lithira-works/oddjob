import { NextResponse } from "next/server";
import { z } from "zod";
import { checkLogin, createSession, readAdminConfig, sessionCookie } from "@/lib/admin-crypto";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { readJson } from "@/lib/request-guard";

const Login = z.strictObject({
  email: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(200),
});

const WINDOW = 15 * 60_000;

export async function POST(request: Request) {
  const body = await readJson(request, Login, 2 * 1024);
  if (!body.ok) return body.response;

  // Limits come before the costly password hash. The overall limit also slows attacks from many addresses.
  const visitor = rateLimit(clientKey(request.headers, "admin-login"), 5, WINDOW);
  const overall = rateLimit("admin-login:all", 20, WINDOW);
  if (!visitor.allowed || !overall.allowed) {
    const wait = Math.max(visitor.retryAfterSeconds, overall.retryAfterSeconds);
    return NextResponse.json({ error: "Too many tries" }, { status: 429, headers: { "Retry-After": String(wait) } });
  }

  const config = readAdminConfig();
  const accepted = await checkLogin(body.data.email, body.data.password, config);
  if (!config || !accepted) {
    // Same answer for a wrong email, a wrong password and no account. Never log what was typed.
    console.warn("[admin] login refused");
    return NextResponse.json({ error: "Email or password is wrong" }, { status: 401 });
  }

  console.info("[admin] login accepted");
  const { name, options } = sessionCookie();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(name, createSession(config), options);
  return response;
}
