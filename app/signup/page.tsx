import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { Nav } from "@/components/Nav";
import { parseSide } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign up", description: "Join Oddjob to get something fixed, or to find work." };

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { side } = await searchParams;
  return (
    <>
      <Nav action={false} />
      <main><AuthForm mode="signup" initialSide={parseSide(Array.isArray(side) ? side[0] : side)} /></main>
    </>
  );
}
