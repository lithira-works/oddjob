import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { DealList } from "@/components/DealList";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { TradeIcon } from "@/components/TradeIcon";
import { MAX_REPLIES } from "@/lib/data/jobs";
import { offers } from "@/lib/data/offers";
import { hasFittingPicture, tradeBySlug } from "@/lib/data/trades";
import { filterJobs, filterWorkers, marketHref } from "@/lib/market";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const trade = tradeBySlug((await params).slug);
  return trade ? { title: trade.name, description: trade.jobs } : {};
}

/** The fork in the road: one trade, with homes asking for it beside people who do it. */
export default async function TradePage({ params }: Props) {
  const trade = tradeBySlug((await params).slug);
  if (!trade) notFound();

  const jobs = filterJobs({ trade: trade.slug });
  const workers = filterWorkers({ trade: trade.slug });
  const deals = offers.filter((offer) => offer.tradeSlug === trade.slug);

  return (
    <>
      <Nav action={false} />
      <main className="page">
        <div className="cat__head">
          <div>
            <div className="cat__icon"><TradeIcon slug={trade.slug} size={56} /></div>
            <h1 className="display head">{trade.name}</h1>
            <p className="lead" style={{ marginTop: 16 }}>{trade.jobs}</p>
            {trade.gated ? (
              <p style={{ marginTop: 24 }}>Closed for now. This category opens only once identity, reference and police checks are in place, because this work carries different risks.</p>
            ) : (
              <Link href={marketHref("/job", { trade: trade.slug })} className="btn" style={{ marginTop: 24 }}>Find someone</Link>
            )}
            <p style={{ marginTop: 16 }}><Link href="/trades" className="link">All categories</Link></p>
          </div>
          {hasFittingPicture(trade) && (
            <div className="cat__pic" data-reveal="shutter">
              <Image src={trade.image} alt={trade.imageAlt} fill sizes="(max-width: 820px) 100vw, 40vw" priority />
            </div>
          )}
        </div>

        {!trade.gated && (
          <>
            <div className="cat__split">
              <section className="cat__side cat__side--homes on-accent" aria-labelledby="cat-homes">
                <h2 id="cat-homes" className="display cat__title">Homes asking for this</h2>
                {jobs.length > 0 ? (
                  <ul className="cat__rows">
                    {jobs.slice(0, 4).map((job) => (
                      <li key={job.id}>
                        <b>{job.words}</b>
                        <span className="small">{job.area}, rough area only. {job.when}. {job.replies} of {MAX_REPLIES} replies.</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No homes are asking for this right now.</p>
                )}
                <p className="cat__more"><Link href={marketHref("/jobs", { trade: jobs.length ? trade.slug : undefined })} className="link">{jobs.length ? "Answer these jobs" : "See all jobs"}</Link></p>
                <p className="small">Sample jobs. Nobody posted these.</p>
              </section>

              <section className="cat__side" aria-labelledby="cat-people">
                <h2 id="cat-people" className="display cat__title">People who do this</h2>
                {workers.length > 0 ? (
                  <ul className="cat__rows">
                    {workers.slice(0, 4).map((worker) => (
                      <li key={worker.slug}>
                        <Link href={`/pros/${worker.slug}`} className="link link--quiet"><b>{worker.name}</b></Link>
                        <span className="small num">{worker.area}. {worker.booked} jobs booked, {worker.redone} redone.</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nobody is listed for this yet. Post the job anyway, and see who replies once the site is live.</p>
                )}
                <p className="cat__more"><Link href={marketHref("/workers", { trade: workers.length ? trade.slug : undefined })} className="link">{workers.length ? "Compare these people" : "See all workers"}</Link></p>
                <p className="small">Sample profiles, made up.</p>
              </section>
            </div>

            {deals.length > 0 && (
              <section style={{ marginTop: 64 }} aria-labelledby="cat-deals">
                <h2 id="cat-deals" className="display cat__title">Money off this</h2>
                <DealList deals={deals} />
              </section>
            )}

            <div style={{ marginTop: 64 }}><AdSlot slot="category" /></div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
