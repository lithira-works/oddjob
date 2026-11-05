import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as logout } from "@/app/api/admin/logout/route";
import { checkLogin, createSession, readAdminConfig, sessionCookie, SESSION_SECONDS, verifySession, type AdminConfig } from "@/lib/admin-crypto";
import { readFeedback } from "@/lib/feedback-store";

const folder = mkdtempSync(path.join(tmpdir(), "oddjob-admin-"));
afterAll(() => rmSync(folder, { recursive: true, force: true }));

/** Runs the real script, so a change to its hash format can't drift away from the login check. */
function createAccount(email: string, file: string) {
  const result = spawnSync(process.execPath, ["scripts/admin-create.mjs", email, file], { encoding: "utf8" });
  const env = Object.fromEntries(
    readFileSync(file, "utf8").split("\n").filter((line) => line.startsWith("ADMIN_")).map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at), line.slice(at + 1)];
    }),
  ) as { ADMIN_EMAIL: string; ADMIN_PASSWORD_HASH: string; ADMIN_SESSION_SECRET: string };
  return { password: /Password: (\S+)/.exec(result.stdout)![1]!, env, stdout: result.stdout };
}

const envFile = path.join(folder, ".env.local");
writeFileSync(envFile, "NEXT_PUBLIC_CURRENCY=LKR\nADMIN_EMAIL=old@example.com\n");
const account = createAccount("Owner@Example.com", envFile);
const config = readAdminConfig(account.env) as AdminConfig;

describe("admin:create", () => {
  it("keeps other settings and replaces an old account", () => {
    const text = readFileSync(envFile, "utf8");
    expect(text).toContain("NEXT_PUBLIC_CURRENCY=LKR");
    expect(text).not.toContain("old@example.com");
    expect(text.match(/^ADMIN_EMAIL=/gm)).toHaveLength(1);
  });

  it("saves only a hash, never the password", () => {
    expect(readFileSync(envFile, "utf8")).not.toContain(account.password);
    expect(account.password.length).toBeGreaterThanOrEqual(24);
    expect(account.env.ADMIN_PASSWORD_HASH).not.toContain("$");
  });

  it("refuses a value that isn't an email", () => {
    const result = spawnSync(process.execPath, ["scripts/admin-create.mjs", "nobody", path.join(folder, "unused")], { encoding: "utf8" });
    expect(result.status).toBe(1);
  });
});

describe("readAdminConfig", () => {
  it("means no admin when anything is missing or weak", () => {
    expect(config).not.toBeNull();
    expect(readAdminConfig({})).toBeNull();
    expect(readAdminConfig({ ...account.env, ADMIN_EMAIL: "" })).toBeNull();
    expect(readAdminConfig({ ...account.env, ADMIN_SESSION_SECRET: "short" })).toBeNull();
    expect(readAdminConfig({ ...account.env, ADMIN_PASSWORD_HASH: "plain-password" })).toBeNull();
    expect(readAdminConfig({ ...account.env, ADMIN_PASSWORD_HASH: account.env.ADMIN_PASSWORD_HASH.replace("131072", "2") })).toBeNull();
  });
});

describe("checkLogin", () => {
  it("accepts only the right email and password", async () => {
    expect(await checkLogin("owner@example.com", account.password, config)).toBe(true);
    expect(await checkLogin("owner@example.com", `${account.password}x`, config)).toBe(false);
    expect(await checkLogin("someone@example.com", account.password, config)).toBe(false);
    expect(await checkLogin("owner@example.com", account.password, null)).toBe(false);
    expect(await checkLogin("", "", null)).toBe(false);
  });
});

