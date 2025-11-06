import { addHours } from "date-fns";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Booking, Slot } from "@/types";
import { formatDateTime } from "@/lib/time";
import {
  sendBookingDecisionEmail,
  sendBookingRequestEmail,
} from "@/server/email/mailer";
import {
  createBooking,
  declineBookingsForSlot,
  fetchBookingById,
  fetchBookingsBySlot,
  fetchBookingsByIds,
  fetchPendingBookings,
  getAdminOverviewStats,
  deleteBookingsByIds,
  updateBookingStatus,
} from "@/server/repositories/bookings";
import {
  markOverlappingSlotsAsBlocked,
  updateSlotStatus,
} from "@/server/repositories/slots";
import type { Tables } from "@/types/supabase";

const HOLD_DURATION_HOURS = 2;

type SlotRow = Tables<"slots">;

function adaptSlot(row: SlotRow): Slot {
  return { ...row } as Slot;
}

export async function releaseExpiredHolds() {
  const supabase = getSupabaseServiceRoleClient();

  const { error } = await supabase
    .from("slots")
    .update({ status: "available", hold_expires_at: null } as never)
    .eq("status", "requested")
    .lt("hold_expires_at", new Date().toISOString());

  if (error) {
    throw new Error(`Failed to release expired holds: ${error.message}`);
  }
}

export async function requestBookings(payload: {
  slotIds: string[];
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  notes?: string;
}) {
  await releaseExpiredHolds();

  const supabase = getSupabaseServiceRoleClient();
  const uniqueSlotIds = Array.from(new Set(payload.slotIds));

  if (uniqueSlotIds.length === 0) {
    throw new Error("Please select at least one slot.");
  }

  const { data: slots, error } = await supabase
    .from("slots")
    .select("*")
    .in("id", uniqueSlotIds)
    .order("start_at", { ascending: true });

  if (error || !slots) {
    throw new Error("Unable to fetch selected slots.");
  }

  const mappedSlots = slots.map(adaptSlot);

  if (mappedSlots.length !== uniqueSlotIds.length) {
    throw new Error("One or more selected slots no longer exist.");
  }

  const now = new Date();
  const holdExpiresAt = addHours(now, HOLD_DURATION_HOURS).toISOString();

  const processed: Array<{ slotId: string; bookingId: string }> = [];

  try {
    for (const slot of mappedSlots) {
      if (!["available", "requested"].includes(slot.status)) {
        throw new Error("Some slots are no longer bookable.");
      }

      if (slot.status === "requested" && slot.hold_expires_at) {
        const expires = new Date(slot.hold_expires_at);
        if (expires > now) {
          throw new Error("Some slots are currently on hold while pending approval.");
        }
      }

      await updateSlotStatus(slot.id, "requested", holdExpiresAt);

      const booking = await createBooking({
        slot_id: slot.id,
        visitor_name: payload.visitorName,
        visitor_email: payload.visitorEmail,
        visitor_phone: payload.visitorPhone,
        notes: payload.notes,
      });

      processed.push({ slotId: slot.id, bookingId: booking.id });
    }
  } catch (err) {
    await rollbackProcessedBookings(processed);
    throw err instanceof Error ? err : new Error("Failed to create booking");
  }

  const bookings = await fetchBookingsByIds(
    processed.map((entry) => entry.bookingId),
  );

  void sendBookingRequestEmail(bookings).catch((error) =>
    console.error("Failed to send booking request email", error),
  );

  return {
    bookings,
    slots: mappedSlots,
    holdExpiresAt,
  };
}

export async function approveBooking(bookingId: string) {
  const booking = await fetchBookingById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  const slot = booking.slot;
  if (!slot) {
    throw new Error("Slot data missing for booking");
  }

  await updateSlotStatus(slot.id, "approved", null);
  await declineBookingsForSlot(slot.id, booking.id);

  await markOverlappingSlotsAsBlocked(slot.start_at, slot.end_at, slot.studio_id, slot.id);

  const updated = await updateBookingStatus(booking.id, "approved");

  void sendBookingDecisionEmail({ ...updated, slot }, "approved").catch(
    (error) => console.error("Failed to send approval email", error),
  );

  return {
    booking: updated,
    slot: { ...slot, status: "approved" },
  };
}

export async function declineBooking(
  bookingId: string,
  options?: { reason?: string },
) {
  const booking = await fetchBookingById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  const slot = booking.slot;
  if (!slot) {
    throw new Error("Slot data missing for booking");
  }

  const updated = await updateBookingStatus(booking.id, "declined");

  const competingBookings = await fetchBookingsBySlot(slot.id);
  const hasApproved = competingBookings.some((b) => b.id !== booking.id && b.status === "approved");

  if (!hasApproved) {
    await updateSlotStatus(slot.id, "available", null);
  }

  void sendBookingDecisionEmail({ ...updated, slot }, "declined", options).catch(
    (error) => console.error("Failed to send decline email", error),
  );

  return {
    booking: updated,
    slot: { ...slot, status: hasApproved ? slot.status : "available" },
  };
}

export async function listPendingBookings(studioId?: string) {
  await releaseExpiredHolds();
  return fetchPendingBookings(studioId);
}

export async function adminOverview(studioId?: string) {
  return getAdminOverviewStats(studioId);
}

async function rollbackProcessedBookings(
  processed: Array<{ slotId: string; bookingId: string }>,
) {
  if (processed.length === 0) return;

  await deleteBookingsByIds(processed.map((entry) => entry.bookingId));

  await Promise.all(
    processed.map((entry) =>
      updateSlotStatus(entry.slotId, "available", null),
    ),
  );
}

export function bookingSummary(booking: Booking) {
  const slot = booking.slot;
  if (!slot) return "";
  return `${booking.visitor_name} · ${formatDateTime(slot.start_at)} → ${formatDateTime(slot.end_at)}`;
}
