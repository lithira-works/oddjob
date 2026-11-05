import type { Metadata } from "next";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { DealList } from "@/components/DealList";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { OFFER_KINDS, offers } from "@/lib/data/offers";
import { marketHref } from "@/lib/market";

export const metadata: Metadata = {
  title: "Offers and deals",
  description: "Discounts, offers and special deals from people who do the work.",
};

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function DealsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const kind = OFFER_KINDS.find((k) => k === single(params.kind));
  const deals = kind ? offers.filter((offer) => offer.kind === kind) : offers;

  return (
    <>
      <Nav />
      <main className="page">
        <h1 className="display head page__title--tight">Money off the odd job</h1>
        <p className="sample-note" style={{ marginBottom: 24 }}>Sample offers. These are made up, and none can be redeemed yet.</p>

        <div className="seg" role="group" aria-label="Kind of deal" style={{ marginBottom: 24 }}>
          {[undefined, ...OFFER_KINDS].map((option) => (
            <Link key={option ?? "all"} href={marketHref("/deals", { kind: option })} className="seg__item" aria-current={kind === option ? "true" : undefined} scroll={false}>
              {option ?? "All"}
            </Link>
          ))}
        </div>

        <DealList deals={deals} />

        <div style={{ marginTop: 64 }}><AdSlot slot="deals" /></div>
      </main>
      <Footer />
    </>
  );
}
