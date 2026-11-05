import Image from "next/image";
import Link from "next/link";
import { AdSlot } from "@/components/AdSlot";
import { DealList } from "@/components/DealList";
import { Footer } from "@/components/Footer";
import { HeroSearch } from "@/components/HeroSearch";
import { boardJobs, MAX_REPLIES } from "@/lib/data/jobs";
import { offers } from "@/lib/data/offers";
import { trades } from "@/lib/data/trades";
import { providerBySlug, providers } from "@/lib/data/providers";
import { TradeIcon } from "@/components/TradeIcon";
import { capitalise, TRADE_GROUPS } from "@/lib/market";

const faqs = [
  {
    q: "What does it cost me?",
    a: "Nothing to post a job or read replies. You pay the person you hire. If you protect the job, a small fee on top holds your money until you sign off.",
  },
  {
    q: "Can I just ask for their number?",
    a: "Numbers stay hidden until you book. After that you talk on a masked line. Take a job off Oddjob and you lose the guarantee, the receipt and the review.",
  },
  {
    q: "How are people checked?",
    a: "Everyone confirms their phone and ID before their first reply. Their profile says exactly which checks they passed, and which they have not done.",
  },
  {
    q: "What if the work is bad?",
    a: "On a Protected Job your money stays held until you sign off. If it goes wrong, tell us before you do. We review the photos and messages, then decide who gets paid.",
  },
  {
    q: "Can I find a babysitter here?",
    a: "Not yet. Care for children and older people opens only once identity, reference and police checks are in place, because those jobs carry different risks.",
  },
  {
    q: "I do this work. How do I get jobs?",
    a: "Create a profile and see the jobs near you. You spend a few credits to answer a job you want, and a fake lead gets those credits back.",
  },
];

