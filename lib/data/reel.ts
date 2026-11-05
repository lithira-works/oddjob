import { tradeBySlug } from "./trades";

export type ReelStep = {
  first: string;
  second: string;
  image: string;
  alt: string;
  tradeSlug: string;
};

export const reel: ReelStep[] = [
  { first: "My pipe", second: "is leaking", image: "/images/leak.jpg", alt: "A rusted metal pipe with a leak at its base", tradeSlug: "plumber" },
  { first: "My roof", second: "is cracked", image: "/images/roof.jpg", alt: "Red clay roof tiles with cracked mortar", tradeSlug: "roofer" },
  { first: "My tree", second: "is too big", image: "/images/tree.jpg", alt: "Two tree workers in helmets among felled branches", tradeSlug: "tree-cutter" },
  { first: "My fence", second: "is broken", image: "/images/fence.jpg", alt: "A black metal fence with bent railings", tradeSlug: "fence-repair" },
];

export const reelTrade = (step: ReelStep) => tradeBySlug(step.tradeSlug)!;
