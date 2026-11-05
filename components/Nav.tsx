"use client";

import { BadgePercent, Briefcase, ChevronDown, LayoutGrid, Search, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { capitalise, TRADE_GROUPS, tradesInGroup } from "@/lib/market";
import { endPreviewSession, usePreviewSession } from "@/lib/preview-session";
import { TradeIcon } from "./TradeIcon";

const LINKS = [
  { href: "/jobs", label: "Find work" },
  { href: "/workers", label: "Workers" },
  { href: "/deals", label: "Deals", tone: "nav__link--deals" },
];

const TABS = [
  { href: "/trades", label: "Categories", Icon: LayoutGrid },
  { href: "/workers", label: "Workers", Icon: Users },
  { href: "/job", label: "Find someone", Icon: Search, tone: "tabbar__item--main" },
  { href: "/jobs", label: "Find work", Icon: Briefcase },
  { href: "/deals", label: "Deals", Icon: BadgePercent, tone: "tabbar__item--deals" },
];

/** `after-hero` keeps the button out of the way until the hero's own form has scrolled off. */
export function Nav({ action = true, over = false }: { action?: boolean | "after-hero"; over?: boolean }) {
  const path = usePathname();
  const isOn = (href: string) => path === href || path.startsWith(`${href}/`);
  const menu = useRef<HTMLDetailsElement>(null);
  const [pastHero, setPastHero] = useState(false);
  const session = usePreviewSession();

  useEffect(() => {
    if (action !== "after-hero") return;
    const hero = document.getElementById("top");
    if (!hero) return;
    const watch = new IntersectionObserver(([entry]) => setPastHero(!entry!.isIntersecting));
    watch.observe(hero);
    return () => watch.disconnect();
  }, [action]);

  useEffect(() => {
    const close = () => { if (menu.current) menu.current.open = false; };
    const onPress = (e: PointerEvent) => { if (!menu.current?.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menu.current?.open) {
        close();
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPress);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPress);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const closeMenu = () => { if (menu.current) menu.current.open = false; };

  return (
    <>
      <header className={`nav ${over ? "nav--over" : ""}`}>
        <Link href="/" className="display nav__mark">Oddjob</Link>
        <nav className="nav__links" aria-label="Main">
          <details className="navmenu" ref={menu}>
            <summary className="nav__link" aria-current={isOn("/trades") ? "page" : undefined}>
              Categories
              <ChevronDown className="navmenu__chev" size={16} aria-hidden="true" />
            </summary>
            <div className="navmenu__panel">
              {TRADE_GROUPS.map((group) => (
                <div key={group}>
                  <h2 className="catgrid__group">{group}</h2>
                  <ul>
                    {tradesInGroup(group).map((t) => (
                      <li key={t.slug}>
                        <Link href={`/trades/${t.slug}`} className="navmenu__item" onClick={closeMenu}>
                          <TradeIcon slug={t.slug} size={20} />
                          <span>{t.service ?? capitalise(t.name)}{t.gated ? ", closed for now" : ""}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <Link href="/trades" className="link navmenu__all" onClick={closeMenu}>See every category</Link>
            </div>
          </details>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={`nav__link ${link.tone ?? ""}`} aria-current={isOn(link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
          <Link href="/safety" className="nav__link nav__hide" aria-current={isOn("/safety") ? "page" : undefined}>Safety</Link>
        </nav>
        <div className="nav__auth">
          {session ? (
            <>
              <span className="nav__who" title="Preview account">{session.firstName ? `Hi, ${session.firstName}` : "Preview account"}</span>
              <button type="button" className="nav__link" onClick={endPreviewSession}>Log out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav__link" aria-current={isOn("/login") ? "page" : undefined}>Log in</Link>
              <Link href="/signup" className="nav__link nav__signup" aria-current={isOn("/signup") ? "page" : undefined}>Sign up</Link>
            </>
          )}
        </div>
        {action && (
          <Link
            href="/job"
            className={`btn btn--small nav__action ${action === "after-hero" && !pastHero ? "nav__action--wait" : ""}`}
          >
            Find someone
          </Link>
        )}
      </header>

      {path !== "/job" && (
        <nav className="tabbar" aria-label="Quick links">
          {TABS.map(({ href, label, Icon, tone }) => (
            <Link key={href} href={href} className={`tabbar__item ${tone ?? ""}`} aria-current={isOn(href) ? "page" : undefined}>
              <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
