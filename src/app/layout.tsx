import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PageTransition } from "@/components/ui/page-transition";
import { AppHeader } from "@/components/layout/app-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Madstudio Booking",
    template: "%s | Madstudio Booking",
  },
  description:
    "Madstudio's booking platform for managing photo studio availability and reservations.",
  applicationName: "Madstudio Booking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-surface text-foreground antialiased`}
      >
        <Providers>
          <AppHeader />
          <PageTransition>
            <main className="px-6 pb-16 pt-10 lg:px-8">{children}</main>
          </PageTransition>
        </Providers>
      </body>
    </html>
  );
}
