import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Booking, BookingStatus } from "@/types";

export async function createBooking(payload: {
  slot_id: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  notes?: string;
}) {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      slot_id: payload.slot_id,
      visitor_name: payload.visitor_name,
      visitor_email: payload.visitor_email,
      visitor_phone: payload.visitor_phone,
      notes: payload.notes ?? null,
      status: "pending",
    })
    .select(
      "*, slot:slots(id, start_at, end_at, status, hold_expires_at, studio_id)",
    )
    .single();

  if (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }

  return data as Booking;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
) {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .select(
      "*, slot:slots(id, start_at, end_at, status, hold_expires_at, studio_id)",
    )
    .single();

  if (error) {
    throw new Error(`Failed to update booking: ${error.message}`);
  }

  return data as Booking;
}

export async function fetchBookingById(bookingId: string) {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, slot:slots(id, start_at, end_at, status, hold_expires_at, studio_id)",
    )
    .eq("id", bookingId)
    .single();

  if (error) {
    throw new Error(`Failed to load booking: ${error.message}`);
  }

  return data as Booking;
}

export async function fetchPendingBookings(studioId?: string) {
  const supabase = getSupabaseServiceRoleClient();
  const selectClause = studioId
    ? "*, slot:slots!inner(id, start_at, end_at, status, hold_expires_at, studio_id)"
    : "*, slot:slots(id, start_at, end_at, status, hold_expires_at, studio_id)";

  let query = supabase
    .from("bookings")
    .select(selectClause)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (studioId) {
    query = query.eq("slot.studio_id", studioId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load pending bookings: ${error.message}`);
  }

  return data as Booking[];
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

  return (data ?? []) as Booking[];
}

export async function fetchBookingsByIds(ids: string[]) {
  if (ids.length === 0) return [];

  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, slot:slots(id, start_at, end_at, status, hold_expires_at, studio_id)",
    )
    .in("id", ids)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }

  return data as Booking[];
}

export async function declineBookingsForSlot(slotId: string, excludeBookingId?: string) {
  const supabase = getSupabaseServiceRoleClient();

  let query = supabase
    .from("bookings")
    .update({ status: "declined" })
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
    supabase.rpc("count_bookings_today", { studio: studioId ?? null }),
    supabase.rpc("count_bookings_this_week", { studio: studioId ?? null }),
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
