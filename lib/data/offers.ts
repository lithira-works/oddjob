/**
 * SAMPLE DATA. These offers are made up, from made-up people, so the deals pages can be
 * judged at real density. None can be redeemed. Remove before launch.
 */
export const OFFER_KINDS = ["Discounts", "Offers", "Special deals"] as const;
export type OfferKind = (typeof OFFER_KINDS)[number];

export type Offer = {
  id: string;
  kind: OfferKind;
  /** Set large, so keep it to a few characters. */
  amount: string;
  title: string;
  terms: string;
  tradeSlug: string;
  providerSlug: string;
};

export const offers: Offer[] = [
  { id: "o-1", kind: "Discounts", amount: "15% off", title: "Your first garden clear", terms: "One-off clears only, up to two days’ work.", tradeSlug: "gardener", providerSlug: "kofi-a" },
  { id: "o-2", kind: "Offers", amount: "Free", title: "Drain check with any leak repair", terms: "Done on the same visit.", tradeSlug: "plumber", providerSlug: "amal-f" },
  { id: "o-3", kind: "Special deals", amount: "2 for 1", title: "Service two air conditioners", terms: "Both units in one house, on one visit.", tradeSlug: "air-conditioning", providerSlug: "hana-s" },
  { id: "o-4", kind: "Discounts", amount: "10% off", title: "A move-out clean", terms: "Booked at least a week ahead.", tradeSlug: "cleaner", providerSlug: "priya-n" },
  { id: "o-5", kind: "Offers", amount: "Free", title: "Second termite check", terms: "Two weeks after any treatment.", tradeSlug: "pest-control", providerSlug: "ben-c" },
  { id: "o-6", kind: "Discounts", amount: "10% off", title: "Painting two rooms or more", terms: "Paint is charged separately.", tradeSlug: "painter", providerSlug: "ines-r" },
  { id: "o-7", kind: "Special deals", amount: "3 jobs", title: "One visit, one hourly rate", terms: "Save up your small jobs for a single afternoon.", tradeSlug: "handyperson", providerSlug: "sara-h" },
];
