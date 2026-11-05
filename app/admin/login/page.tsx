import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminForms";
import { readAdminConfig } from "@/lib/admin-crypto";
import { currentAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Admin log in" };

export default async function AdminLoginPage() {
  if (await currentAdmin()) redirect("/admin");
  // Only on a developer's machine. A live site never says whether an account exists.
  const showSetup = process.env.NODE_ENV !== "production" && !readAdminConfig();

  return (
    <main className="auth admin__login">
      <div className="auth__panel auth__panel--login">
        <Link href="/" className="display nav__mark">Oddjob</Link>
        <h1 className="display auth__title">Admin log in</h1>
      </div>
      <div className="auth__main">
        <p className="admin__about">For the people running Oddjob. Households and workers <Link href="/login" className="link">log in here</Link>.</p>
        {showSetup && (
          <p className="sample-note auth__preview" role="status">
            No admin account yet. In a terminal, run: npm run admin:create -- name@example.com
          </p>
        )}
        <AdminLoginForm />
      </div>
    </main>
  );
}
