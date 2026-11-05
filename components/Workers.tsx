"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import type { Provider } from "@/lib/data/providers";
import { tradeBySlug } from "@/lib/data/trades";
import { capitalise, countByTrade, filterWorkers, marketHref, WORKER_SORTS, type WorkerSort } from "@/lib/market";
import { AdSlot } from "./AdSlot";
import { CategoryPicker, followInPlace } from "./CategoryPicker";
import { ExploreDoors } from "./ExploreDoors";
import { TradeIcon } from "./TradeIcon";

/** Which person in the list the ad space follows. */
const AD_AFTER = 4;

export function WorkerRow({ worker }: { worker: Provider }) {
  return (
    <li data-reveal="row">
      <Link href={`/pros/${worker.slug}`} className="workrow">
        <span className="workrow__who">
          <span className="display workrow__name">{worker.name}</span>
          <span className="tradetag small"><TradeIcon slug={worker.tradeSlug} size={18} /><span className="cap">{tradeBySlug(worker.tradeSlug)?.name}</span></span>
          <span className="small">{worker.area}. {worker.arrives}.</span>
        </span>
        <span className="workrow__about">{worker.about}</span>
        <span className="workrow__figures small num">
          <span><b>{worker.booked}</b> jobs booked</span>
          <span><b>{worker.redone}</b> redone</span>
          <span><b>{worker.rehired}</b> called back</span>
        </span>
        <span className="workrow__go small">See their work</span>
      </Link>
    </li>
  );
}

export function Workers({ initialTrade, initialSort, initialToday }: { initialTrade?: string; initialSort: WorkerSort; initialToday: boolean }) {
  const [trade, setTrade] = useState(initialTrade);
  const [sort, setSort] = useState(initialSort);
  const [today, setToday] = useState(initialToday);
  const [search, setSearch] = useState("");

  const address = (t: string | undefined, s: WorkerSort, d: boolean) =>
    marketHref("/workers", { trade: t, sort: s === "nearest" ? undefined : s, today: d ? "1" : undefined });

  const apply = (t: string | undefined, s: WorkerSort, d: boolean) => {
    setTrade(t);
    setSort(s);
    setToday(d);
    window.history.replaceState(null, "", address(t, s, d));
  };

  const inScope = useMemo(() => filterWorkers({ today, search }), [today, search]);
  const counts = useMemo(() => countByTrade(inScope), [inScope]);
  const workers = useMemo(() => filterWorkers({ trade, today, search, sort }), [trade, today, search, sort]);
  const chosen = tradeBySlug(trade);
  const askHref = marketHref("/job", { trade: chosen?.gated ? undefined : trade });

  return (
    <>
      <ExploreDoors side="workers" trade={trade} />

      <div className="market">
        <aside className="market__side">
          <Link href={askHref} className="btn market__cta">Find someone</Link>
          <p className="small market__ctanote">Say what’s wrong and up to five people reply. It costs nothing to ask.</p>
          <CategoryPicker
            path="/workers"
            current={trade}
            counts={counts}
            total={inScope.length}
            keep={{ sort: sort === "nearest" ? undefined : sort, today: today ? "1" : undefined }}
            onPick={(next) => apply(next, sort, today)}
          />
        </aside>

        <div className="market__main">
          <p>
            Numbers come from booked jobs, not star ratings. Sample profiles: these people and their figures are made up.
          </p>

          <p className="market__count small" aria-live="polite">
            {workers.length} {workers.length === 1 ? "sample person" : "sample people"}{chosen ? ` listed as ${chosen.article} ${chosen.name}` : ""}
          </p>

          <div className="market__tools">
            <label className="field market__search">
              <span>Search these people</span>
              <input type="search" className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, trade or kind of work" maxLength={80} autoComplete="off" />
            </label>
            <div className="seg" role="group" aria-label="Sort and filter">
              {(Object.keys(WORKER_SORTS) as WorkerSort[]).map((option) => (
                <a
                  key={option}
                  className="seg__item"
                  href={address(trade, option, today)}
                  aria-current={sort === option ? "true" : undefined}
                  onClick={(e) => followInPlace(e, () => apply(trade, option, today))}
                >
                  {WORKER_SORTS[option]}
                </a>
              ))}
              <a
                className="seg__item"
                href={address(trade, sort, !today)}
                aria-current={today ? "true" : undefined}
                onClick={(e) => followInPlace(e, () => apply(trade, sort, !today))}
              >
                Can come today
              </a>
            </div>
          </div>

          {workers.length > 0 ? (
            <ul className="worklist">
              {workers.map((worker, i) => (
                <Fragment key={worker.slug}>
                  <WorkerRow worker={worker} />
                  {i === AD_AFTER - 1 && <li className="market__ad"><AdSlot slot="workers" /></li>}
                </Fragment>
              ))}
              {workers.length < AD_AFTER && <li className="market__ad"><AdSlot slot="workers" /></li>}
            </ul>
          ) : (
            <div className="market__empty">
              {chosen?.gated ? (
                <p>{capitalise(chosen.name)}s stay closed until our safety checks are in place.</p>
              ) : (
                <p>Nobody matches right now. Try another category, or clear your search.</p>
              )}
              <button type="button" className="btn btn--ghost btn--small" onClick={() => { setSearch(""); apply(undefined, "nearest", false); }}>
                Show everyone
              </button>
            </div>
          )}

          <p style={{ marginTop: 24 }}>
            Looking for work instead? <Link href="/jobs" className="link">See homes that need help</Link>. Listing your own profile opens with accounts.
          </p>
        </div>
      </div>
    </>
  );
}
