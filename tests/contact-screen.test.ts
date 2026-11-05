import { describe, expect, it } from "vitest";
import { screenMessage } from "@/lib/contact-screen";

describe("screenMessage catches contact details", () => {
  it.each([
    ["Call 077 123 4567 please", "phone-number"],
    ["+94-77-123-4567", "phone-number"],
    ["my no (077) 1234567", "phone-number"],
    ["zero seven seven one two three four five six seven", "spelled-number"],
    ["oh seven seven, one two three, four five six", "spelled-number"],
    ["mail me at sam.k@example.com", "email"],
    ["sam (at) example (dot) com", "email"],
    ["see www.my-site.com", "link"],
    ["find me on WhatsApp", "messaging-app"],
    ["message me on what's app", "messaging-app"],
    ["we can skip the fee", "off-platform-offer"],
    ["pay me in cash and avoid the commission", "off-platform-offer"],
  ])("%s", (text, reason) => {
    const result = screenMessage(text);
    expect(result.flagged).toBe(true);
    expect(result.reasons).toContain(reason);
  });

  it("hides the details in the redacted text", () => {
    const { redacted } = screenMessage("Ring 0771234567 now");
    expect(redacted).not.toContain("0771234567");
    expect(redacted).toContain("[hidden]");
  });
});

describe("screenMessage leaves ordinary job talk alone", () => {
  it.each([
    "The pipe is about 15 mm wide",
    "I can come at 10.30 on Tuesday",
    "It will cost around 4500 for parts",
    "Rs 1500000 for the whole roof",
    "The wall is 2500000 mm long",
    "There are one or two tiles loose",
    "I am at the house until five",
    "Can you send a photo of the leak?",
    "It was built in 1998 and repaired in 2014",
  ])("%s", (text) => {
    const result = screenMessage(text);
    expect(result.flagged).toBe(false);
    expect(result.redacted).toBe(text);
  });
});
