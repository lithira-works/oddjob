export type TradeGroup = "Water and power" | "Wood and stone" | "Outside" | "Inside";

export type Trade = {
  slug: string;
  /** Singular, lower case, reads after "a job for a". */
  name: string;
  /** The service in a few words, where the person's title is long. Shown on the homepage. */
  service?: string;
  /** "a" or "an", so sentences read correctly. */
  article: "a" | "an";
  group: TradeGroup;
  jobs: string;
  image: string;
  imageAlt: string;
  /** Lower-case words and phrases a household might use. Longer phrases score higher. */
  words: string[];
  /** Opens only after the safety checks in docs/SECURITY.md and docs/PLAN.md section 5. */
  gated?: boolean;
  /** Shown on the homepage table. */
  featured?: boolean;
  /** Raises this trade's score when its words name the cause, not the place ("termites in the cupboard"). */
  weight?: number;
};

const leak = { image: "/images/leak.jpg", imageAlt: "A rusty outdoor tap dripping water against a blue sky" };
const fuses = { image: "/images/fuses.jpg", imageAlt: "Rows of circuit breakers in an open fuse box" };
const plane = { image: "/images/plane.jpg", imageAlt: "A wooden hand plane with curled shavings and a red pencil" };
const brick = { image: "/images/brick.jpg", imageAlt: "A mason in a straw hat laying a course of blocks" };
const roof = { image: "/images/roof.jpg", imageAlt: "A heap of broken red clay roof tiles" };
const paint = { image: "/images/paint.jpg", imageAlt: "A roller painting a brick wall bright orange" };
const tree = { image: "/images/tree.jpg", imageAlt: "Tall mossy tree trunks in a green forest" };
const hedge = { image: "/images/hedge.jpg", imageAlt: "A green electric hedge trimmer lying on dry grass" };
const fence = { image: "/images/fence.jpg", imageAlt: "A wooden fence bent over by a fallen tree trunk" };

