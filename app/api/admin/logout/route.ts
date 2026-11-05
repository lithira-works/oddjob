import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookie } from "@/lib/admin-crypto";
import { readJson } from "@/lib/request-guard";

export async function POST(request: Request) {
  const body = await readJson(request, z.strictObject({}), 64);
  if (!body.ok) return body.response;

  const { name, options } = sessionCookie();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(name, "", { ...options, maxAge: 0 });
  return response;
}
