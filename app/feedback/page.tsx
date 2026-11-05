import type { Metadata } from "next";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = { title: "Feedback", description: "Tell us what to fix on Oddjob." };

export default function FeedbackPage() {
  return (
    <>
      <Nav />
      <main className="page">
        <h1 className="display page__title">Tell us what to fix</h1>
        <div className="feedback">
          <div className="feedback__about">
            <p className="lead">Something confusing, broken or missing? This is how the site gets better.</p>
            <p>Your note is used only to improve Oddjob. We keep the note and the time you sent it, and no account, IP address or browser details.</p>
          </div>
          <div className="feedback__form"><FeedbackForm /></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