describe("sessions", () => {
  const now = 1_800_000_000_000;

  it("accepts its own token until it expires", () => {
    const token = createSession(config, now);
    expect(verifySession(token, config, now)).toBe(true);
    expect(verifySession(token, config, now + SESSION_SECONDS * 1000 - 1)).toBe(true);
    expect(verifySession(token, config, now + SESSION_SECONDS * 1000)).toBe(false);
  });

  it("refuses edited, forged and malformed tokens", () => {
    const token = createSession(config, now);
    const [expires, nonce, signature] = token.split(".");
    expect(verifySession(`${Number(expires) + 1000}.${nonce}.${signature}`, config, now)).toBe(false);
    expect(verifySession(`${expires}.${nonce}.${"A".repeat(43)}`, config, now)).toBe(false);
    expect(verifySession("", config, now)).toBe(false);
    expect(verifySession("admin=true", config, now)).toBe(false);
  });

  it("is logged out by a new password or a new secret", () => {
    const token = createSession(config, now);
    expect(verifySession(token, { ...config, passwordHash: `${config.passwordHash}x` }, now)).toBe(false);
    expect(verifySession(token, { ...config, sessionSecret: "z".repeat(40) }, now)).toBe(false);
  });

  it("uses a locked-down cookie on the live site", () => {
    const { name, options } = sessionCookie(true);
    expect(name.startsWith("__Host-")).toBe(true);
    expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: "strict", path: "/" });
    expect(options.maxAge).toBe(SESSION_SECONDS);
  });
});

describe("login route", () => {
  const send = (body: unknown, headers: Record<string, string> = {}) =>
    login(new Request("https://oddjob.example/api/admin/login", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { host: "oddjob.example", origin: "https://oddjob.example", "content-type": "application/json", ...headers },
    }));

  it("runs its checks in order, then rate limits", async () => {
    for (const [name, value] of Object.entries(account.env)) vi.stubEnv(name, value);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    const good = { email: "owner@example.com", password: account.password };

    expect((await send(good, { origin: "https://evil.example" })).status).toBe(403);
    expect((await send({ ...good, isAdmin: true })).status).toBe(400);

    const wrong = await send({ ...good, password: "wrong" });
    expect(wrong.status).toBe(401);
    expect(wrong.headers.get("set-cookie")).toBeNull();

    const noUser = await send({ ...good, email: "other@example.com" });
    expect(await noUser.json()).toEqual(await (await send({ ...good, password: "nope" })).json());

    const ok = await send(good);
    expect(ok.status).toBe(200);
    const cookie = ok.headers.get("set-cookie")!;
    expect(cookie).toContain("HttpOnly");
    expect(cookie.toLowerCase()).toContain("samesite=strict");
    expect(cookie).not.toContain(account.password);

    await send(good);
    const blocked = await send(good);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("set-cookie")).toBeNull();

    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
});

describe("logout route", () => {
  it("clears the cookie, but not for another site", async () => {
    const send = (origin: string) => logout(new Request("https://oddjob.example/api/admin/logout", {
      method: "POST",
      body: "{}",
      headers: { host: "oddjob.example", origin, "content-type": "application/json" },
    }));
    expect((await send("https://evil.example")).status).toBe(403);
    const response = await send("https://oddjob.example");
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

describe("readFeedback", () => {
  it("is empty with no file", async () => {
    expect(await readFeedback(path.join(folder, "missing"))).toEqual([]);
  });

  it("gives newest first and skips damaged lines", async () => {
    const lines = [
      '{"at":"2026-11-01T10:00:00.000Z","kind":"idea","message":"first"}',
      "not json",
      '{"at":"yesterday","kind":"idea","message":"bad date"}',
      '{"at":"2026-11-02T10:00:00.000Z","kind":"nope","message":"bad kind"}',
      '{"at":"2026-11-03T10:00:00.000Z","kind":"problem","message":"<script>x</script>"}',
    ];
    writeFileSync(path.join(folder, "feedback.jsonl"), `${lines.join("\n")}\n`);
    const notes = await readFeedback(folder);
    expect(notes.map((n) => n.message)).toEqual(["<script>x</script>", "first"]);
  });
});
