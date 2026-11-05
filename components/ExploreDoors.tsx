import { Briefcase, Users } from "lucide-react";
import Link from "next/link";
import { marketHref } from "@/lib/market";

const DOORS = {
  jobs: { path: "/jobs", label: "Find work", Icon: Briefcase },
  workers: { path: "/workers", label: "Find workers", Icon: Users },
} as const;

/** The band at the top of both lists: which side you're on, a headline, and the tools. */
export function ExploreBand({ side, trade, title, action, children }: {
  side: keyof typeof DOORS;
  trade?: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <header className={`band band--${side} ${side === "jobs" ? "on-accent" : ""}`}>
      <nav className="doors" aria-label="Sides of the market">
        {(Object.keys(DOORS) as (keyof typeof DOORS)[]).map((key) => {
          const { path, label, Icon } = DOORS[key];
          return (
            <Link key={key} className={`door ${key === side ? "is-on" : ""}`} href={marketHref(path, { trade })} aria-current={key === side ? "page" : undefined}>
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="band__head">
        <h1 className="display band__title">{title}</h1>
        {action}
      </div>
      {children}
    </header>
  );
}
