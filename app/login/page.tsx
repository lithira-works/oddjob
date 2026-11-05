import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <Nav action={false} />
      <main><AuthForm mode="login" initialSide="household" /></main>
    </>
  );
}
