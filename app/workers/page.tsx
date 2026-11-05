import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Workers } from "@/components/Workers";
import { tradeBySlug } from "@/lib/data/trades";
import { parseSort } from "@/lib/market";

export const metadata: Metadata = {
  title: "People ready to work",
  description: "Browse people by trade, and compare them by the jobs they have finished.",
};

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function WorkersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return (
    <>
      <div id="top"><Nav action={false} /></div>
      <main className="market-page">
        <Workers
          initialTrade={tradeBySlug(single(params.trade))?.slug}
          initialSort={parseSort(single(params.sort))}
          initialToday={single(params.today) === "1"}
        />
      </main>
      <Footer />
    </>
  );
}
