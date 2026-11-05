import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { providerBySlug } from "@/lib/data/providers";
import { tradeBySlug } from "@/lib/data/trades";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const provider = providerBySlug((await params).slug);
  return provider ? { title: provider.name, robots: { index: false } } : {};
}

export default async function ProviderPage({ params }: Props) {
  const provider = providerBySlug((await params).slug);
  if (!provider) notFound();
  const trade = tradeBySlug(provider.tradeSlug)!;

  return (
    <>
      <div id="top"><Nav /></div>
      <main className="page">
        <div className="pro__head">
          <h1 className="display">{provider.name}</h1>
          <div className="pro__act">
            <Link href={`/job?trade=${trade.slug}`} className="btn">Find someone</Link>
          </div>
        </div>
        <p className="lead" style={{ marginTop: 20 }}>
          <span className="cap">{trade.name}</span>, {provider.area}, {provider.years} years in the trade.
        </p>
        <p style={{ marginTop: 12 }}>{provider.about}</p>
        <p className="sample-note" style={{ marginTop: 16 }}>Sample profile. This person, their jobs and figures are made up, and the pictures show the trade, not their work.</p>

        <div className="ledger pro__figs" data-ui="" data-reveal="">
          <div className="ledger__figures">
            <div className="ledger__figure"><b>{provider.booked}</b><span>jobs booked on Oddjob</span></div>
            <div className="ledger__figure"><b>{provider.redone}</b><span>had to be redone</span></div>
            <div className="ledger__figure"><b>{provider.rehired}</b><span>homes called back</span></div>
          </div>
        </div>

        <div className="pro__pic" data-reveal="shutter">
          <Image src={trade.image} alt={trade.imageAlt} fill sizes="100vw" />
        </div>

        <section className="pro__jobs">
          <h2 className="display" data-reveal="">Recent jobs</h2>
          <ul>
            {provider.pastJobs.map((job, i) => (
              <li key={job.title} data-reveal="row" style={{ "--i": i } as React.CSSProperties}>
                <b>{job.title}</b>
                {job.note}
              </li>
            ))}
            <li data-reveal="row" style={{ "--i": provider.pastJobs.length } as React.CSSProperties}>
              <b>Checks passed</b>
              {provider.checks.join(". ")}.
            </li>
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
