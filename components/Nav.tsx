"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/trades", label: "Categories" },
  { href: "/jobs", label: "Jobs" },
  { href: "/workers", label: "Workers" },
  { href: "/deals", label: "Deals" },
];

export function Nav({ action = true }: { action?: boolean }) {
  const path = usePathname();
  const isOn = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <header className="nav">
      <Link href="/" className="display nav__mark">Oddjob</Link>
      <nav className="nav__links" aria-label="Main">
        {LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={`link ${isOn(link.href) ? "" : "link--quiet"}`} aria-current={isOn(link.href) ? "page" : undefined}>
            {link.label}
          </Link>
        ))}
        <Link href="/safety" className={`link nav__hide ${isOn("/safety") ? "" : "link--quiet"}`} aria-current={isOn("/safety") ? "page" : undefined}>Safety</Link>
      </nav>
      {action && <Link href="/job" className="btn btn--small nav__action">Find someone</Link>}
    </header>
  );
}
