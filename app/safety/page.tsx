import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Safety",
  description: "Who sees your details on Oddjob, and when.",
};

const rules = {
  households: [
    ["Post a rough area, not your address", "Your exact address goes only to the person you book, and only when you book them."],
    ["Keep the talk on Oddjob until you book", "Chats hide phone numbers, emails and links. This protects you from strangers as well as protecting the guarantee."],
    ["Don’t pay before the work starts", "On a Protected Job your money waits with us. Nobody on Oddjob should ask you to send a deposit outside it."],
    ["Emergencies come first", "If you smell gas, see fire or someone has had a shock, call your local emergency number before posting anything."],
  ],
  pros: [
    ["Phone and ID before your first reply", "Your profile shows exactly which checks you passed."],
    ["Only booked jobs build your ledger", "Jobs taken outside Oddjob never count towards your jobs, your reviews or your ranking."],
    ["Moving jobs off Oddjob has a cost", "We warn first. Repeats lose ranking, and then the account is suspended."],
    ["Fake leads are refunded", "Report a job that is not real and the credits come back."],
  ],
  data: [
    ["We keep less", "We delete exact addresses from view after a job and on a fixed schedule from storage."],
    ["We never see your card", "Payments run on the payment provider’s own secure pages."],
    ["Your account is protected", "Sign-in uses one-time codes. Changing a phone number or payout account needs a fresh check."],
    ["We screen chats for your safety", "Messages are checked automatically for contact details and fraud. The privacy policy will explain this in full."],
  ],
};

export default function SafetyPage() {
  return (
    <>
      <div id="top"><Nav /></div>
      <main className="page">
        <h1 className="display page__title">Who sees what</h1>
        <section className="facts">
          <table className="whosees">
            <caption className="sr-only">What a tradesperson can see at each stage of a job</caption>
            <thead>
              <tr><th scope="col">When</th><th scope="col" style={{ fontWeight: 500 }}>What they can see</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Before they reply</th><td>Your words, any photo you added, and a rough area</td></tr>
              <tr><th scope="row">After they reply</th><td>A chat with you. Numbers, emails and links stay hidden</td></tr>
              <tr><th scope="row">After you book</th><td>Your exact address and a masked phone line</td></tr>
              <tr><th scope="row">After the job</th><td>Your first name and the job. The address is gone from their view</td></tr>
            </tbody>
          </table>
        </section>

        <div className="pro__pic" data-reveal="shutter">
          <Image src="/images/roof.jpg" alt="Red clay roof tiles with cracked mortar" fill sizes="100vw" />
        </div>

        <section className="rules">
          <div className="rules__side">
            <h2 className="display">If you need work done</h2>
            <div className="rules__pic" data-reveal="shutter"><Image src="/images/leak.jpg" alt="A rusted metal pipe with a leak at its base" fill sizes="(max-width: 820px) 100vw, 40vw" /></div>
          </div>
          <div>{rules.households.map(([t, b]) => <div key={t} data-reveal="row"><h3>{t}</h3><p>{b}</p></div>)}</div>
        </section>
        <section className="rules">
          <div className="rules__side">
            <h2 className="display">If you do the work</h2>
            <div className="rules__pic" data-reveal="shutter"><Image src="/images/brick.jpg" alt="A mason in a straw hat laying a course of blocks" fill sizes="(max-width: 820px) 100vw, 40vw" /></div>
          </div>
          <div>{rules.pros.map(([t, b]) => <div key={t} data-reveal="row"><h3>{t}</h3><p>{b}</p></div>)}</div>
        </section>
        <section className="rules">
          <div className="rules__side">
            <h2 className="display">Your data</h2>
            <div className="rules__pic" data-reveal="shutter"><Image src="/images/fuses.jpg" alt="Rows of circuit breakers in an open fuse box" fill sizes="(max-width: 820px) 100vw, 40vw" /></div>
          </div>
          <div>{rules.data.map(([t, b]) => <div key={t} data-reveal="row"><h3>{t}</h3><p>{b}</p></div>)}</div>
        </section>
        <section className="rules">
          <div className="rules__side"><h2 className="display">Care work</h2></div>
          <div>
            <div data-reveal="row">
              <h3>Babysitting and elder care are not open yet</h3>
              <p>They open only when identity, reference and police checks are running, and a lawyer has reviewed the rules in Sri Lanka.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
