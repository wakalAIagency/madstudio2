import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Booking, BookingStatus, Slot } from "@/types";
import type { Tables } from "@/types/supabase";

type BookingRow = Tables<"bookings">;
type SlotRow = Tables<"slots">;
type BookingWithSlot = BookingRow & { slot: SlotRow | null };

const bookingWithSlotColumns =
  "*, slot:slots(id, start_at, end_at, status, hold_expires_at, studio_id)";

function adaptBooking(row: BookingWithSlot): Booking {
  return {
    ...row,
    slot: row.slot ? ({ ...row.slot } as Slot) : undefined,
  } as Booking;
}

function adaptBookingRow(row: BookingRow): Booking {
  return { ...row } as Booking;
}

export async function createBooking(payload: {
  slot_id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  notes?: string;
}) {
  const supabase = getSupabaseServiceRoleClient();
  const insertPayload = {
    slot_id: payload.slot_id,
    visitor_name: payload.visitor_name,
    visitor_email: payload.visitor_email,
    visitor_phone: payload.visitor_phone,
    notes: payload.notes ?? null,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("bookings")
    .insert(insertPayload as never)
    .select(bookingWithSlotColumns)
    .single();

  if (error || !data) {
    throw new Error(`Failed to create booking: ${error?.message ?? "unknown"}`);
  }

  return adaptBooking(data as BookingWithSlot);
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
) {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status } as never)
    .eq("id", bookingId)
    .select(bookingWithSlotColumns)
    .single();

  if (error || !data) {
    throw new Error(`Failed to update booking: ${error?.message ?? "unknown"}`);
  }

  return adaptBooking(data as BookingWithSlot);
}

export async function fetchBookingById(bookingId: string) {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(bookingWithSlotColumns)
    .eq("id", bookingId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to load booking: ${error?.message ?? "unknown"}`);
  }

  return adaptBooking(data as BookingWithSlot);
}

export async function fetchPendingBookings(studioId?: string) {
  const supabase = getSupabaseServiceRoleClient();
  const selectClause = studioId
    ? bookingWithSlotColumns.replace("slot:slots", "slot:slots!inner")
    : bookingWithSlotColumns;

  let query = supabase
    .from("bookings")
    .select(selectClause)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (studioId) {
    query = query.eq("slot.studio_id", studioId);
  }

  const { data, error } = await query;

  if (error || !data) {
    throw new Error(
      `Failed to load pending bookings: ${error?.message ?? "unknown"}`,
    );
  }

  return data.map((row) => adaptBooking(row as BookingWithSlot));
}

export async function fetchBookingsBySlot(slotId: string) {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("slot_id", slotId);

  if (error) {
    throw new Error(`Failed to fetch bookings for slot: ${error.message}`);
  }

  return (data ?? []).map((row) => adaptBookingRow(row as BookingRow));
}

export async function fetchBookingsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(bookingWithSlotColumns)
    .in("id", ids)
    .order("created_at", { ascending: true });

  if (error || !data) {
    throw new Error(`Failed to fetch bookings: ${error?.message ?? "unknown"}`);
  }

  return data.map((row) => adaptBooking(row as BookingWithSlot));
}

export async function declineBookingsForSlot(
  slotId: string,
  excludeBookingId?: string,
) {
  const supabase = getSupabaseServiceRoleClient();

  let query = supabase
    .from("bookings")
    .update({ status: "declined" } as never)
    .eq("slot_id", slotId)
    .eq("status", "pending");

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Failed to decline competing bookings: ${error.message}`);
  }
}

export async function getAdminOverviewStats(studioId?: string) {
  const supabase = getSupabaseServiceRoleClient();

  const [pending, today, upcoming] = await Promise.all([
    (() => {
      let query = supabase
        .from("bookings")
        .select("id, slot:slots!inner(id, studio_id)", {
          count: "exact",
          head: true,
        })
        .eq("status", "pending");
      if (studioId) {
        query = query.eq("slot.studio_id", studioId);
      }
      return query;
    })(),
    supabase.rpc("count_bookings_today", { studio: studioId ?? null } as never),
    supabase.rpc("count_bookings_this_week", { studio: studioId ?? null } as never),
  ]);

  if (pending.error) {
    throw new Error(`Failed to load pending count: ${pending.error.message}`);
  }

  if (today.error) {
    throw new Error(`Failed to load today stats: ${today.error.message}`);
  }

  if (upcoming.error) {
    throw new Error(`Failed to load week stats: ${upcoming.error.message}`);
  }

  return {
    pending: pending.count ?? 0,
    today: today.data ?? 0,
    thisWeek: upcoming.data ?? 0,
  };
}

export async function deleteBookingsByIds(ids: string[]) {
  if (ids.length === 0) return;

  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from("bookings").delete().in("id", ids);

  if (error) {
    console.error("Failed to cleanup bookings after error", error);
  }
}
