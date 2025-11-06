import { NextResponse } from "next/server";
import { declineBooking } from "@/server/services/booking";
import { requireAdmin } from "@/server/auth/session";
import { z } from "zod";

const declineSchema = z.object({
  reason: z.string().max(250).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = declineSchema.parse(await request.json().catch(() => ({})));
    const { id } = await context.params;
    const result = await declineBooking(id, { reason: body.reason });

    return NextResponse.json({
      booking: {
        id: result.booking.id,
        status: result.booking.status,
        reason: body.reason ?? null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to decline booking" },
      { status: error instanceof Error && /not found/i.test(error.message) ? 404 : 500 },
    );
  }
}
