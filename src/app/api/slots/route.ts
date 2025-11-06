import { addDays } from "date-fns";
import { releaseExpiredHolds } from "@/server/services/booking";
import { generateSlotsForRange } from "@/server/services/availability";
import { ensureDefaultStudio } from "@/server/services/studios";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const studioIdParam = searchParams.get("studioId");

  const now = new Date();
  const startISO = startParam ?? now.toISOString();
  const endISO =
    endParam ?? addDays(now, 30).toISOString();

  try {
    const studio =
      studioIdParam ?? (await ensureDefaultStudio())?.id;

    if (!studio) {
      return NextResponse.json(
        { error: "No studios configured" },
        { status: 404 },
      );
    }

    await releaseExpiredHolds();
    const slots = await generateSlotsForRange({
      start: startISO,
      end: endISO,
      studioId: studio,
    });

    const formatted = slots
      .filter((slot) => slot.status === "available")
      .map((slot) => ({
        id: slot.id,
        startAt: slot.start_at,
        endAt: slot.end_at,
        studioId: slot.studio_id,
      }));

    return NextResponse.json({
      slots: formatted,
      studioId: studio,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Unable to load available slots",
      },
      { status: 500 },
    );
  }
}
