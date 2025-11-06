"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/book", label: "Book" },
  { href: "/admin", label: "Admin" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-wide">
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-alt">
            <Image
              src="/madstudio-logo.jpg"
              alt="Madstudio logo"
              fill
              sizes="36px"
              className="object-cover"
              priority
            />
          </span>
          <span className="text-xl font-semibold text-foreground">Madstudio</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative transition-colors",
                  isActive ? "text-accent" : "hover:text-foreground",
                )}
              >
                {link.label}
                {isActive ? (
                  <span className="absolute inset-x-0 -bottom-2 h-0.5 rounded-full bg-accent" />
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
