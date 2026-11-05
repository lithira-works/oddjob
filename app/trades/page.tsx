import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { TradeIndex } from "@/components/TradeIndex";
import { tradesByLetter } from "@/lib/data/trades";

export const metadata: Metadata = {
  title: "Categories",
  description: "Every kind of work on Oddjob, from plumbers and masons to tree cutters and gardeners.",
};

export default function TradesPage() {
  return (
    <>
      <div id="top"><Nav /></div>
      <main className="page">
        <h1 className="display head page__title--tight">What needs fixing?</h1>
        <TradeIndex trades={tradesByLetter()} />
      </main>
      <Footer />
    </>
  );
}
