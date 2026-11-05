/**
 * SAMPLE DATA. Every person here is fictional and exists so the design can be judged at
 * real density. Remove before launch. No figure here is a claim about real performance.
 */
export type Provider = {
  slug: string;
  name: string;
  tradeSlug: string;
  area: string;
  booked: number;
  redone: number;
  rehired: number;
  years: number;
  checks: string[];
  about: string;
  quote: number;
  arrives: string;
  pastJobs: { title: string; note: string }[];
};

export const providers: Provider[] = [
  {
    slug: "tomas-k", name: "Tomas K.", tradeSlug: "carpenter", area: "2 km away", booked: 212, redone: 3, rehired: 41, years: 14,
    checks: ["ID checked", "Phone checked", "Tools and van seen"],
    about: "Doors, frames and fitted shelves. Prefers mending old timber to replacing it.",
    quote: 10500, arrives: "Tomorrow morning",
    pastJobs: [
      { title: "Rehung a swollen front door", note: "Planed and resealed. Done in 2 hours." },
      { title: "Replaced a rotten window frame", note: "Matched the old profile. Two visits." },
      { title: "Built alcove shelves", note: "Oak, fitted to an uneven wall." },
    ],
  },
  {
    slug: "amal-f", name: "Amal F.", tradeSlug: "plumber", area: "1 km away", booked: 348, redone: 6, rehired: 87, years: 19,
    checks: ["ID checked", "Phone checked", "Trade licence seen"],
    about: "Leaks, drains and water pressure. Sends a photo of the fault before starting.",
    quote: 4500, arrives: "Today, after 2 pm",
    pastJobs: [
      { title: "Fixed a leak behind a kitchen sink", note: "New trap and seals. One hour." },
      { title: "Cleared a blocked outside drain", note: "Rodded and flushed the full run." },
      { title: "Replaced a corroded pipe section", note: "Copper to the stop tap." },
    ],
  },
  {
    slug: "joy-o", name: "Joy O.", tradeSlug: "plumber", area: "3 km away", booked: 96, redone: 1, rehired: 22, years: 6,
    checks: ["ID checked", "Phone checked"],
    about: "Bathrooms and small leaks. Evening and weekend visits.",
    quote: 5500, arrives: "Today, after 6 pm",
    pastJobs: [
      { title: "Stopped a dripping shower", note: "New cartridge, no wall opened." },
      { title: "Fitted a new toilet cistern", note: "Removed the old one too." },
    ],
  },
  {
    slug: "sam-d", name: "Sam D.", tradeSlug: "plumber", area: "4 km away", booked: 41, redone: 2, rehired: 5, years: 3,
    checks: ["ID checked", "Phone checked"],
    about: "New to the area. Takes small jobs at short notice.",
    quote: 3500, arrives: "Tomorrow, any time",
    pastJobs: [{ title: "Replaced two kitchen taps", note: "Same day." }],
  },
  {
    slug: "nadia-w", name: "Nadia W.", tradeSlug: "electrician", area: "2 km away", booked: 187, redone: 2, rehired: 53, years: 11,
    checks: ["ID checked", "Phone checked", "Trade licence seen"],
    about: "Tripping fuses, rewires and safe sockets. Tests every circuit before leaving.",
    quote: 6500, arrives: "Today, after 4 pm",
    pastJobs: [
      { title: "Traced a tripping kitchen circuit", note: "Faulty oven element. Isolated and fixed." },
      { title: "Added outdoor sockets", note: "Weatherproof, on their own breaker." },
    ],
  },
  {
    slug: "ravi-m", name: "Ravi M.", tradeSlug: "mason", area: "5 km away", booked: 158, redone: 4, rehired: 29, years: 22,
    checks: ["ID checked", "Phone checked"],
    about: "Cracked walls, steps and boundary walls. Explains the cause before quoting.",
    quote: 16500, arrives: "This week",
    pastJobs: [
      { title: "Repaired a cracked garden wall", note: "Rebuilt six courses, new footing." },
      { title: "Rebuilt front steps", note: "Concrete core with stone treads." },
    ],
  },
  {
    slug: "lena-b", name: "Lena B.", tradeSlug: "roofer", area: "6 km away", booked: 121, redone: 2, rehired: 18, years: 9,
    checks: ["ID checked", "Phone checked", "Insurance seen"],
    about: "Tile roofs and gutters. Sends roof photos so you can see what she sees.",
    quote: 13500, arrives: "Thursday",
    pastJobs: [
      { title: "Re-bedded cracked ridge tiles", note: "Fourteen tiles, new mortar." },
      { title: "Cleared and rehung gutters", note: "Fixed a slow leak over a door." },
    ],
  },
  {
    slug: "dev-p", name: "Dev P.", tradeSlug: "tree-cutter", area: "7 km away", booked: 74, redone: 0, rehired: 15, years: 8,
    checks: ["ID checked", "Phone checked", "Insurance seen"],
    about: "Felling and lopping near houses and cables. Takes the waste away.",
    quote: 19500, arrives: "Saturday",
    pastJobs: [
      { title: "Took down a leaning tree", note: "In sections, next to a roof." },
      { title: "Lopped branches off a cable", note: "Worked with the power company." },
    ],
  },
  {
    slug: "kofi-a", name: "Kofi A.", tradeSlug: "gardener", area: "1 km away", booked: 263, redone: 1, rehired: 94, years: 12,
    checks: ["ID checked", "Phone checked"],
    about: "Scraping, weeding, mowing and hedges. Weekly or one-off.",
    quote: 3500, arrives: "Tomorrow",
    pastJobs: [
      { title: "Cleared an overgrown back garden", note: "Two days, waste removed." },
      { title: "Cut and shaped a long hedge", note: "Regular visit every six weeks." },
    ],
  },
  {
    slug: "mei-t", name: "Mei T.", tradeSlug: "fence-repair", area: "3 km away", booked: 88, redone: 1, rehired: 12, years: 7,
    checks: ["ID checked", "Phone checked"],
    about: "Fences, gates and posts in wood or metal.",
    quote: 8500, arrives: "Friday",
    pastJobs: [
      { title: "Straightened bent metal railings", note: "Reset two posts in concrete." },
      { title: "Fixed a dragging gate", note: "New hinges, rehung level." },
    ],
  },
  {
    slug: "ines-r", name: "Ines R.", tradeSlug: "painter", area: "2 km away", booked: 134, redone: 2, rehired: 31, years: 10,
    checks: ["ID checked", "Phone checked"],
    about: "Rooms and outside walls. Moves furniture and covers floors.",
    quote: 11000, arrives: "Next week",
    pastJobs: [{ title: "Repainted a brick front wall", note: "Two coats, masonry paint." }],
  },
];

export const providerBySlug = (slug: string) => providers.find((p) => p.slug === slug);

/** Up to five replies for a job, as in the real product. Falls back to nearby trades. */
export function repliesFor(tradeSlug: string | undefined): Provider[] {
  const exact = providers.filter((p) => p.tradeSlug === tradeSlug);
  const rest = providers.filter((p) => p.tradeSlug !== tradeSlug);
  return (exact.length >= 3 ? exact : [...exact, ...rest.slice(0, 3 - exact.length)]).slice(0, 5);
}
