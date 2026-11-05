import Link from "next/link";
import { Nav } from "@/components/Nav";

export default function NotFound() {
  return (
    <>
      <Nav action={false} />
      <main className="page">
        <h1 className="display page__title">Nothing here</h1>
        <p style={{ marginBottom: 24 }}>This page doesn’t exist. Your leak still might.</p>
        <Link href="/job" className="btn">Find someone</Link>
      </main>
    </>
  );
}
