/** SAMPLE DATA for the provider board. Fictional. Remove before launch. */
export type BoardJob = {
  id: string;
  words: string;
  tradeSlug: string;
  area: string;
  when: string;
  replies: number;
  cost: number;
};

export const MAX_REPLIES = 5;

export const boardJobs: BoardJob[] = [
  { id: "j-1048", words: "Water under the kitchen sink", tradeSlug: "plumber", area: "1 km from you", when: "Today", replies: 2, cost: 3 },
  { id: "j-1047", words: "Front gate drags on the ground", tradeSlug: "fence-repair", area: "2 km from you", when: "This week", replies: 1, cost: 2 },
  { id: "j-1044", words: "Crack across the bedroom wall", tradeSlug: "mason", area: "3 km from you", when: "This week", replies: 3, cost: 4 },
  { id: "j-1041", words: "Big branch hanging over the roof", tradeSlug: "tree-cutter", area: "4 km from you", when: "Today", replies: 4, cost: 5 },
  { id: "j-1039", words: "Lights trip when the oven is on", tradeSlug: "electrician", area: "4 km from you", when: "Flexible", replies: 5, cost: 3 },
  { id: "j-1036", words: "Back garden needs scraping", tradeSlug: "gardener", area: "6 km from you", when: "Flexible", replies: 0, cost: 2 },
];