export const trades: Trade[] = [
  { slug: "plumber", name: "plumber", article: "a", group: "Water and power", jobs: "Leaks, taps, blocked drains", featured: true, ...leak,
    words: ["leak", "leaking", "leaks", "pipe", "pipes", "tap", "faucet", "sink", "drain", "blocked", "toilet", "shower", "water", "dripping", "drip", "flood", "flooding", "cistern", "water pressure", "water tank", "burst"] },
  { slug: "electrician", name: "electrician", article: "an", group: "Water and power", jobs: "Tripping fuses, sockets, lights", featured: true, ...fuses,
    words: ["electric", "electrical", "electricity", "socket", "plug", "switch", "fuse", "fuses", "tripping", "trips", "wiring", "wire", "light", "lights", "power cut", "no power", "breaker", "sparks", "sparking", "fan"] },
  { slug: "air-conditioning", service: "Air conditioning", name: "air conditioning engineer", article: "an", group: "Water and power", jobs: "Servicing, no cold air, odd noises", featured: true, ...fuses,
    words: ["air conditioning", "air conditioner", "aircon", "ac unit", "a/c", "cooling", "no cold air"] },
  { slug: "appliance-repair", service: "Appliance repair", name: "appliance repairer", article: "an", group: "Water and power", jobs: "Washers, fridges, ovens", featured: true, ...fuses,
    words: ["washing machine", "washer", "fridge", "freezer", "oven", "cooker", "dishwasher", "microwave", "dryer", "appliance"] },
  { slug: "solar-installer", name: "solar installer", article: "a", group: "Water and power", jobs: "Panels, inverters, batteries", ...fuses,
    words: ["solar", "panel", "panels", "inverter"] },
  { slug: "water-tank", name: "water tank cleaner", article: "a", group: "Water and power", jobs: "Tank cleaning, pump checks", ...leak,
    words: ["tank cleaning", "clean the tank", "water pump", "pump", "well"] },

  { slug: "carpenter", name: "carpenter", article: "a", group: "Wood and stone", jobs: "Doors, shelves, rotten frames", featured: true, ...plane,
    words: ["door", "doors", "shelf", "shelves", "cupboard", "wardrobe", "wood", "wooden", "window frame", "frame", "hinge", "drawer", "table", "chair", "furniture", "stairs", "skirting", "carpenter"] },
  { slug: "mason", name: "mason", article: "a", group: "Wood and stone", jobs: "Cracked walls, steps, new brickwork", featured: true, ...brick,
    words: ["crack", "cracked", "cracks", "wall", "brick", "bricks", "brickwork", "concrete", "cement", "plaster", "steps", "foundation", "mason", "render", "damp wall"] },
  { slug: "roofer", name: "roofer", article: "a", group: "Wood and stone", jobs: "Loose tiles, leaks, gutters", featured: true, ...roof,
    words: ["roof", "ceiling", "through the ceiling", "tile", "tiles", "gutter", "gutters", "ceiling leak", "rain coming in", "rain gets in", "sheeting", "leaking roof", "roof leak"] },
  { slug: "painter", name: "painter", article: "a", group: "Wood and stone", jobs: "Rooms, gates, outside walls", featured: true, ...paint,
    words: ["paint", "painting", "painter", "repaint", "peeling", "whitewash", "wallpaper", "colour", "color"] },
  { slug: "tiler", name: "tiler", article: "a", group: "Wood and stone", jobs: "Floors, bathrooms, kitchen splashbacks", ...brick,
    words: ["floor tile", "floor tiles", "bathroom tiles", "grout", "tiling", "tiler", "splashback"] },
  { slug: "welder", name: "welder", article: "a", group: "Wood and stone", jobs: "Gates, grilles, railings", ...fence,
    words: ["weld", "welding", "welder", "grille", "grill", "steel", "metal gate", "railing", "railings"] },
  { slug: "locksmith", name: "locksmith", article: "a", group: "Wood and stone", jobs: "Lockouts, new locks, stuck keys", ...plane,
    words: ["lock", "locked", "locked out", "key", "keys", "locksmith"] },
  { slug: "glazier", name: "glazier", article: "a", group: "Wood and stone", jobs: "Broken panes, window seals", ...plane,
    words: ["glass", "window", "broken window", "pane", "glazier", "mirror"] },

  { slug: "tree-cutter", service: "Tree cutting", name: "tree cutter", article: "a", group: "Outside", jobs: "Felling, lopping, storm damage", featured: true, ...tree,
    words: ["tree", "trees", "branch", "branches", "felling", "fell", "stump", "lopping", "coconut", "too close", "fallen tree"] },
  { slug: "gardener", name: "gardener", article: "a", group: "Outside", jobs: "Scraping, weeding, mowing, hedges", featured: true, ...hedge,
    words: ["garden", "gardener", "grass", "lawn", "mow", "mowing", "weed", "weeds", "weeding", "hedge", "scrape", "scraping", "overgrown", "yard", "bushes", "plants"] },
  { slug: "fence-repair", service: "Fences and gates", name: "fence and gate fixer", article: "a", group: "Outside", jobs: "Bent rails, stuck gates, new posts", featured: true, ...fence,
    words: ["fence", "fencing", "gate", "post", "boundary", "bent rail"] },
  { slug: "pest-control", service: "Pest control", name: "pest controller", article: "a", group: "Outside", jobs: "Termites, rats, wasps", featured: true, weight: 2, ...hedge,
    words: ["pest", "pests", "termite", "termites", "rat", "rats", "mice", "mouse", "cockroach", "cockroaches", "wasp", "wasps", "ants", "bed bugs", "snake", "mosquito"] },
  { slug: "waste-removal", name: "waste remover", article: "a", group: "Outside", jobs: "Rubble, old furniture, garden waste", ...tree,
    words: ["rubbish", "garbage", "rubble", "waste", "junk", "clear out", "remove old"] },
  { slug: "well-digger", name: "well and drain digger", article: "a", group: "Outside", jobs: "New drains, soakaways, septic tanks", ...brick,
    words: ["septic", "soakaway", "dig", "digging", "trench", "pit"] },

  { slug: "cleaner", service: "House cleaning", name: "house cleaner", article: "a", group: "Inside", jobs: "Deep cleans, move-out cleans", featured: true, ...paint,
    words: ["clean", "cleaning", "cleaner", "deep clean", "mould", "mold", "dusty", "carpet"] },
  { slug: "mover", name: "mover", article: "a", group: "Inside", jobs: "House moves, heavy lifting", ...plane,
    words: ["move", "moving", "mover", "lift", "shift", "heavy", "transport"] },
  { slug: "handyperson", name: "handyperson", article: "a", group: "Inside", jobs: "Small fixes, flat-pack, hanging things", ...plane,
    words: ["handyman", "handyperson", "odd job", "small job", "flat pack", "flatpack", "hang", "assemble", "mount", "tv mount", "curtain"] },
  { slug: "cctv-installer", name: "CCTV installer", article: "a", group: "Inside", jobs: "Cameras, door entry, alarms", ...fuses,
    words: ["cctv", "camera", "cameras", "alarm", "doorbell", "intercom"] },
  { slug: "wifi-technician", name: "home Wi-Fi technician", article: "a", group: "Inside", jobs: "Slow Wi-Fi, network cables, routers", ...fuses,
    words: ["wifi", "wi-fi", "internet", "router", "network"] },
  { slug: "babysitter", name: "babysitter", article: "a", group: "Inside", jobs: "Opens after child safety checks", featured: true, gated: true, ...plane,
    words: ["babysitter", "babysit", "babysitting", "childcare", "child care", "nanny", "look after my kid", "look after my child", "look after my baby"] },
  { slug: "elder-carer", name: "elder carer", article: "an", group: "Inside", jobs: "Opens after safety checks", gated: true, ...plane,
    words: ["elder care", "elderly", "carer", "caregiver", "care for my mother", "care for my father"] },
];

export const tradeBySlug = (slug: string | null | undefined) =>
  slug ? trades.find((t) => t.slug === slug) : undefined;

export const tradesByLetter = () =>
  [...trades].sort((a, b) => a.name.localeCompare(b.name));

/** Trades with no fitting picture yet. They keep the current picture instead of a wrong one. */
const NO_PICTURE = new Set([
  "appliance-repair", "solar-installer", "air-conditioning", "locksmith", "glazier", "pest-control",
  "waste-removal", "well-digger", "cleaner", "mover", "wifi-technician", "babysitter", "elder-carer",
]);
export const hasFittingPicture = (trade: Trade) => !NO_PICTURE.has(trade.slug);
