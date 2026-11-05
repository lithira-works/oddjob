import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { TradeIndex } from "@/components/TradeIndex";
import { tradesByLetter } from "@/lib/data/trades";

export const metadata: Metadata = {
  title: "Trades",
  description: "Every trade on Oddjob, from plumbers and masons to tree cutters and gardeners.",
};

export default function TradesPage() {
  return (
    <>
      <div id="top"><Nav /></div>
      <main className="page">
        <h1 className="display page__title">Every trade</h1>
        <TradeIndex trades={tradesByLetter()} />
      </main>
      <Footer />
    </>
  );
}
