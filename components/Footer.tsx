import Link from "next/link";

export function Footer() {
  return (
    <footer className="foot on-accent">
      <div className="foot__top">
        <div className="foot__notes">
          <span className="display foot__mark">Oddjob</span>
          <span>Households and the people who fix things. Preview build: every listing is a sample.</span>
        </div>
        <a href="#top" className="link">Back to top</a>
      </div>
      <div>
        <Link href="/board" className="display foot__big">I do this work</Link>
        <div className="foot__meta">
          <nav aria-label="Footer">
            <Link href="/trades" className="link link--quiet">Trades</Link>
            <Link href="/safety" className="link link--quiet">Safety</Link>
            <Link href="/credits" className="link link--quiet">Picture credits</Link>
          </nav>
          <span>Pictures from Wikimedia Commons, credited by name</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
