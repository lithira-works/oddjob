import { describe, expect, it } from "vitest";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isSameSite, readJson } from "@/lib/request-guard";
import { validateJob } from "@/lib/validation";

const Schema = z.strictObject({ text: z.string() });
const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://oddjob.example/api/x", { method: "POST", body, headers: { host: "oddjob.example", "content-type": "application/json", ...headers } });

const status = async (request: Request, max?: number) => {
  const result = await readJson(request, Schema, max);
  return result.ok ? 200 : result.response.status;
};

describe("readJson", () => {
  it("accepts a good request and returns its data", async () => {
    const result = await readJson(post('{"text":"hi"}', { origin: "https://oddjob.example" }), Schema);
    expect(result.ok && result.data.text).toBe("hi");
  });
  it("refuses other sites", async () => {
    expect(await status(post('{"text":"hi"}', { origin: "https://evil.example" }))).toBe(403);
    expect(await status(post('{"text":"hi"}', { "sec-fetch-site": "cross-site" }))).toBe(403);
    expect(await status(post('{"text":"hi"}', { origin: "not a url" }))).toBe(403);
  });
  it("refuses anything that isn't JSON, which forms from other sites can't send", async () => {
    expect(await status(post('{"text":"hi"}', { "content-type": "text/plain" }))).toBe(415);
  });
  it("stops reading past the size limit, whatever the sender claims", async () => {
    expect(await status(post(JSON.stringify({ text: "x".repeat(200) }), { "content-length": "9999" }), 100)).toBe(413);
    expect(await status(post(JSON.stringify({ text: "x".repeat(200) })), 100)).toBe(413);
  });
  it("refuses broken JSON and unexpected fields", async () => {
    expect(await status(post("{oops"))).toBe(400);
    expect(await status(post('{"text":"hi","isAdmin":true}'))).toBe(400);
    expect(await status(post('{"__proto__":{"x":1},"text":"hi"}'))).toBe(400);
  });
});

describe("same-site check", () => {
  it("trusts same-site browsers and tools with no origin", () => {
    expect(isSameSite(new Headers({ host: "a.example", origin: "https://a.example" }))).toBe(true);
    expect(isSameSite(new Headers({ host: "a.example" }))).toBe(true);
  });
});

describe("rate limit identity", () => {
  it("ignores forwarded headers nobody vouches for", () => {
    const faked = new Headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "1.2.3.4" });
    expect(clientKey(faked, "s", undefined)).toBe("s:shared");
    expect(clientKey(new Headers({ "x-forwarded-for": "9.9.9.9" }), "s", undefined)).toBe("s:shared");
  });
  it("uses the header the host overwrites", () => {
    expect(clientKey(new Headers({ "x-real-ip": "5.6.7.8" }), "s", "x-real-ip")).toBe("s:5.6.7.8");
  });
  it("still blocks after the limit", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, 1, 1000, 0).allowed).toBe(true);
    expect(rateLimit(key, 1, 1000, 1).allowed).toBe(false);
  });
});

describe("validateJob", () => {
  const good = { words: "Water under the kitchen sink", area: "Nugegoda", when: "Today", trade: "plumber" };
  it("accepts a normal job, and a blank area", () => {
    expect(validateJob(good).ok).toBe(true);
    expect(validateJob({ ...good, area: "", trade: "" }).ok).toBe(true);
  });
  it.each([
    ["too short", { words: "x" }, "words"],
    ["too long", { words: "x".repeat(501) }, "words"],
    ["a phone number", { words: "Leak, call 0712345678" }, "words"],
    ["a control character", { words: "Water\u0000 leak here" }, "words"],
    ["a street address", { area: "12 Galle Road" }, "area"],
    ["a house number and lane", { area: "45/2 Temple Lane" }, "area"],
    ["contact in the area", { area: "0712345678" }, "area"],
    ["an unknown time", { when: "Yesterday" }, "when"],
    ["an unknown trade", { trade: "hacker" }, "trade"],
    ["blocked care work chosen", { trade: "babysitter" }, "trade"],
  ])("refuses %s", (_name, change, field) => {
    const result = validateJob({ ...good, ...change });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toContain(field);
  });
  it("blocks care work described in words, whatever trade was sent", () => {
    expect(validateJob({ ...good, words: "I need a babysitter tonight" }).ok).toBe(false);
  });
  it("refuses extra fields and non-objects", () => {
    expect(validateJob({ ...good, role: "admin" }).ok).toBe(false);
    expect(validateJob(null).ok).toBe(false);
    expect(validateJob("words").ok).toBe(false);
  });
  it("treats script text as plain words, which React then escapes", () => {
    expect(validateJob({ ...good, words: "<script>alert(1)</script>" }).ok).toBe(true);
  });
});
