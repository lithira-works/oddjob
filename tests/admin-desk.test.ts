import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { addCredits, draftCount, EMPTY_DRAFTS, merged, parseStored, refundLead, removeRecords, saveRecord, toggleHandled } from "@/lib/admin/drafts";
import { can } from "@/lib/admin/roles";
import { checkAd, checkDeal, checkJob, checkTeam, checkTrade, checkWorker } from "@/lib/admin/rules";
import { balanceOf } from "@/lib/credits";
import { sampleLedger } from "@/lib/data/admin-ledgers";

const AT = "2026-11-05T10:00:00.000Z";
const seed = [{ id: "a", v: 1 }, { id: "b", v: 2 }];

describe("every admin page", () => {
  const pages = (folder: string): string[] => readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) return entry.name === "login" ? [] : pages(full);
    return entry.name === "page.tsx" || entry.name === "layout.tsx" ? [full] : [];
  });
  const desk = pages(path.join("app", "admin", "(desk)"));

  it("exists for each tab", () => {
    expect(desk.length).toBeGreaterThanOrEqual(15);
  });

  it.each(desk)("%s checks the admin before reading data", (file) => {
    const text = readFileSync(file, "utf8");
    const guard = text.indexOf("await requireAdmin()");
    expect(guard).toBeGreaterThan(-1);
    for (const read of ["readFeedback()", "siteStatus()", "process.env"]) {
      const at = text.indexOf(read);
      if (at > -1) expect(at).toBeGreaterThan(guard);
    }
  });
});

describe("drafts", () => {
  it("adds, changes and deletes on top of the seed without touching it", () => {
    let state = saveRecord(EMPTY_DRAFTS, "jobs", { id: "c", v: 3 }, true, AT);
    state = saveRecord(state, "jobs", { id: "a", v: 9 }, false, AT);
    state = removeRecords(state, "jobs", ["b"], new Set(["a", "b"]), AT);
    expect(merged(seed, state.changes.jobs)).toEqual([{ id: "c", v: 3 }, { id: "a", v: 9 }]);
    expect(seed).toEqual([{ id: "a", v: 1 }, { id: "b", v: 2 }]);
  });

  it("leaves no trace of a draft-only record once deleted", () => {
    let state = saveRecord(EMPTY_DRAFTS, "jobs", { id: "c" }, true, AT);
    state = removeRecords(state, "jobs", ["c"], new Set(["a", "b"]), AT);
    expect(draftCount(state)).toBe(0);
  });

  it("logs ids only, never the words in a record", () => {
    const state = saveRecord(EMPTY_DRAFTS, "jobs", { id: "j-1", words: "Water under the sink at my house" }, true, AT);
    expect(JSON.stringify(state.log)).not.toContain("Water");
    expect(state.log[0]).toMatchObject({ ref: "j-1", did: "Created" });
  });

  it("doesn't count a handled mark as a change to data", () => {
    expect(draftCount(toggleHandled(EMPTY_DRAFTS, AT))).toBe(0);
    expect(toggleHandled(toggleHandled(EMPTY_DRAFTS, AT), AT).handled).toEqual([]);
  });

  it("starts clean from bad browser storage", () => {
    for (const bad of [null, "", "not json", '{"role":"owner"}', '{"changes":{"users":{}}}', "[]", '{"ledgers":{"a":[{"amount":"99"}]}}']) {
      expect(parseStored(bad).role).toBe("admin");
      expect(draftCount(parseStored(bad))).toBe(0);
    }
  });

  it("reads back what it stored", () => {
    const state = saveRecord(EMPTY_DRAFTS, "deals", { id: "o-1", amount: "Free" }, false, AT);
    expect(parseStored(JSON.stringify(state))).toEqual(state);
  });
});

describe("credits on the desk", () => {
  const base = sampleLedger("amal-f", "plumber");

  it("can't add twice with one key", () => {
    const once = addCredits(EMPTY_DRAFTS, "amal-f", base, "k1", 5, AT);
    const twice = addCredits(once, "amal-f", base, "k1", 5, AT);
    expect(balanceOf(twice.ledgers["amal-f"]!)).toBe(balanceOf(base) + 5);
    expect(twice.log).toHaveLength(1);
  });

  it("refunds a paid job once only, and nothing unpaid", () => {
    const paid = base.find((e) => e.kind === "answer-job")!;
    const once = refundLead(EMPTY_DRAFTS, "amal-f", base, paid.jobId!, AT);
    const twice = refundLead(once, "amal-f", base, paid.jobId!, AT);
    expect(balanceOf(twice.ledgers["amal-f"]!)).toBe(10);
    expect(() => refundLead(EMPTY_DRAFTS, "amal-f", base, "never-paid", AT)).toThrow();
  });
});

