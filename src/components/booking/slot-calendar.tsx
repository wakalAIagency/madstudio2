"use client";

import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { cn } from "@/lib/utils";
import type { AvailableSlot } from "@/hooks/use-slots";
import { Button } from "@/components/ui/button";

interface SlotCalendarProps {
  slots: AvailableSlot[];
  timezone: string;
  onToggle: (slot: AvailableSlot) => void;
  selectedSlotIds: string[];
}

export function SlotCalendar({
  slots,
  timezone,
  onToggle,
  selectedSlotIds,
}: SlotCalendarProps) {
  const grouped = groupSlotsByDay(slots, timezone);

  if (grouped.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-muted-foreground">
        No open slots. Please check back soon or contact Madstudio directly.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.dateKey} className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {group.label}
            </h3>
            <p className="text-xs text-muted-foreground/90">
              {group.count} slots
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.slots.map((slot) => (
              <Button
                key={slot.id}
                variant={selectedSlotIds.includes(slot.id) ? "default" : "outline"}
                size="sm"
                className={cn(
                  "min-w-[96px]",
                  selectedSlotIds.includes(slot.id)
                    ? "ring-2 ring-offset-1 ring-ring"
                    : "",
                )}
                onClick={() => onToggle(slot)}
              >
                {slot.label}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function groupSlotsByDay(slots: AvailableSlot[], timezone: string) {
  const result: Array<{
    dateKey: string;
    label: string;
    count: number;
    slots: Array<AvailableSlot & { label: string }>;
  }> = [];

  const map = new Map<string, (AvailableSlot & { label: string })[]>();

  for (const slot of slots) {
    const dateLabel = formatInTimeZone(slot.startAt, timezone, "EEEE, MMM d");
    const dateKey = format(parseISO(slot.startAt), "yyyy-MM-dd");
    const label = formatInTimeZone(slot.startAt, timezone, "HH:mm");

    if (!map.has(dateKey)) {
      map.set(dateKey, []);
      result.push({
        dateKey,
        label: dateLabel,
        slots: [],
        count: 0,
      });
    }

    map.get(dateKey)!.push({ ...slot, label });
  }

  for (const group of result) {
    const slotsForDay = (map.get(group.dateKey) ?? []).sort((a, b) =>
      a.startAt.localeCompare(b.startAt),
    );
    group.slots = slotsForDay;
    group.count = slotsForDay.length;
  }

  return result;
}
