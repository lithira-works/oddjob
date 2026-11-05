import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { VerifyForm } from "@/components/VerifyForm";

export const metadata: Metadata = { title: "Confirm who you are", robots: { index: false, follow: false } };

export default function VerifyPage() {
  return (
    <>
      <Nav action={false} />
      <main className="verify__page"><VerifyForm /></main>
    </>
  );
}
