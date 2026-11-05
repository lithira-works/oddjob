import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import credits from "@/lib/data/credits.json";

export const metadata: Metadata = { title: "Picture credits" };

export default function CreditsPage() {
  return (
    <>
      <Nav />
      <main className="page">
        <h1 className="display page__title">Picture credits</h1>
        <p style={{ marginBottom: 32 }}>
          These pictures show the world of each trade. None of them shows an Oddjob customer, worker or job. They are cropped to fit, and any other change is noted beside the picture.
        </p>
        <p style={{ marginBottom: 32 }}>
          Category icons are from <a className="link" href="https://lucide.dev" rel="noopener noreferrer" target="_blank">Lucide</a>, under the ISC licence.
        </p>
        <ul className="creditlist">
          {credits.map((c) => (
            <li key={c.file}>
              <b>{c.title}</b>
              {c.creator ? `${c.creator}. ` : ""}
              <a className="link" href={c.licenseUrl} rel="noopener noreferrer license" target="_blank">{c.license}</a>
              {". "}
              <a className="link" href={c.page} rel="noopener noreferrer" target="_blank">Source</a>
              {c.changes ? `. ${c.changes}` : ""}
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
