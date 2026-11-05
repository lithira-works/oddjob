import Image from "next/image";
import Link from "next/link";
import { adFor, type AdSlotId } from "@/lib/data/ads";

/** One banner space. Shows the ad booked for today, or offers the space for hire. */
export function AdSlot({ slot }: { slot: AdSlotId }) {
  const ad = adFor(slot);

  if (!ad) {
    return (
      <aside className="ad ad--open" aria-label="Advertising space">
        <span className="display ad__words">Your ad here</span>
        <span className="ad__pitch">
          Sell tools, paint or hardware? Reach people mid-job.{" "}
          <Link href="/advertise" className="link">Advertise on Oddjob</Link>
        </span>
      </aside>
    );
  }

  return (
    <aside className="ad" aria-label="Advertisement">
      <a href={ad.href} target="_blank" rel="sponsored noopener noreferrer" className="ad__frame">
        <Image className="ad__wide" src={ad.image} alt={ad.alt} fill sizes="100vw" />
        <Image className="ad__phone" src={ad.imagePhone} alt={ad.alt} fill sizes="100vw" />
      </a>
      <span className="ad__tag small">Advertisement from {ad.advertiser}</span>
    </aside>
  );
}
