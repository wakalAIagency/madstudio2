import { NextResponse } from "next/server";
import { listPendingBookings } from "@/server/services/booking";
import { requireAdmin } from "@/server/auth/session";
import { ensureDefaultStudio } from "@/server/services/studios";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studioParam = searchParams.get("studioId");
    const studioId = studioParam ?? (await ensureDefaultStudio())?.id;
    if (!studioId) {
      return NextResponse.json({ error: "No studios configured" }, { status: 404 });
    }

    const bookings = await listPendingBookings(studioId);

    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        id: booking.id,
        visitorName: booking.visitor_name,
        visitorEmail: booking.visitor_email,
        visitorPhone: booking.visitor_phone,
        notes: booking.notes,
        status: booking.status,
        createdAt: booking.created_at,
        slot: booking.slot
          ? {
              id: booking.slot.id,
              startAt: booking.slot.start_at,
              endAt: booking.slot.end_at,
              studioId: booking.slot.studio_id,
            }
          : null,
      })),
      studioId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load requests" },
      { status: 500 },
    );
  }
}
