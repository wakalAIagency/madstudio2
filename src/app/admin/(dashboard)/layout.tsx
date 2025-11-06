import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireAdmin, getSession } from "@/server/auth/session";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/admin-nav";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/availability", label: "Availability" },
  { href: "/admin/studios", label: "Studios" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin/login");
  }

  const session = await getSession();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="space-y-1">
            <Link href="/admin" className="text-lg font-semibold text-foreground">
              Madstudio Admin
            </Link>
            <p className="text-xs text-muted-foreground">
              Logged in as {session?.user?.email}
            </p>
          </div>
          <form action="/api/auth/signout" method="post">
            <input type="hidden" name="callbackUrl" value="/admin/login" />
            <Button variant="outline" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-4 lg:px-8">
          <AdminNav items={navItems} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">{children}</main>
    </div>
  );
}
