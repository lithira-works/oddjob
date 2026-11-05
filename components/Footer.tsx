import Link from "next/link";
import { tradeBySlug } from "@/lib/data/trades";
import { capitalise } from "@/lib/market";
import { TradeIcon } from "./TradeIcon";

const POPULAR = ["plumber", "electrician", "air-conditioning", "cleaner", "carpenter", "pest-control"];

const COLUMNS = [
  {
    title: "Need a hand?",
    links: [
      { href: "/job", label: "Find someone" },
      { href: "/workers", label: "People ready to work" },
      { href: "/deals", label: "Deals and offers" },
    ],
  },
  {
    title: "Need work?",
    links: [
      { href: "/jobs", label: "Homes that need help" },
      { href: "/trades", label: "Jobs by category" },
      { href: "/signup?side=worker", label: "Join as a worker" },
      { href: "/advertise", label: "Advertise with us" },
    ],
  },
  {
    title: "Oddjob",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Sign up" },
      { href: "/feedback", label: "Send feedback" },
      { href: "/safety", label: "Safety" },
      { href: "/#faq-title", label: "Common questions" },
      { href: "/credits", label: "Picture credits" },
      { href: "#top", label: "Back to top" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="foot on-dark">
      <div className="foot__top">
        <Link href="/" className="display foot__mark">Oddjob</Link>
        <p>Households and the people who fix things. Preview build: every listing is a sample.</p>
      </div>

      <nav className="foot__grid" aria-label="Footer">
        {COLUMNS.slice(0, 2).map((column) => (
          <FooterColumn key={column.title} {...column} />
        ))}
        <div>
          <h2 className="display foot__head">Popular services</h2>
          <ul className="foot__list">
            {POPULAR.map((slug) => {
              const trade = tradeBySlug(slug);
              return trade ? (
                <li key={slug}>
                  <Link href={`/trades/${slug}`} className="foot__link">
                    <TradeIcon slug={slug} size={20} />
                    {trade.service ?? capitalise(trade.name)}
                  </Link>
                </li>
              ) : null;
            })}
            <li><Link href="/trades" className="foot__link foot__link--all">See every category</Link></li>
          </ul>
        </div>
        <FooterColumn {...COLUMNS[2]!} />
      </nav>

      <div className="foot__meta">
        <span>© 2026 Lithira Silva (@li.kkaa). All rights reserved.</span>
        <span>Pictures from Wikimedia Commons and icons from Lucide stay under their own licences.</span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: (typeof COLUMNS)[number]) {
  return (
    <div>
      <h2 className="display foot__head">{title}</h2>
      <ul className="foot__list">
        {links.map((link) => (
          <li key={link.href}>
            {link.href.startsWith("#")
              ? <a href={link.href} className="foot__link">{link.label}</a>
              : <Link href={link.href} className="foot__link">{link.label}</Link>}
          </li>
        ))}
      </ul>
    </div>
  );
}
