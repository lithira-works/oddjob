import { TRADE_ICONS } from "@/lib/trade-icons";

/** Decorative: the trade's name always sits beside it. */
export function TradeIcon({ slug, size = 24 }: { slug: string; size?: number }) {
  const Icon = TRADE_ICONS[slug];
  return Icon ? <Icon className="tradeicon" size={size} strokeWidth={1.75} aria-hidden="true" /> : null;
}
