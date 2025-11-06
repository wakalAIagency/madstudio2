import { NextResponse } from "next/server";
import { approveBooking } from "@/server/services/booking";
import { requireAdmin } from "@/server/auth/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const result = await approveBooking(id);

    return NextResponse.json({
      booking: {
        id: result.booking.id,
        status: result.booking.status,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to approve booking" },
      { status: error instanceof Error && /not found/i.test(error.message) ? 404 : 500 },
    );
  }
}
