"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { hasFittingPicture, type Trade } from "@/lib/data/trades";
import { marketHref, tradesInGroup, TRADE_GROUPS } from "@/lib/market";
import { TradeIcon } from "./TradeIcon";

const fits = (trade: Trade, query: string) =>
  !query ||
  trade.name.toLowerCase().includes(query) ||
  trade.jobs.toLowerCase().includes(query) ||
  trade.words.some((word) => word.includes(query));

export function TradeIndex({ trades }: { trades: Trade[] }) {
  const pictured = trades.filter(hasFittingPicture);
  const [active, setActive] = useState(pictured[0]?.image ?? "");
  const [search, setSearch] = useState("");
  const images = [...new Set(pictured.map((t) => t.image))];
  const query = search.trim().toLowerCase();
  const show = (t: Trade) => {
    if (hasFittingPicture(t)) setActive(t.image);
  };

  const groups = useMemo(
    () => TRADE_GROUPS.map((group) => ({ group, trades: tradesInGroup(group).filter((t) => fits(t, query)) })).filter((g) => g.trades.length > 0),
    [query],
  );

  return (
    <div className="tindex">
      <div className="tindex__list">
        <label className="field tindex__search">
          <span>Search by trade or by what’s wrong</span>
          <input type="search" className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Termites, wiring, stuck gate" maxLength={80} autoComplete="off" />
        </label>

        {groups.length === 0 && (
          <div className="market__empty">
            <p>No category matches that. Say it in your own words and we’ll work out who to ask.</p>
            <Link href={marketHref("/job", { q: search.trim() })} className="btn">Find someone</Link>
          </div>
        )}

        {groups.map(({ group, trades: inGroup }) => (
          <section key={group} className="tindex__group" aria-labelledby={`group-${group}`}>
            <h2 id={`group-${group}`} className="tindex__groupname">{group}</h2>
            <ul>
              {inGroup.map((t) => (
                <li key={t.slug} id={t.slug} data-reveal="row">
                  <Link
                    href={`/trades/${t.slug}`}
                    className={`tindex__row ${t.gated ? "tindex__row--off" : ""}`}
                    onMouseEnter={() => show(t)}
                    onFocus={() => show(t)}
                  >
                    <span className="tindex__label">
                      <TradeIcon slug={t.slug} size={28} />
                      <span className="display tindex__name">{t.name}</span>
                    </span>
                    <span className="tindex__jobs">{t.jobs}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="tindex__frame" aria-hidden="true">
        <div className="tindex__pictures">
          {images.map((src) => (
            <Image key={src} src={src} alt="" fill sizes="42vw" loading={src === images[0] ? "eager" : "lazy"} className={src === active ? "is-on" : ""} />
          ))}
        </div>
      </div>
    </div>
  );
}
