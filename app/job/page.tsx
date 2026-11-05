import type { Metadata } from "next";
import { JobFlow } from "@/components/JobFlow";
import { Nav } from "@/components/Nav";
import { tradeBySlug } from "@/lib/data/trades";

export const metadata: Metadata = { title: "Your job card" };

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function JobPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const words = (single(params.q) ?? "").slice(0, 500);
  const trade = tradeBySlug(single(params.trade));
  return (
    <>
      <Nav action={false} />
      <main className="page">
        <JobFlow initialWords={words} initialTrade={trade?.slug} />
      </main>
    </>
  );
}
