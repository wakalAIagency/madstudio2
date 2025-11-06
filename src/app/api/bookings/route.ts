import { NextResponse } from "next/server";
import { z } from "zod";
import { requestBookings } from "@/server/services/booking";

const bookingRequestSchema = z.object({
  slotIds: z.array(z.string().uuid()).min(1),
  visitorName: z.string().min(2).max(120),
  visitorEmail: z.string().email(),
  visitorPhone: z.string().min(5).max(32),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const payload = bookingRequestSchema.parse(await request.json());

    const { bookings, holdExpiresAt } = await requestBookings(payload);

    return NextResponse.json(
      {
        bookings: bookings.map((booking) => ({
          id: booking.id,
          slotId: booking.slot_id,
          status: booking.status,
          token: booking.token,
        })),
        holdExpiresAt,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid booking request", details: error.flatten() },
        { status: 422 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create booking",
      },
      {
        status:
          error instanceof Error && /hold|available|bookable/.test(error.message)
            ? 409
            : 500,
      },
    );
  }
}
