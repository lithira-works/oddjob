import Link from "next/link";
import { marketHref } from "@/lib/market";

const DOORS = {
  jobs: { path: "/jobs", title: "Homes that need help", note: "For people who do the work. Answer the jobs you want." },
  workers: { path: "/workers", title: "People ready to work", note: "For households. Compare people by the work they’ve done." },
} as const;

/** The two sides of the market. The page you are on is the headline, and the other is one tap away. */
export function ExploreDoors({ side, trade }: { side: keyof typeof DOORS; trade?: string }) {
  return (
    <div className="doors">
      {(Object.keys(DOORS) as (keyof typeof DOORS)[]).map((key) => {
        const door = DOORS[key];
        return key === side ? (
          <div className="door is-on" key={key}>
            <h1 className="display door__title">{door.title}</h1>
            <span className="door__note">{door.note}</span>
          </div>
        ) : (
          <Link className="door" key={key} href={marketHref(door.path, { trade })}>
            <span className="display door__title">{door.title}</span>
            <span className="door__note">{door.note}</span>
          </Link>
        );
      })}
    </div>
  );
}
