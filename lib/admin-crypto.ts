import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/** A short session limits the damage from a forgotten browser or a stolen cookie. */
export const SESSION_SECONDS = 4 * 60 * 60;

export type AdminConfig = { email: string; passwordHash: string; sessionSecret: string };

type Hash = { N: number; r: number; p: number; salt: Buffer; key: Buffer };

/** Format: scrypt:N:r:p:salt:key, base64url. It has no $ because Next expands $ in .env files. */
function parseHash(value: string): Hash | null {
  const match = /^scrypt:(\d+):(\d+):(\d+):([\w-]{16,}):([\w-]{32,})$/.exec(value);
  if (!match) return null;
  const [, cost, block, parallel, salt, key] = match as unknown as [string, string, string, string, string, string];
  const [N, r, p] = [Number(cost), Number(block), Number(parallel)];
  if (N < 2 ** 15 || N > 2 ** 20 || (N & (N - 1)) !== 0 || r < 8 || r > 32 || p < 1 || p > 4) return null;
  return { N, r, p, salt: Buffer.from(salt, "base64url"), key: Buffer.from(key, "base64url") };
}

function derive(password: string, hash: Hash) {
  return new Promise<Buffer>((resolve, reject) => {
    const options = { N: hash.N, r: hash.r, p: hash.p, maxmem: 256 * hash.N * hash.r * hash.p };
    scrypt(password.normalize("NFKC"), hash.salt, hash.key.length, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

const digest = (value: string) => createHash("sha256").update(value).digest();
const sameText = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));
const normaliseEmail = (email: string) => email.trim().toLowerCase();

/** Reads the account from the server's environment. Anything missing or weak means no admin can log in. */
export function readAdminConfig(env: Record<string, string | undefined> = process.env): AdminConfig | null {
  const email = env.ADMIN_EMAIL?.trim();
  const passwordHash = env.ADMIN_PASSWORD_HASH?.trim();
  const sessionSecret = env.ADMIN_SESSION_SECRET?.trim();
  if (!email?.includes("@") || !passwordHash || !parseHash(passwordHash) || !sessionSecret || sessionSecret.length < 32) return null;
  return { email, passwordHash, sessionSecret };
}

// Same work with no account, or a wrong email, so timing doesn't reveal which part was wrong.
const STAND_IN: Hash = { N: 2 ** 17, r: 8, p: 1, salt: randomBytes(16), key: randomBytes(32) };

export async function checkLogin(email: string, password: string, config: AdminConfig | null) {
  const hash = (config && parseHash(config.passwordHash)) ?? STAND_IN;
  const key = await derive(password, hash);
  const passwordOk = timingSafeEqual(key, hash.key);
  const emailOk = sameText(normaliseEmail(email), normaliseEmail(config?.email ?? ""));
  return Boolean(config) && passwordOk && emailOk;
}

/** The signing key depends on the account, so a new password logs out every browser. */
const sign = (body: string, config: AdminConfig) => {
  const key = createHmac("sha256", config.sessionSecret).update(`${config.email}\n${config.passwordHash}`).digest();
  return createHmac("sha256", key).update(body).digest("base64url");
};

export function createSession(config: AdminConfig, now = Date.now()) {
  const body = `${now + SESSION_SECONDS * 1000}.${randomBytes(16).toString("base64url")}`;
  return `${body}.${sign(body, config)}`;
}

export function verifySession(token: string, config: AdminConfig, now = Date.now()) {
  const match = /^((\d{13})\.[\w-]{22})\.([\w-]{43})$/.exec(token);
  if (!match) return false;
  const [, body, expiry, signature] = match as unknown as [string, string, string, string];
  const expires = Number(expiry);
  return expires > now && expires <= now + SESSION_SECONDS * 1000 && sameText(signature, sign(body, config));
}

/** __Host- makes the browser refuse this cookie unless it's Secure, on this exact host, for the whole site. */
export function sessionCookie(production = process.env.NODE_ENV === "production") {
  return {
    name: production ? "__Host-oddjob-admin" : "oddjob-admin",
    options: { httpOnly: true, secure: production, sameSite: "strict" as const, path: "/", maxAge: SESSION_SECONDS },
  };
}
