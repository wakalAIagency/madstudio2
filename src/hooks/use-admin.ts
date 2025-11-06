"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface BookingRow {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  notes: string | null;
  status: string;
  createdAt: string;
  slot: {
    id: string;
    startAt: string;
    endAt: string;
    studioId: string;
  } | null;
}

async function fetchRequests(studioId: string) {
  const params = new URLSearchParams({ studioId });
  const response = await fetch(`/api/admin/requests?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to load requests");
  }
  const data = (await response.json()) as { bookings: BookingRow[] };
  return data.bookings;
}

export function useAdminRequests(studioId: string | undefined) {
  return useQuery({
    queryKey: ["admin-requests", studioId],
    queryFn: () => {
      if (!studioId) {
        throw new Error("Studio is required");
      }
      return fetchRequests(studioId);
    },
    enabled: Boolean(studioId),
    refetchInterval: 1000 * 30,
  });
}

async function mutateBooking(
  bookingId: string,
  action: "approve" | "decline",
  payload?: { reason?: string },
) {
  const response = await fetch(`/api/admin/bookings/${bookingId}/${action}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? `Failed to ${action} booking`);
  }

  return response.json();
}

export function useApproveBooking(studioId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => mutateBooking(bookingId, "approve"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests", studioId] });
    },
  });
}

export function useDeclineBooking(studioId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) =>
      mutateBooking(bookingId, "decline", { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests", studioId] });
    },
  });
}

interface AvailabilityRule {
  id: string;
  rule_type: "weekly" | "exception";
  weekday: number | null;
  start_time: string;
  end_time: string;
  date: string | null;
  is_open: boolean;
}

async function fetchAvailability(studioId: string) {
  const params = new URLSearchParams({ studioId });
  const response = await fetch(`/api/admin/availability?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Failed to load availability");
  }
  const data = (await response.json()) as { rules: AvailabilityRule[] };
  return data.rules;
}

export function useAvailabilityRules(studioId: string | undefined) {
  return useQuery({
    queryKey: ["admin-availability", studioId],
    queryFn: () => {
      if (!studioId) {
        throw new Error("Studio is required");
      }
      return fetchAvailability(studioId);
    },
    enabled: Boolean(studioId),
  });
}

async function createRule(payload: {
  ruleType: "weekly" | "exception";
  weekday?: number | null;
  startTime: string;
  endTime: string;
  date?: string | null;
  isOpen?: boolean;
  studioId: string;
}) {
  const response = await fetch("/api/admin/availability", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Unable to create rule");
  }

  return response.json();
}

async function deleteRule(ruleId: string) {
  const response = await fetch(`/api/admin/availability/${ruleId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Unable to delete rule");
  }
}

export function useCreateAvailabilityRule(studioId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Parameters<typeof createRule>[0], "studioId">) => {
      if (!studioId) {
        throw new Error("Studio is required");
      }
      return createRule({ ...input, studioId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-availability", studioId] });
    },
  });
}

export function useDeleteAvailabilityRule(studioId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-availability", studioId] });
    },
  });
}

interface OverviewStats {
  pending: number;
  today: number;
  thisWeek: number;
}

async function fetchOverview(studioId: string) {
  const params = new URLSearchParams({ studioId });
  const response = await fetch(`/api/admin/overview?${params.toString()}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load overview");
  }
  const data = (await response.json()) as { stats: OverviewStats };
  return data.stats;
}

export function useAdminOverview(studioId: string | undefined) {
  return useQuery({
    queryKey: ["admin-overview", studioId],
    queryFn: () => {
      if (!studioId) {
        throw new Error("Studio is required");
      }
      return fetchOverview(studioId);
    },
    enabled: Boolean(studioId),
    refetchInterval: 1000 * 30,
  });
}
