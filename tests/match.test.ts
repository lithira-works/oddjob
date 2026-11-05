import { describe, expect, it } from "vitest";
import { matchTrade, splitSentence } from "@/lib/match";

describe("matchTrade", () => {
  it.each([
    ["Water is leaking under my sink", "plumber"],
    ["my toilet is blocked", "plumber"],
    ["The fuse keeps tripping", "electrician"],
    ["There is a crack in my wall", "mason"],
    ["rain gets in through the roof", "roofer"],
    ["ceiling leak after the storm", "roofer"],
    ["Water coming through the ceiling", "roofer"],
    ["A branch from the tree is too close to the house", "tree-cutter"],
    ["my garden is overgrown and needs scraping", "gardener"],
    ["The fence is broken", "fence-repair"],
    ["our front door will not close", "carpenter"],
    ["my washing machine stopped", "appliance-repair"],
    ["termites in the cupboard", "pest-control"],
  ])("%s points to %s", (text, slug) => {
    expect(matchTrade(text).trade?.slug).toBe(slug);
  });

  it("returns no trade for words it does not know", () => {
    expect(matchTrade("hello there").trade).toBeNull();
    expect(matchTrade("").trade).toBeNull();
  });

  it("flags gas before anything else", () => {
    expect(matchTrade("I can smell gas in the kitchen").emergency).toBe("gas");
    expect(matchTrade("gas leak near the cooker").emergency).toBe("gas");
  });

  it("does not raise an emergency for ordinary jobs", () => {
    expect(matchTrade("the tap is leaking").emergency).toBeNull();
  });

  it("marks care work as gated until safety checks exist", () => {
    const result = matchTrade("I need a babysitter on Friday");
    expect(result.trade?.slug).toBe("babysitter");
    expect(result.gated).toBe(true);
  });
});

describe("splitSentence", () => {
  it("splits around the middle on whole words", () => {
    expect(splitSentence("My pipe is leaking")).toEqual(["My pipe", "is leaking"]);
  });
  it("handles one word and empty text", () => {
    expect(splitSentence("Help")).toEqual(["Help", ""]);
    expect(splitSentence("   ")).toEqual(["", ""]);
  });
  it("never drops a word", () => {
    const text = "water is coming through the kitchen ceiling again";
    expect(splitSentence(text).join(" ")).toBe(text);
  });
});
