import type { Metadata } from "next";
import { Board } from "@/components/Board";
import { Nav } from "@/components/Nav";
import { tradeBySlug } from "@/lib/data/trades";
import { parseWhen } from "@/lib/market";

export const metadata: Metadata = {
  title: "Homes that need help",
  description: "See what households near you need done, and pay only to answer the jobs you want.",
};

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return (
    <div className="board on-accent">
      <Nav action={false} />
      <main className="board__body">
        <Board initialTrade={tradeBySlug(single(params.trade))?.slug} initialWhen={parseWhen(single(params.when))} />
      </main>
    </div>
  );
}
