/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listStudios } from "@/server/services/studios";

const highlights = [
  {
    title: "Reserve with Ease",
    description:
      "Browse real-time availability, request a slot, and receive updates instantly.",
  },
  {
    title: "Admin Control",
    description:
      "Approve or decline bookings, manage availability, and keep the calendar on track.",
  },
  {
    title: "Automated Notifications",
    description:
      "Stay in sync with email confirmations and calendar invites for confirmed sessions.",
  },
];

export default async function Home() {
  const studios = await listStudios();
  const mainStudio = studios[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 py-12">
      <section className="grid gap-12 overflow-hidden rounded-3xl border border-border/40 bg-surface-alt/60 p-10 shadow-xl shadow-[var(--surface-glow)] lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Crafted by Madstudio
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Elevate every shoot with effortless booking and neon pace.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            {mainStudio?.description ??
              "Inspired by our studio spark, the new Madstudio booking hub keeps availability crystal clear, approvals fast, and every session wrapped in a vibrant glow."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/book">Book a session</Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="border-accent/40 text-accent hover:bg-accent/10">
              <Link href="/admin">Admin dashboard</Link>
            </Button>
          </div>
        </div>
        <Card className="border border-border/40 bg-surface/60 shadow-lg shadow-[var(--surface-glow)]">
          <CardHeader>
            <CardTitle className="text-accent">Today&apos;s Studio Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-between rounded-xl bg-surface-alt/80 px-4 py-3">
              <span className="font-medium text-foreground">Available Slots</span>
              <span>10:00 • 11:00 • 14:00</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-alt/80 px-4 py-3">
              <span className="font-medium text-foreground">Pending Requests</span>
              <span>2 awaiting review</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-alt/80 px-4 py-3">
              <span className="font-medium text-foreground">Timezone</span>
              <span>Asia/Muscat (GMT+4)</span>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {highlights.map((highlight) => (
          <Card
            key={highlight.title}
            className="group relative overflow-hidden border border-border/40 bg-surface shadow-lg shadow-[var(--surface-glow)] transition-transform hover:-translate-y-1"
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-transparent to-accent/30 opacity-70" />
            <CardHeader>
              <CardTitle className="text-lg text-foreground group-hover:text-accent">
                {highlight.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {highlight.description}
            </CardContent>
          </Card>
        ))}
      </section>

      {mainStudio?.images && mainStudio.images.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Inside {mainStudio.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mainStudio.images
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((image) => (
                <div key={image.id} className="group relative overflow-hidden rounded-2xl border border-border/40 bg-surface-alt shadow-lg shadow-[var(--surface-glow)]">
                  <img
                    src={image.image_url}
                    alt={image.caption ?? `${mainStudio.name} image`}
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {image.caption ? (
                    <div className="absolute inset-x-0 bottom-0 bg-background/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
                      {image.caption}
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
