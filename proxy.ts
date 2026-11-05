import { NextResponse, type NextRequest } from "next/server";

/** Only a real Supabase address is allowed through, so a bad setting can't widen the policy. */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SOURCES = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(SUPABASE_URL)
  ? ` ${SUPABASE_URL} ${SUPABASE_URL.replace("https://", "wss://")}`
  : "";

/**
 * Sets a per-request Content Security Policy. The other security headers, which never change
 * per request, are in next.config.ts so they also cover pictures and static files.
 * Scripts need the nonce. Styles allow inline because React style attributes and the
 * animation library set them. See docs/SECURITY.md.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    "font-src 'self'",
    `connect-src 'self'${SUPABASE_SOURCES}${isDev ? " ws: wss:" : ""}`,
    "frame-src 'none'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|images/|icon.svg|robots.txt).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
