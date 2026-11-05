import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readAdminConfig, sessionCookie, verifySession } from "./admin-crypto";

export async function currentAdmin() {
  const config = readAdminConfig();
  if (!config) return null;
  const token = (await cookies()).get(sessionCookie().name)?.value;
  return token && verifySession(token, config) ? { email: config.email } : null;
}

/** Call first in every admin page, before reading any data. */
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
