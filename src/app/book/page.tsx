import type { Metadata } from "next";
import { Suspense } from "react";
import { getServerEnv } from "@/lib/env";
import { BookingExperience } from "@/components/booking/booking-experience";
import { Card, CardContent } from "@/components/ui/card";
import { ensureDefaultStudio } from "@/server/services/studios";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Book a Session",
  description:
    "Choose an available time slot to request a Madstudio photo session."
};

export default async function BookPage() {
  const { TIMEZONE } = getServerEnv();
  const defaultStudio = await ensureDefaultStudio().catch(() => null);

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
          Book your Madstudio session
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Choose an open slot, send us your request, and we&apos;ll fire back a confirmation with calendar invite once approved.
        </p>
      </div>

      <Suspense
        fallback={(
          <Card className="border border-border/40 bg-surface/80 p-12 text-center shadow-lg shadow-[var(--surface-glow)]">
            <CardContent>
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">
                Loading booking experience...
              </p>
            </CardContent>
          </Card>
        )}
      >
        <BookingExperience timezone={TIMEZONE} defaultStudioId={defaultStudio?.id} />
      </Suspense>
    </div>
  );
}
