"use client";

import { useQuery } from "@tanstack/react-query";
import { addDays } from "date-fns";

export interface AvailableSlot {
  id: string;
  startAt: string;
  endAt: string;
  studioId: string;
}

async function fetchSlots(start: Date, end: Date, studioId: string) {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    studioId,
  });

  const response = await fetch(`/api/slots?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load availability");
  }

  const data = (await response.json()) as {
    slots: AvailableSlot[];
    studioId: string;
  };
  return data.slots;
}

export function useAvailableSlots(studioId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ["available-slots", studioId, days],
    queryFn: () => {
      if (!studioId) {
        throw new Error("Studio is required to load slots");
      }
      return fetchSlots(new Date(), addDays(new Date(), days), studioId);
    },
    enabled: Boolean(studioId),
    staleTime: 1000 * 60,
  });
}
