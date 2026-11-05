// Creates the admin account, or replaces it and logs out every browser.
// Usage: npm run admin:create -- your-email
// The password is generated here and shown once. Only its scrypt hash is saved.
import { randomBytes, scrypt } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const [email, envFile = ".env.local"] = process.argv.slice(2);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("That isn't an email address. Use your real one, like this:\n  npm run admin:create -- name@example.com");
  process.exit(1);
}

const N = 2 ** 17;
const r = 8;
const p = 1;
const password = randomBytes(18).toString("base64url");
const salt = randomBytes(16);
const key = await promisify(scrypt)(password.normalize("NFKC"), salt, 32, { N, r, p, maxmem: 256 * N * r * p });

const values = {
  ADMIN_EMAIL: email,
  ADMIN_PASSWORD_HASH: `scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${key.toString("base64url")}`,
  ADMIN_SESSION_SECRET: randomBytes(32).toString("base64url"),
};

const existing = await readFile(envFile, "utf8").catch((error) => {
  if (error.code === "ENOENT") return "";
  throw error;
});
const kept = existing.split(/\r?\n/).filter((line) => !/^ADMIN_(EMAIL|PASSWORD_HASH|SESSION_SECRET)=/.test(line));
while (kept.length > 0 && kept.at(-1).trim() === "") kept.pop();
const lines = Object.entries(values).map(([name, value]) => `${name}=${value}`);
await writeFile(envFile, `${[...kept, "", ...lines].join("\n").trimStart()}\n`, { mode: 0o600 });

console.log(`
Admin account saved to ${envFile}.

  Email:    ${email}
  Password: ${password}

Save this password in a password manager now. It won't be shown again.
Restart the server, then log in at /admin.
Lost it? Run this command again to replace it.
`);
