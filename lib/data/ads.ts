/**
 * Banner spaces on the site, and the ads booked into them.
 *
 * To run an ad, add an entry to `ads`. It appears on the dates given, and the space goes
 * back to "Your ad here" afterwards. Put the pictures in `public/ads/`, and credit them in
 * `lib/data/credits.json` and `docs/CREDITS.md` like every other picture.
 *
 * Ads are plain first-party pictures and links. No ad network or tracking script: the CSP
 * blocks them, and a household's job words must never reach an advertiser.
 */
export const AD_SLOTS = {
  "home-top": "Homepage, below the categories",
  "home-lower": "Homepage, below the work ledger",
  jobs: "Homes that need help, in the list",
  workers: "People ready to work, in the list",
  deals: "Offers and deals, below the list",
  category: "Every category page",
} as const;

export type AdSlotId = keyof typeof AD_SLOTS;

export type Ad = {
  slot: AdSlotId;
  advertiser: string;
  href: string;
  /** Wide picture for larger screens, 1600 by 400 pixels. A path under /ads/. */
  image: string;
  /** Picture for phones, 800 by 400 pixels. A path under /ads/. */
  imagePhone: string;
  alt: string;
  /** First and last day to show, as YYYY-MM-DD in UTC. */
  from: string;
  until: string;
};

export const ads: Ad[] = [];

const isLocalAdPicture = (path: string) => path.startsWith("/ads/") && !path.includes("..");

/** An ad must link over https and use our own hosted pictures. */
export function isSafeAd(ad: Ad): boolean {
  let url: URL;
  try {
    url = new URL(ad.href);
  } catch {
    return false;
  }
  return url.protocol === "https:" && isLocalAdPicture(ad.image) && isLocalAdPicture(ad.imagePhone);
}

/** The ad booked into a space today, if there is one. */
export function adFor(slot: AdSlotId, today = new Date().toISOString().slice(0, 10), list: Ad[] = ads): Ad | undefined {
  return list.find((ad) => ad.slot === slot && ad.from <= today && today <= ad.until && isSafeAd(ad));
}
