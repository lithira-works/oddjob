import { describe, expect, it } from "vitest";
import { scanFile } from "../scripts/privacy-check.mjs";

// Fake values are split up so this file never holds anything shaped like a real secret.
const rules = (path, content) => scanFile(path, content).map((p) => p.rule);

describe("forbidden files", () => {
  it.each([
    ".env",
    ".env.local",
    "app/.env.production",
    "server.pem",
    "keys/id_rsa",
    "credentials.json",
    "gcp-service-account.json",
    "backup.dump",
    "customers.csv",
    "uploads/nic-scan.pdf",
    "logs/server.txt",
  ])("%s", (path) => {
    expect(rules(path, "").some((r) => r.startsWith("forbidden file"))).toBe(true);
  });

  it("allows .env.example and normal files", () => {
    expect(rules(".env.example", "ANTHROPIC_API_KEY=\n")).toEqual([]);
    expect(rules("public/images/leak.jpg", "")).toEqual([]);
  });
});

describe("Supabase keys", () => {
  it("catches a secret key, but not the publishable one", () => {
    expect(rules("lib/x.ts", `const k = "${"sb_" + "secret_"}${"a".repeat(24)}";`)).toContain("secret: Supabase secret key");
    expect(rules("lib/x.ts", `const k = "${"sb_" + "publishable_"}${"a".repeat(24)}";`)).toEqual([]);
  });
});

describe("secrets", () => {
  it.each([
    ["Anthropic", "key = " + "sk-" + "ant-" + "a".repeat(30)],
    ["GitHub", "gh" + "p_" + "a".repeat(36)],
    ["AWS", "AK" + "IA" + "ABCDEFGHIJKLMNOP"],
    ["private key", "-----BEGIN RSA " + "PRIVATE KEY-----"],
    ["database URL", "postgres://admin:" + "hunter2pass" + "@db.host/app"],
    ["assignment", 'const password = "' + "correcthorsebattery" + '"'],
  ])("%s", (_name, line) => {
    expect(rules("lib/config.ts", line).some((r) => r.startsWith("secret"))).toBe(true);
  });

  it("requires empty secret values in .env.example", () => {
    expect(rules(".env.example", "SUPABASE_SERVICE_ROLE_KEY=abc123")).toContain("secret: .env.example must leave secret values empty");
    expect(rules(".env.example", "NEXT_PUBLIC_CURRENCY=LKR")).toEqual([]);
  });

  it("blocks server-only values exposed to the browser", () => {
    expect(rules("lib/a.ts", "process.env.NEXT_PUBLIC_" + "SERVICE_ROLE_KEY")).toContain("secret: server-only value exposed through NEXT_PUBLIC_");
    expect(rules("lib/a.ts", "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY")).toEqual([]);
  });

  it("reads secrets from the environment without complaint", () => {
    expect(rules("lib/a.ts", "const key = process.env.ANTHROPIC_API_KEY;")).toEqual([]);
  });
});

describe("personal data", () => {
  it.each([
    ["email", "contact " + "someone" + "@gmail.com"],
    ["phone", "Call " + "077 123 4567"],
    ["international phone", "+94" + " 77 123 4567"],
    ["old national ID", "NIC " + "912345678" + "V"],
    ["new national ID", "NIC " + "199912345678"],
    ["local folder", "C:\\Users\\" + "someone" + "\\Desktop"],
  ])("%s", (_name, line) => {
    expect(rules("docs/note.md", line).some((r) => r.startsWith("personal data"))).toBe(true);
  });

  it("allows placeholders and sample data in tests", () => {
    expect(rules("docs/note.md", "mail sam@example.com")).toEqual([]);
    expect(rules("docs/note.md", "1234@users.noreply.github.com")).toEqual([]);
    expect(rules("tests/contact-screen.test.ts", "Call " + "077 123 4567")).toEqual([]);
  });

  it("ignores ordinary numbers", () => {
    expect(rules("docs/note.md", "Costs LKR 4,500 and took 2 hours in 2026.")).toEqual([]);
  });
});

describe("logging", () => {
  it("blocks logging personal fields", () => {
    expect(rules("app/api/a.ts", "console.log(message)")).toContain("logging: this may write personal data to logs");
    expect(rules("lib/a.ts", "console.error(request.body)")).toContain("logging: this may write personal data to logs");
  });
  it("allows fixed text and status codes", () => {
    expect(rules("app/api/a.ts", 'console.error("request failed:", error.status)')).toEqual([]);
  });
});

it("honours the ignore comment", () => {
  expect(rules("docs/note.md", "Call " + "077 123 4567" + " <!-- privacy-check-ignore -->")).toEqual([]);
});
