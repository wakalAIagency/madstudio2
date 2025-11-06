"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Studio } from "@/types";

async function fetchStudios() {
  const response = await fetch("/api/studios", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Failed to load studios");
  }
  const data = (await response.json()) as { studios: Studio[] };
  return data.studios;
}

export function useStudios() {
  return useQuery<Studio[]>({
    queryKey: ["studios"],
    queryFn: fetchStudios,
    staleTime: 1000 * 60,
  });
}

interface CreateStudioPayload {
  name: string;
  slug: string;
  description?: string | null;
}

async function createStudio(payload: CreateStudioPayload) {
  const response = await fetch("/api/admin/studios", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Unable to create studio");
  }

  const data = (await response.json()) as { studio: Studio };
  return data.studio;
}

export function useCreateStudio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStudio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}

async function updateStudio(payload: {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}) {
  const response = await fetch(`/api/admin/studios/${payload.id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Unable to update studio");
  }

  const data = (await response.json()) as { studio: Studio };
  return data.studio;
}

async function removeStudio(id: string) {
  const response = await fetch(`/api/admin/studios/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Unable to delete studio");
  }
}

async function addStudioImageRequest(payload: {
  studioId: string;
  imageUrl: string;
  caption?: string;
  sortOrder?: number;
}) {
  const response = await fetch(`/api/admin/studios/${payload.studioId}/images`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Unable to add image");
  }

  return response.json();
}

async function deleteStudioImageRequest(payload: { studioId: string; imageId: string }) {
  const response = await fetch(`/api/admin/studios/${payload.studioId}/images/${payload.imageId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? "Unable to delete image");
  }
}

export function useUpdateStudio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStudio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}

export function useDeleteStudio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeStudio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}

export function useAddStudioImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addStudioImageRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}

export function useDeleteStudioImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStudioImageRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studios"] });
    },
  });
}
