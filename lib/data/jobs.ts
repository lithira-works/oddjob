/** SAMPLE DATA for the jobs board. Fictional. Remove before launch. */
export type BoardJob = {
  id: string;
  words: string;
  /** A little more from the household. Never an address, a name or a number. */
  note: string;
  tradeSlug: string;
  /** Rough area only. The exact address goes only to the booked person. */
  area: string;
  when: JobWhen;
  replies: number;
  cost: number;
};

export const JOB_WHEN = ["Today", "This week", "Flexible"] as const;
export type JobWhen = (typeof JOB_WHEN)[number];

export const MAX_REPLIES = 5;

export const boardJobs: BoardJob[] = [
  { id: "j-1048", words: "Water under the kitchen sink", note: "Dripping from the pipe behind the cupboard. A bucket is holding it for now.", tradeSlug: "plumber", area: "1 km from you", when: "Today", replies: 2, cost: 3 },
  { id: "j-1047", words: "Front gate drags on the ground", note: "It started after the rains. Takes two hands to open.", tradeSlug: "fence-repair", area: "2 km from you", when: "This week", replies: 1, cost: 2 },
  { id: "j-1046", words: "Air conditioner blows warm air", note: "Bedroom unit, about five years old. Not serviced in a while.", tradeSlug: "air-conditioning", area: "2 km from you", when: "This week", replies: 1, cost: 3 },
  { id: "j-1045", words: "Termites in the wardrobe door", note: "Small trails of dust on the floor each morning.", tradeSlug: "pest-control", area: "3 km from you", when: "This week", replies: 0, cost: 3 },
  { id: "j-1044", words: "Crack across the bedroom wall", note: "About a metre long and getting wider. Upstairs room.", tradeSlug: "mason", area: "3 km from you", when: "This week", replies: 3, cost: 4 },
  { id: "j-1043", words: "Rain comes in over the back door", note: "Only in heavy rain. Some roof tiles look loose.", tradeSlug: "roofer", area: "3 km from you", when: "Today", replies: 1, cost: 4 },
  { id: "j-1042", words: "Washing machine won’t drain", note: "Stops halfway through with water still inside.", tradeSlug: "appliance-repair", area: "3 km from you", when: "Today", replies: 0, cost: 2 },
  { id: "j-1041", words: "Big branch hanging over the roof", note: "It moves in the wind and scrapes the tiles.", tradeSlug: "tree-cutter", area: "4 km from you", when: "Today", replies: 4, cost: 5 },
  { id: "j-1040", words: "Two rooms need repainting", note: "Peeling near the ceiling. Furniture can be moved.", tradeSlug: "painter", area: "4 km from you", when: "Flexible", replies: 2, cost: 3 },
  { id: "j-1039", words: "Lights trip when the oven is on", note: "Happens every time, usually within a few minutes.", tradeSlug: "electrician", area: "4 km from you", when: "Flexible", replies: 5, cost: 3 },
  { id: "j-1038", words: "Bathroom door won’t close", note: "The frame looks swollen at the bottom.", tradeSlug: "carpenter", area: "5 km from you", when: "This week", replies: 1, cost: 2 },
  { id: "j-1037", words: "House needs a deep clean", note: "Three bedrooms, moving out at the end of the month.", tradeSlug: "cleaner", area: "5 km from you", when: "Flexible", replies: 1, cost: 2 },
  { id: "j-1036", words: "Back garden needs scraping", note: "Waist-high weeds along the back wall.", tradeSlug: "gardener", area: "6 km from you", when: "Flexible", replies: 0, cost: 2 },
  { id: "j-1035", words: "Hang a TV and some shelves", note: "Brick wall. The bracket and shelves are already here.", tradeSlug: "handyperson", area: "6 km from you", when: "Flexible", replies: 2, cost: 2 },
];