export default function HomePage() {
  const sample = providerBySlug("tomas-k")!;
  const openJobs = boardJobs.filter((job) => job.replies < MAX_REPLIES).slice(0, 3);
  const someWorkers = [...providers].sort((a, b) => b.rehired - a.rehired).slice(0, 3);
  return (
    <>
      <HeroSearch />

      <main>
        <section className="section section--near" aria-labelledby="trades-title">
          <div className="cathead">
            <h2 id="trades-title" className="display head" data-reveal="">Every odd job has someone</h2>
            <Link href="/trades" className="link">See every category</Link>
          </div>
          <div className="catgrid">
            {TRADE_GROUPS.map((group) => (
              <div key={group}>
                <h3 className="catgrid__group">{group}</h3>
                <ul>
                  {trades
                    .filter((t) => t.group === group && t.featured)
                    .map((t, i) => (
                      <li key={t.slug} data-reveal="row" style={{ "--i": i } as React.CSSProperties}>
                        <Link className={`catlink ${t.gated ? "catlink--off" : ""}`} href={`/trades/${t.slug}`}>
                          <TradeIcon slug={t.slug} size={28} />
                          <span className="catlink__text">
                            <span className="catlink__name">{t.service ?? capitalise(t.name)}</span>
                            <span className="catlink__jobs small">{t.jobs}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="sides" aria-label="The two sides of Oddjob">
          <div className="sides__half">
            <h2 className="display sides__title" data-reveal="">Need a hand?</h2>
            <p className="lead">Browse people by trade, and compare what they’ve actually done.</p>
            <ul className="cat__rows">
              {someWorkers.map((worker) => (
                <li key={worker.slug}>
                  <Link href={`/pros/${worker.slug}`} className="link link--quiet"><b>{worker.name}</b></Link>
                  <span className="small num">{worker.area}. {worker.booked} jobs booked, {worker.rehired} homes called back.</span>
                </li>
              ))}
            </ul>
            <div className="sides__act">
              <Link href="/workers" className="btn btn--ink">See people ready to work</Link>
              <p className="small">Sample profiles, made up.</p>
            </div>
          </div>
          <div className="sides__half sides__half--blue on-accent">
            <h2 className="display sides__title" data-reveal="">Need work?</h2>
            <p className="lead">See what households near you need done, and answer the jobs you want.</p>
            <ul className="cat__rows">
              {openJobs.map((job) => (
                <li key={job.id}>
                  <b>{job.words}</b>
                  <span className="small">{job.area}, rough area only. {job.when}.</span>
                </li>
              ))}
            </ul>
            <div className="sides__act">
              <Link href="/jobs" className="btn btn--white">See homes that need help</Link>
              <p className="small">Sample jobs. Nobody posted these.</p>
            </div>
          </div>
        </section>

        <div className="section"><AdSlot slot="home-top" /></div>

        <section className="section" aria-label="How it works">
          <div className="steps">
            <div className="step" data-reveal="">
              <h2 className="display">First, say what’s wrong</h2>
              <p>No trade names and no forms. Write it the way you’d tell a neighbour, and we work out who to ask.</p>
            </div>
            <div className="step" data-reveal="">
              <h3 className="display">Then up to five reply</h3>
              <p>Each one spends credits to answer you, so you only hear from people who want this job.</p>
            </div>
            <div className="step" data-reveal="">
              <h3 className="display">You choose by the work</h3>
              <p>Jobs they finished, how many were redone, and how many homes called them back.</p>
            </div>
            <div className="step" data-reveal="">
              <h3 className="display">Pay when it’s done</h3>
              <p>Protect the job and your money waits until you sign off. If it goes wrong, we step in.</p>
            </div>
          </div>
        </section>

        <section className="section work" aria-labelledby="work-title">
          <div className="work__title">
            <h2 id="work-title" className="display head" data-reveal="">Judge the work</h2>
            <p data-reveal="" style={{ "--i": 1 } as React.CSSProperties}>
              Star ratings all look alike. A work ledger counts jobs booked here, jobs that had to be redone, and homes that called the same person back. Only booked jobs count.
            </p>
          </div>
          <div className="work__proof">
            <div className="work__media" data-reveal="shutter">
              <video autoPlay muted loop playsInline preload="metadata" poster="/images/planer-poster.jpg" aria-hidden="true" width={854} height={480}>
                <source src="/images/planer.webm" type="video/webm" />
              </video>
            </div>
            <div className="ledger" data-ui="" data-reveal="" style={{ "--i": 1 } as React.CSSProperties}>
              <div className="ledger__who">
                <span className="ledger__name">{sample.name}, carpenter</span>
                <Link href={`/pros/${sample.slug}`} className="link">Read the ledger</Link>
              </div>
              <div className="ledger__figures">
                <div className="ledger__figure"><b>{sample.booked}</b><span>jobs booked</span></div>
                <div className="ledger__figure"><b>{sample.redone}</b><span>had to be redone</span></div>
                <div className="ledger__figure"><b>{sample.rehired}</b><span>homes called back</span></div>
              </div>
              <p className="small soft" style={{ marginTop: 20 }}>Sample profile. This person and these figures are made up.</p>
            </div>
            <div className="work__media" data-reveal="shutter">
              <Image src="/images/plane.jpg" alt="A wooden hand plane with curled shavings and a red pencil" fill sizes="(max-width: 820px) 100vw, 50vw" />
            </div>
          </div>
        </section>

        <section className="section homedeals" aria-labelledby="deals-title">
          <div className="homedeals__title">
            <h2 id="deals-title" className="display head" data-reveal="">Money off the odd job</h2>
            <p style={{ marginTop: 20 }}><Link href="/deals" className="link">See every deal</Link></p>
          </div>
          <div className="homedeals__list">
            <DealList deals={offers.slice(0, 3)} />
            <p className="small" style={{ marginTop: 12 }}>Sample offers. These are made up, and none can be redeemed yet.</p>
          </div>
        </section>

        <div className="section"><AdSlot slot="home-lower" /></div>

        <section className="private" aria-labelledby="private-title">
          <div className="private__pic" data-reveal="shutter">
            <Image src="/images/paint.jpg" alt="A roller painting a brick wall bright orange" fill sizes="(max-width: 820px) 100vw, 50vw" />
          </div>
          <div className="private__text">
            <h2 id="private-title" className="display" data-reveal="">Your address stays yours</h2>
            <table className="whosees" data-reveal="" style={{ "--i": 1 } as React.CSSProperties}>
              <caption className="sr-only">What a tradesperson can see at each stage</caption>
              <tbody>
                <tr><th scope="row">Before they reply</th><td>Your words and a rough area</td></tr>
                <tr><th scope="row">After they reply</th><td>A chat, with numbers hidden</td></tr>
                <tr><th scope="row">After you book</th><td>Your exact address and a masked line</td></tr>
                <tr><th scope="row">After the job</th><td>The address is gone from their view</td></tr>
              </tbody>
            </table>
            <p style={{ marginTop: 24 }}><Link href="/safety" className="link">How we keep you safe</Link></p>
          </div>
        </section>

        <section className="plan" aria-label="Pricing">
          <h2 className="display" data-reveal="">Asking costs <span className="plan__price">0</span></h2>
          <div className="plan__foot">
            <p data-reveal="" style={{ "--i": 1 } as React.CSSProperties}>
              Post as many jobs as you need. Pros pay a few credits to answer one. You pay the person you hire, plus a small fee only if you protect the job.
            </p>
            <div className="plan__act" data-reveal="" style={{ "--i": 2 } as React.CSSProperties}>
              <Link href="/job" className="btn">Find someone</Link>
              <Link href="/jobs" className="link">See what pros pay</Link>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="faq-title">
          <h2 id="faq-title" className="display head" data-reveal="">What people ask first</h2>
          <div className="faq__list">
            {faqs.map((f, i) => (
              <details className="faq__item" key={f.q} data-reveal="row" style={{ "--i": i } as React.CSSProperties}>
                <summary>{f.q}<span className="faq__chev" aria-hidden="true" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="close on-warm" aria-label="Find someone">
          <h2 className="display" data-reveal="">Still leaking?</h2>
          <div className="close__foot">
            <p data-reveal="" style={{ "--i": 1 } as React.CSSProperties}>Say what’s wrong. It takes less time than finding a bucket.</p>
            <Link href="/job" className="btn btn--ink" data-reveal="" style={{ "--i": 2 } as React.CSSProperties}>Find someone</Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
