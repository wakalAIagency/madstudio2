import {
  createStudio,
  deleteStudio,
  deleteStudioImage,
  fetchStudios,
  getDefaultStudio,
  updateStudio,
  upsertStudioImage,
} from "@/server/repositories/studios";

export async function listStudios() {
  return fetchStudios();
}

export async function ensureDefaultStudio() {
  const studio = await getDefaultStudio();
  if (!studio) {
    throw new Error("No studios configured. Create a studio first.");
  }
  return studio;
}

export async function createStudioEntry(payload: {
  name: string;
  slug: string;
  description?: string | null;
}) {
  return createStudio(payload);
}

export async function updateStudioEntry(payload: {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}) {
  return updateStudio(payload);
}

export async function deleteStudioEntry(id: string) {
  await deleteStudio(id);
}

export async function addStudioImage(payload: {
  studioId: string;
  imageUrl: string;
  caption?: string | null;
  sortOrder?: number;
}) {
  return upsertStudioImage(payload);
}

export async function removeStudioImage(imageId: string) {
  await deleteStudioImage(imageId);
}
