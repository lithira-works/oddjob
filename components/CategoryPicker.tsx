"use client";

import { capitalise, marketHref, tradesInGroup, TRADE_GROUPS } from "@/lib/market";
import { TradeIcon } from "./TradeIcon";

type Props = {
  path: string;
  current?: string;
  counts: Record<string, number>;
  total: number;
  /** Other filter settings to keep in each link. */
  keep: Record<string, string | undefined>;
  onPick: (trade: string | undefined) => void;
};

/** Plain clicks filter in place. Links still work without script, and in a new tab. */
export function followInPlace(event: React.MouseEvent, act: () => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  act();
}

/** A list on larger screens, the phone's own picker on small ones. Only trades with listings show. */
export function CategoryPicker({ path, current, counts, total, keep, onPick }: Props) {
  const groups = TRADE_GROUPS.map((group) => ({
    group,
    trades: tradesInGroup(group).filter((t) => counts[t.slug] || t.slug === current),
  })).filter((g) => g.trades.length > 0);

  return (
    <>
      <form className="picker__phone field" action={path} method="get">
        <label htmlFor="category-select" style={{ fontWeight: 500 }}>Category</label>
        <select
          id="category-select"
          name="trade"
          className="input"
          value={current ?? ""}
          onChange={(e) => onPick(e.target.value || undefined)}
        >
          <option value="">All categories ({total})</option>
          {groups.map(({ group, trades }) => (
            <optgroup key={group} label={group}>
              {trades.map((t) => (
                <option key={t.slug} value={t.slug}>{capitalise(t.name)} ({counts[t.slug] ?? 0})</option>
              ))}
            </optgroup>
          ))}
        </select>
        <noscript><button type="submit" className="btn btn--small btn--ghost">Show</button></noscript>
      </form>

      <nav className="picker__list" aria-label="Categories">
        <a
          className="picker__item"
          href={marketHref(path, { ...keep, trade: undefined })}
          aria-current={current ? undefined : "true"}
          onClick={(e) => followInPlace(e, () => onPick(undefined))}
        >
          <span>All categories</span>
          <span className="num">{total}</span>
        </a>
        {groups.map(({ group, trades }) => (
          <div key={group}>
            <h2 className="picker__group">{group}</h2>
            <ul>
              {trades.map((t) => (
                <li key={t.slug}>
                  <a
                    className="picker__item"
                    href={marketHref(path, { ...keep, trade: t.slug })}
                    aria-current={current === t.slug ? "true" : undefined}
                    onClick={(e) => followInPlace(e, () => onPick(t.slug))}
                  >
                    <span className="picker__name"><TradeIcon slug={t.slug} size={18} />{capitalise(t.name)}</span>
                    <span className="num">{counts[t.slug] ?? 0}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
