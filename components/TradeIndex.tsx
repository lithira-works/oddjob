"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { hasFittingPicture, type Trade } from "@/lib/data/trades";

export function TradeIndex({ trades }: { trades: Trade[] }) {
  const pictured = trades.filter(hasFittingPicture);
  const [active, setActive] = useState(pictured[0]?.image ?? "");
  const images = [...new Set(pictured.map((t) => t.image))];
  const show = (t: Trade) => {
    if (hasFittingPicture(t)) setActive(t.image);
  };

  return (
    <div className="tindex">
      <ul className="tindex__list">
        {trades.map((t) => (
          <li key={t.slug} id={t.slug} data-reveal="row">
            {t.gated ? (
              <div className="tindex__row tindex__row--off">
                <span className="display tindex__name">{t.name}</span>
                <span className="tindex__jobs">{t.jobs}</span>
              </div>
            ) : (
              <Link
                href={`/job?trade=${t.slug}`}
                className="tindex__row"
                onMouseEnter={() => show(t)}
                onFocus={() => show(t)}
              >
                <span className="display tindex__name">{t.name}</span>
                <span className="tindex__jobs">{t.jobs}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
      <div className="tindex__frame" aria-hidden="true">
        {images.map((src) => (
          <Image key={src} src={src} alt="" fill sizes="42vw" className={src === active ? "is-on" : ""} />
        ))}
      </div>
    </div>
  );
}