describe("roles", () => {
  it("gives admins everything", () => {
    expect(can("admin", "team", "delete")).toBe(true);
    expect(can("admin", "credits", "create")).toBe(true);
  });

  it("keeps managers from money, team, setup and trade deletion", () => {
    expect(can("manager", "credits", "view")).toBe(true);
    expect(can("manager", "credits", "create")).toBe(false);
    expect(can("manager", "team", "view")).toBe(false);
    expect(can("manager", "setup", "view")).toBe(false);
    expect(can("manager", "trades", "delete")).toBe(false);
    expect(can("manager", "jobs", "delete")).toBe(true);
  });
});

describe("form rules", () => {
  const open = ["plumber"];
  const job = { words: "Water under the sink", note: "", tradeSlug: "plumber", area: "Near the temple", when: "Today", cost: "3", status: "Open" };

  it("takes a good job", () => {
    expect(checkJob(job, open).ok).toBe(true);
  });

  it("refuses contact details, addresses, closed trades and care work in a job", () => {
    const errors = (values: object) => {
      const result = checkJob({ ...job, ...values }, open);
      return result.ok ? {} : result.errors;
    };
    expect(errors({ words: "Call me on 0771234567" }).words).toBeDefined();
    expect(errors({ area: "12 Galle Road" }).area).toBeDefined();
    expect(errors({ tradeSlug: "babysitter" }).tradeSlug).toBeDefined();
    expect(errors({ words: "I need a babysitter tonight" }).words).toBeDefined();
    expect(errors({ cost: "0" }).cost).toBeDefined();
  });

  it("gives a new worker no figures from the form", () => {
    const result = checkWorker({ name: "Ana P.", tradeSlug: "plumber", area: "Near the temple", about: "Small leaks.", years: "3", quote: "4000", arrives: "Tomorrow", status: "Listed", booked: "999" } as Record<string, string>, open);
    expect(result.ok && "booked" in result.data).toBe(false);
  });

  it("won't open care work under another name", () => {
    const trade = { name: "family helper", article: "a", service: "", group: "Inside", jobs: "Odd tasks", words: "help", image: "/images/plane.jpg", featured: "No" };
    expect(checkTrade(trade, []).ok).toBe(true);
    expect(checkTrade({ ...trade, name: "babysitter pro" }, []).ok).toBe(false);
    expect(checkTrade({ ...trade, words: "help, nanny" }, []).ok).toBe(false);
    expect(checkTrade({ ...trade, name: "plumber" }, ["plumber"]).ok).toBe(false);
    expect(checkTrade({ ...trade, image: "https://example.com/a.jpg" }, []).ok).toBe(false);
  });

  it("checks that a deal points at something real", () => {
    const deal = { kind: "Offers", amount: "Free", title: "Drain check", terms: "Same visit.", tradeSlug: "plumber", providerSlug: "amal-f", status: "Live" };
    expect(checkDeal(deal, open, ["amal-f"]).ok).toBe(true);
    expect(checkDeal({ ...deal, providerSlug: "nobody" }, open, ["amal-f"]).ok).toBe(false);
    expect(checkDeal({ ...deal, amount: "An amount far too long" }, open, ["amal-f"]).ok).toBe(false);
  });

  it("holds ads to the same rules as the public banner", () => {
    const ad = { slot: "home-top", advertiser: "Hardware shop", href: "https://example.com", image: "/ads/a.jpg", imagePhone: "/ads/b.jpg", alt: "A shelf of paint tins", from: "2026-12-01", until: "2026-12-31" };
    expect(checkAd(ad, []).ok).toBe(true);
    expect(checkAd({ ...ad, href: "http://example.com" }, []).ok).toBe(false);
    expect(checkAd({ ...ad, href: "javascript:alert(1)" }, []).ok).toBe(false);
    expect(checkAd({ ...ad, image: "https://evil.example/a.jpg" }, []).ok).toBe(false);
    expect(checkAd({ ...ad, image: "/ads/../secret" }, []).ok).toBe(false);
    expect(checkAd({ ...ad, until: "2026-11-01" }, []).ok).toBe(false);
    expect(checkAd({ ...ad, advertiser: "Best babysitter agency" }, []).ok).toBe(false);
    expect(checkAd(ad, [{ slot: "home-top", from: "2026-12-15", until: "2027-01-15" }]).ok).toBe(false);
    expect(checkAd(ad, [{ slot: "jobs", from: "2026-12-15", until: "2027-01-15" }]).ok).toBe(true);
  });

  it("wants a real email for a manager", () => {
    expect(checkTeam({ name: "Sam", email: "sam@example.com", role: "manager" }).ok).toBe(true);
    expect(checkTeam({ name: "Sam", email: "sam", role: "manager" }).ok).toBe(false);
    expect(checkTeam({ name: "Sam", email: "sam@example.com", role: "owner" }).ok).toBe(false);
  });
});
