import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { AD_SLOTS } from "@/lib/data/ads";

export const metadata: Metadata = {
  title: "Advertise",
  description: "Banner spaces on Oddjob, and the rules every ad follows.",
};

export default function AdvertisePage() {
  return (
    <>
      <div id="top"><Nav /></div>
      <main className="page">
        <h1 className="display head page__title--tight">Put your ad here</h1>
        <p className="lead">Tools, paint, hardware and building supplies, seen by people with a job to do.</p>
        <p className="sample-note" style={{ marginTop: 20 }}>Preview: ad booking isn’t open yet. Prices and audience figures come once real people use the site.</p>

        <div className="rules" style={{ marginTop: 64 }}>
          <div className="rules__side">
            <h2 className="display">Where ads go</h2>
          </div>
          <div>
            <table className="whosees" style={{ marginTop: 0 }}>
              <caption className="sr-only">The banner spaces on Oddjob</caption>
              <tbody>
                {Object.values(AD_SLOTS).map((place) => (
                  <tr key={place}>
                    <th scope="row">{place}</th>
                    <td>Banner, 1600 by 400 pixels, with an 800 by 400 version for phones</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rules">
          <div className="rules__side">
            <h2 className="display">The rules</h2>
          </div>
          <div>
            <div data-reveal="row"><h3>Always labelled</h3><p>Every ad says it’s an advertisement, and who it’s from.</p></div>
            <div data-reveal="row" style={{ "--i": 1 } as React.CSSProperties}><h3>No tracking</h3><p>Ads are plain pictures and links. No ad network, and no tracking scripts.</p></div>
            <div data-reveal="row" style={{ "--i": 2 } as React.CSSProperties}><h3>Nothing from a household reaches you</h3><p>Advertisers never get job words, areas, addresses or messages.</p></div>
            <div data-reveal="row" style={{ "--i": 3 } as React.CSSProperties}><h3>Kept out of the job itself</h3><p>No ads while someone describes a job, chats, books or pays, and none next to emergency notices.</p></div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
