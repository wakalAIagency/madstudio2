import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Studio, StudioImage } from "@/types";

export async function fetchStudios() {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("studios")
    .select("*, images:studio_images(id, studio_id, image_url, caption, sort_order, created_at)")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load studios: ${error.message}`);
  }

  return (data ?? []).map((studio) => ({
    ...studio,
    images: studio.images ?? [],
  })) as Studio[];
}

export async function createStudio(payload: {
  name: string;
  slug: string;
  description?: string | null;
}) {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("studios")
    .insert({
      name: payload.name,
      slug: payload.slug,
      description: payload.description ?? null,
    })
    .select("*, images:studio_images(id, studio_id, image_url, caption, sort_order, created_at)")
    .single();

  if (error) {
    throw new Error(`Failed to create studio: ${error.message}`);
  }

  return {
    ...data,
    images: data.images ?? [],
  } as Studio;
}

export async function getDefaultStudio() {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("studios")
    .select("*, images:studio_images(id, studio_id, image_url, caption, sort_order, created_at)")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load default studio: ${error.message}`);
  }

  if (!data) return null;
  return {
    ...data,
    images: data.images ?? [],
  } as Studio;
}

export async function updateStudio(payload: {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}) {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("studios")
    .update({
      name: payload.name,
      slug: payload.slug,
      description: payload.description ?? null,
    })
    .eq("id", payload.id)
    .select("*, images:studio_images(id, studio_id, image_url, caption, sort_order, created_at)")
    .single();

  if (error) {
    throw new Error(`Failed to update studio: ${error.message}`);
  }

  return {
    ...data,
    images: data.images ?? [],
  } as Studio;
}

export async function deleteStudio(id: string) {
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from("studios").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete studio: ${error.message}`);
  }
}

export async function upsertStudioImage(payload: {
  studioId: string;
  imageUrl: string;
  caption?: string | null;
  sortOrder?: number;
}) {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("studio_images")
    .insert({
      studio_id: payload.studioId,
      image_url: payload.imageUrl,
      caption: payload.caption ?? null,
      sort_order: payload.sortOrder ?? 0,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to add studio image: ${error.message}`);
  }

  return data as StudioImage;
}

export async function deleteStudioImage(imageId: string) {
  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase
    .from("studio_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    throw new Error(`Failed to delete studio image: ${error.message}`);
  }
}
