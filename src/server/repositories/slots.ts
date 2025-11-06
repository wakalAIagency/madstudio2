import { addMinutes, isBefore, parseISO } from "date-fns";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Slot, SlotStatus } from "@/types";

export async function fetchSlotsInRange(start: string, end: string, studioId: string) {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("slots")
    .select("*")
    .gte("start_at", start)
    .lt("end_at", end)
    .eq("studio_id", studioId)
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch slots: ${error.message}`);
  }

  return data as Slot[];
}

export async function fetchAvailableSlots(start: string, end: string, studioId: string) {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("slots")
    .select("*")
    .gte("start_at", start)
    .lt("end_at", end)
    .in("status", ["available", "requested"])
    .eq("studio_id", studioId)
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load available slots: ${error.message}`);
  }

  return data as Slot[];
}

export async function updateSlotStatus(
  slotId: string,
  status: SlotStatus,
  holdExpiresAt?: string | null,
) {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("slots")
    .update({
      status,
      hold_expires_at: holdExpiresAt ?? null,
    })
    .eq("id", slotId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update slot status: ${error.message}`);
  }

  return data as Slot;
}

export async function bulkInsertSlots(slots: Array<Omit<Slot, "id">>) {
  if (slots.length === 0) return [];
  const supabase = getSupabaseServiceRoleClient();

  const preparedPayload = slots.map((slot) => ({
    ...slot,
    hold_expires_at: slot.hold_expires_at ?? null,
  }));

  const { data, error } = await supabase
    .from("slots")
    .upsert(preparedPayload, {
      onConflict: "studio_id,start_at,end_at",
      ignoreDuplicates: true,
    })
    .select("*");

  if (error && error.code !== "23505") {
    throw new Error(`Failed to insert slots: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data as Slot[];
}

export async function markOverlappingSlotsAsBlocked(
  start: string,
  end: string,
  studioId: string,
  excludeSlotId?: string,
) {
  const supabase = getSupabaseServiceRoleClient();

  let query = supabase
    .from("slots")
    .update({ status: "blocked" })
    .or(
      `and(start_at.lt.${end},end_at.gt.${start})`,
    )
    .eq("studio_id", studioId);

  if (excludeSlotId) {
    query = query.neq("id", excludeSlotId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Failed to block overlapping slots: ${error.message}`);
  }
}

export function buildSlotWindows(
  startISO: string,
  endISO: string,
  incrementMinutes: number,
) {
  const windows: { start: string; end: string }[] = [];
  let cursor = parseISO(startISO);
  const end = parseISO(endISO);

  while (isBefore(cursor, end)) {
    const next = addMinutes(cursor, incrementMinutes);
    if (isBefore(next, cursor) || next > end) {
      break;
    }
    windows.push({
      start: cursor.toISOString(),
      end: next.toISOString(),
    });
    cursor = next;
  }

  return windows;
}
