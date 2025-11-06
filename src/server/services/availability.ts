import {
  addMinutes,
  eachDayOfInterval,
  endOfDay,
  formatISO,
  parseISO,
  startOfDay,
} from "date-fns";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { AvailabilityRule, Slot } from "@/types";
import { combineDateAndTime } from "@/lib/time";
import { getSlotDurationMinutes } from "@/server/config";
import {
  buildSlotWindows,
  bulkInsertSlots,
  fetchSlotsInRange,
} from "@/server/repositories/slots";
import type { Tables } from "@/types/supabase";

type AvailabilityRuleRow = Tables<"availability_rules">;
type SlotRow = Tables<"slots">;

function adaptAvailabilityRule(row: AvailabilityRuleRow): AvailabilityRule {
  return { ...row } as AvailabilityRule;
}

function adaptSlot(row: SlotRow): Slot {
  return { ...row } as Slot;
}

interface GenerateSlotsOptions {
  start: string;
  end: string;
  studioId: string;
}

export async function listAvailabilityRules(studioId: string) {
  const supabase = getSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("availability_rules")
    .select("*")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load availability rules: ${error.message}`);
  }

  return (data ?? []).map((row) => adaptAvailabilityRule(row as AvailabilityRuleRow));
}

export async function generateSlotsForRange({
  start,
  end,
  studioId,
}: GenerateSlotsOptions) {
  const rules = await listAvailabilityRules(studioId);
  if (rules.length === 0) {
    return [];
  }

  const duration = getSlotDurationMinutes();
  const days = eachDayOfInterval({
    start: startOfDay(parseISO(start)),
    end: endOfDay(parseISO(end)),
  });

  const existingSlots = await fetchSlotsInRange(start, end, studioId);
  const existingSignature = new Set(
    existingSlots.map((slot) => `${slot.start_at}_${slot.end_at}`),
  );

  const slotsToCreate: Array<Omit<Slot, "id">> = [];

  for (const day of days) {
    const dayStr = day.toISOString().slice(0, 10);
    const weekday = day.getUTCDay();

    const weeklyRules = rules.filter(
      (rule) =>
        rule.rule_type === "weekly" &&
        rule.weekday !== null &&
        rule.weekday === weekday,
    );

    const exceptionRules = rules.filter(
      (rule) =>
        rule.rule_type === "exception" &&
        rule.date !== null &&
        rule.date === dayStr,
    );

    if (weeklyRules.length === 0 && exceptionRules.length === 0) {
      continue;
    }

    let windows = weeklyRules.flatMap((rule) => {
      const startDate = combineDateAndTime(dayStr, rule.start_time);
      const endDate = combineDateAndTime(dayStr, rule.end_time);
      return buildSlotWindows(
        startDate.toISOString(),
        endDate.toISOString(),
        duration,
      );
    });

    const closingRules = exceptionRules.filter((rule) => rule.is_open === false);
    const openingRules = exceptionRules.filter((rule) => rule.is_open !== false);

    if (closingRules.length > 0) {
      windows = windows.filter((window) => {
        return !closingRules.some((rule) => {
          const startDate = combineDateAndTime(dayStr, rule.start_time);
          const endDate = combineDateAndTime(dayStr, rule.end_time);
          const windowStart = parseISO(window.start);
          const windowEnd = parseISO(window.end);
          return (
            windowStart < endDate &&
            windowEnd > startDate
          );
        });
      });
    }

    if (openingRules.length > 0) {
      const extraWindows = openingRules.flatMap((rule) => {
        const startDate = combineDateAndTime(dayStr, rule.start_time);
        const endDate = combineDateAndTime(dayStr, rule.end_time);
        return buildSlotWindows(
          startDate.toISOString(),
          endDate.toISOString(),
          duration,
        );
      });
      windows = [...windows, ...extraWindows];
    }

    for (const window of windows) {
      const signature = `${window.start}_${window.end}`;
      if (existingSignature.has(signature)) {
        continue;
      }
      slotsToCreate.push({
        start_at: window.start,
        end_at: window.end,
        status: "available",
        hold_expires_at: null,
        created_via: "rule",
        studio_id: studioId,
      });
    }
  }

  if (slotsToCreate.length === 0) {
    return existingSlots;
  }

  const newSlots = await bulkInsertSlots(slotsToCreate);
  return [...existingSlots, ...newSlots].sort((a, b) =>
    a.start_at.localeCompare(b.start_at),
  );
}

export async function createManualSlot(
  startISO: string,
  studioId: string,
  durationMinutes?: number,
) {
  const supabase = getSupabaseServiceRoleClient();
  const increment = durationMinutes ?? getSlotDurationMinutes();
  const end = addMinutes(parseISO(startISO), increment);

  const insertPayload = {
    start_at: formatISO(parseISO(startISO)),
    end_at: formatISO(end),
    status: "available",
    created_via: "manual",
    studio_id: studioId,
    hold_expires_at: null,
  };

  const { data, error } = await supabase
    .from("slots")
    .insert(insertPayload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create slot: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to create slot: empty payload");
  }

  return adaptSlot(data as SlotRow);
}

export interface UpsertAvailabilityRuleInput {
  rule_type: AvailabilityRule["rule_type"];
  weekday?: number | null;
  start_time: string;
  end_time: string;
  date?: string | null;
  is_open?: boolean;
  created_by?: string | null;
  studio_id: string;
}

export async function createAvailabilityRule(input: UpsertAvailabilityRuleInput) {
  const supabase = getSupabaseServiceRoleClient();

  const payload = {
    rule_type: input.rule_type,
    weekday: input.rule_type === "weekly" ? input.weekday ?? 0 : null,
    start_time: input.start_time,
    end_time: input.end_time,
    date: input.rule_type === "exception" ? input.date : null,
    is_open: input.is_open ?? true,
    created_by: input.created_by ?? null,
    studio_id: input.studio_id,
  };

  const { data, error } = await supabase
    .from("availability_rules")
    .insert(payload as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create rule: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to create availability rule: empty payload");
  }

  return adaptAvailabilityRule(data as AvailabilityRuleRow);
}

export async function deleteAvailabilityRule(id: string) {
  const supabase = getSupabaseServiceRoleClient();

  const { error } = await supabase
    .from("availability_rules")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete rule: ${error.message}`);
  }
}
