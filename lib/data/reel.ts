import { tradeBySlug } from "./trades";

export type ReelStep = {
  first: string;
  second: string;
  image: string;
  alt: string;
  tradeSlug: string;
};

export const reel: ReelStep[] = [
  { first: "My pipe", second: "is leaking", image: "/images/leak.jpg", alt: "A rusty outdoor tap dripping water against a blue sky", tradeSlug: "plumber" },
  { first: "My roof", second: "is cracked", image: "/images/roof.jpg", alt: "A heap of broken red clay roof tiles", tradeSlug: "roofer" },
  { first: "My tree", second: "is too big", image: "/images/tree.jpg", alt: "Tall mossy tree trunks in a green forest", tradeSlug: "tree-cutter" },
  { first: "My fence", second: "is broken", image: "/images/fence.jpg", alt: "A wooden fence bent over by a fallen tree trunk", tradeSlug: "fence-repair" },
];

export const reelTrade = (step: ReelStep) => tradeBySlug(step.tradeSlug)!;
