import Link from "next/link";
import { providerBySlug } from "@/lib/data/providers";
import { tradeBySlug } from "@/lib/data/trades";
import type { Offer } from "@/lib/data/offers";

export function DealList({ deals }: { deals: Offer[] }) {
  return (
    <ul className="deals">
      {deals.map((deal, i) => (
        <li key={deal.id} data-reveal="row" style={{ "--i": i } as React.CSSProperties}>
          <Link href={`/trades/${deal.tradeSlug}`} className="deal">
            <span className="display deal__amount num">{deal.amount}</span>
            <span className="deal__text">
              <span className="deal__title">{deal.title}</span>
              <span>{deal.terms} Sample offer from {providerBySlug(deal.providerSlug)?.name}, {tradeBySlug(deal.tradeSlug)?.name}.</span>
            </span>
            <span className="traderow__arrow" aria-hidden="true">→</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
