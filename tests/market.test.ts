import { describe, expect, it } from "vitest";
import { adFor, isSafeAd, type Ad } from "@/lib/data/ads";
import { boardJobs } from "@/lib/data/jobs";
import { offers } from "@/lib/data/offers";
import { providerBySlug, providers } from "@/lib/data/providers";
import { tradeBySlug, trades } from "@/lib/data/trades";
import { TRADE_ICONS } from "@/lib/trade-icons";
import { countByTrade, filterJobs, filterWorkers, marketHref, parseSort, parseWhen } from "@/lib/market";

describe("jobs board", () => {
  it("filters by category and by when", () => {
    expect(filterJobs({ trade: "plumber" }).every((job) => job.tradeSlug === "plumber")).toBe(true);
    expect(filterJobs({ when: "Today" }).every((job) => job.when === "Today")).toBe(true);
    expect(filterJobs({ trade: "plumber" }).length).toBeGreaterThan(0);
  });

  it("searches the words, the note and the trade name", () => {
    expect(filterJobs({ search: "SINK" }).map((job) => job.id)).toContain("j-1048");
    expect(filterJobs({ search: "bucket" }).map((job) => job.id)).toContain("j-1048");
    expect(filterJobs({ search: "plumber" }).map((job) => job.id)).toContain("j-1048");
    expect(filterJobs({ search: "no such job" })).toEqual([]);
  });

  it("never lists care work while it is blocked", () => {
    for (const job of boardJobs) expect(tradeBySlug(job.tradeSlug)?.gated).toBeFalsy();
  });
});

describe("workers list", () => {
  it("sorts nearest first by default", () => {
    const km = filterWorkers({}).map((worker) => Number.parseFloat(worker.area));
    expect(km).toEqual([...km].sort((a, b) => a - b));
  });

  it("sorts by jobs booked and by fewest redone", () => {
    expect(filterWorkers({ sort: "booked" })[0]?.slug).toBe("amal-f");
    expect(filterWorkers({ sort: "redone" })[0]?.redone).toBe(0);
  });

  it("keeps only people who can come today", () => {
    const today = filterWorkers({ today: true });
    expect(today.length).toBeGreaterThan(0);
    expect(today.every((worker) => worker.arrives.startsWith("Today"))).toBe(true);
  });

  it("never lists care workers while care work is blocked", () => {
    for (const worker of providers) expect(tradeBySlug(worker.tradeSlug)?.gated).toBeFalsy();
  });
});

describe("filter helpers", () => {
  it("counts listings by trade", () => {
    expect(countByTrade([{ tradeSlug: "a" }, { tradeSlug: "a" }, { tradeSlug: "b" }])).toEqual({ a: 2, b: 1 });
  });

  it("builds addresses and leaves out empty settings", () => {
    expect(marketHref("/jobs", {})).toBe("/jobs");
    expect(marketHref("/jobs", { trade: "plumber", when: undefined })).toBe("/jobs?trade=plumber");
    expect(marketHref("/jobs", { when: "This week" })).toBe("/jobs?when=This+week");
  });

  it("ignores settings it does not know", () => {
    expect(parseWhen("Yesterday")).toBeUndefined();
    expect(parseWhen("Today")).toBe("Today");
    expect(parseSort("<script>")).toBe("nearest");
    expect(parseSort("booked")).toBe("booked");
  });
});

describe("category icons", () => {
  it("cover every trade", () => {
    for (const trade of trades) expect(TRADE_ICONS[trade.slug], trade.slug).toBeDefined();
  });
});

describe("offers", () => {
  it("point at a real, open trade and a real person in that trade", () => {
    for (const offer of offers) {
      const trade = tradeBySlug(offer.tradeSlug);
      expect(trade).toBeDefined();
      expect(trade?.gated).toBeFalsy();
      expect(providerBySlug(offer.providerSlug)?.tradeSlug).toBe(offer.tradeSlug);
    }
  });
});

describe("ads", () => {
  const ad: Ad = {
    slot: "home-top",
    advertiser: "Test",
    href: "https://example.com/tools",
    image: "/ads/wide.jpg",
    imagePhone: "/ads/phone.jpg",
    alt: "Test",
    from: "2026-01-10",
    until: "2026-01-20",
  };

  it("shows an ad only on its dates, including the first and last", () => {
    expect(adFor("home-top", "2026-01-09", [ad])).toBeUndefined();
    expect(adFor("home-top", "2026-01-10", [ad])).toBe(ad);
    expect(adFor("home-top", "2026-01-20", [ad])).toBe(ad);
    expect(adFor("home-top", "2026-01-21", [ad])).toBeUndefined();
  });

  it("shows an ad only in its own space", () => {
    expect(adFor("jobs", "2026-01-15", [ad])).toBeUndefined();
  });

  it("refuses links that are not https", () => {
    expect(isSafeAd(ad)).toBe(true);
    expect(isSafeAd({ ...ad, href: "javascript:alert(1)" })).toBe(false);
    expect(isSafeAd({ ...ad, href: "http://example.com" })).toBe(false);
    expect(isSafeAd({ ...ad, href: "not a link" })).toBe(false);
  });

  it("refuses pictures hosted anywhere else", () => {
    expect(isSafeAd({ ...ad, image: "https://example.com/pixel.gif" })).toBe(false);
    expect(isSafeAd({ ...ad, imagePhone: "/ads/../secret.jpg" })).toBe(false);
  });
});
