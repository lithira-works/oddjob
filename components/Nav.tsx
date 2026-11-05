import Link from "next/link";

export function Nav({ action = true }: { action?: boolean }) {
  return (
    <header className="nav">
      <Link href="/" className="display nav__mark">Oddjob</Link>
      <nav className="nav__links" aria-label="Main">
        <Link href="/trades" className="link link--quiet">Trades</Link>
        <Link href="/safety" className="link link--quiet nav__hide">Safety</Link>
        <Link href="/board" className="link link--quiet">For pros</Link>
        {action && <Link href="/job" className="btn btn--small">Find someone</Link>}
      </nav>
    </header>
  );
}
