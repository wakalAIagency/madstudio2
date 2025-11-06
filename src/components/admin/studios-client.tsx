/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useAddStudioImage,
  useCreateStudio,
  useDeleteStudio,
  useDeleteStudioImage,
  useStudios,
  useUpdateStudio,
} from "@/hooks/use-studios";
import type { Studio } from "@/types";

const editStudioSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().max(512).nullable().optional(),
});

type EditStudioValues = z.infer<typeof editStudioSchema>;

interface StudiosClientProps {
  defaultStudioId?: string;
}

export function StudiosClient({ defaultStudioId }: StudiosClientProps) {
  const studiosQuery = useStudios();
  const studios: Studio[] = useMemo(
    () => studiosQuery.data ?? [],
    [studiosQuery.data],
  );
  const isLoading = studiosQuery.isLoading;
  const createMutation = useCreateStudio();
  const updateMutation = useUpdateStudio();
  const deleteMutation = useDeleteStudio();
  const addImageMutation = useAddStudioImage();
  const deleteImageMutation = useDeleteStudioImage();

  const [selectedStudioId, setSelectedStudioId] = useState<string | undefined>(defaultStudioId);

  const studioOptions = useMemo(
    () => studios.map((studio) => ({ id: studio.id, name: studio.name })),
    [studios],
  );

  const activeStudioId = selectedStudioId ?? studioOptions[0]?.id;
  const activeStudio = studios.find((studio) => studio.id === activeStudioId);

  const form = useForm<EditStudioValues>({
    resolver: zodResolver(editStudioSchema),
    defaultValues: {
      name: activeStudio?.name ?? "",
      slug: activeStudio?.slug ?? "",
      description: activeStudio?.description ?? "",
    },
  });

  // sync when active studio changes
  if (activeStudio && form.getValues("name") !== activeStudio.name) {
    form.reset({
      name: activeStudio.name,
      slug: activeStudio.slug,
      description: activeStudio.description ?? "",
    });
  }

  const hasStudios = studioOptions.length > 0;

  const handleCreate = async () => {
    const name = window.prompt("Studio name");
    if (!name) return;
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    try {
      const studio = await createMutation.mutateAsync({ name, slug });
      setSelectedStudioId(studio.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to create studio");
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!activeStudioId) return;
    try {
      await updateMutation.mutateAsync({
        id: activeStudioId,
        name: values.name,
        slug: values.slug.toLowerCase(),
        description: values.description ?? null,
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to update studio");
    }
  });

  const handleDelete = async () => {
    if (!activeStudioId) return;
    if (!window.confirm("Delete this studio? This cannot be undone.")) return;
    try {
      await deleteMutation.mutateAsync(activeStudioId);
      setSelectedStudioId(undefined);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete studio");
    }
  };

  const handleAddImage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeStudioId) return;
    const formData = new FormData(event.currentTarget);
    const imageUrl = String(formData.get("imageUrl") ?? "").trim();
    const caption = String(formData.get("caption") ?? "").trim();
    if (!imageUrl) return;
    try {
      await addImageMutation.mutateAsync({
        studioId: activeStudioId,
        imageUrl,
        caption: caption || undefined,
      });
      event.currentTarget.reset();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to add image");
    }
  };

  const handleRemoveImage = async (imageId: string) => {
    if (!activeStudioId) return;
    try {
      await deleteImageMutation.mutateAsync({ studioId: activeStudioId, imageId });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete image");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Studios</h1>
          <p className="text-sm text-muted-foreground">
            Manage studio info, descriptions, and gallery imagery.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="studio-picker" className="text-xs uppercase tracking-wide text-muted-foreground">
              Studio
            </Label>
            <select
              id="studio-picker"
              className="h-10 rounded-md border border-border/40 bg-surface-alt px-3 text-sm"
              value={activeStudioId ?? ""}
              onChange={(event) => setSelectedStudioId(event.target.value || undefined)}
              disabled={isLoading || !hasStudios}
            >
              <option value="" disabled>
                {isLoading ? "Loading studios..." : "Select a studio"}
              </option>
              {studioOptions.map((studio) => (
                <option key={studio.id} value={studio.id}>
                  {studio.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleCreate}>
            New studio
          </Button>
        </div>
      </div>

      {hasStudios && activeStudio ? (
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <Card className="border border-border/40 bg-surface shadow-lg shadow-[var(--surface-glow)]">
            <CardHeader>
              <CardTitle>Edit studio details</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-3">
                  <Label htmlFor="studio-name">Name</Label>
                  <Input id="studio-name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="studio-slug">Slug</Label>
                  <Input id="studio-slug" {...form.register("slug")} />
                  {form.formState.errors.slug && (
                    <p className="text-xs text-red-400">{form.formState.errors.slug.message}</p>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="studio-description">Short description</Label>
                  <Textarea
                    id="studio-description"
                    rows={4}
                    placeholder="Describe the vibe, amenities, and what makes this studio unique."
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-xs text-red-400">{form.formState.errors.description.message}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deleteMutation.isPending}
                    onClick={handleDelete}
                  >
                    Delete studio
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-border/40 bg-surface shadow-lg shadow-[var(--surface-glow)]">
            <CardHeader>
              <CardTitle>Image gallery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="grid gap-3" onSubmit={handleAddImage}>
                <div className="grid gap-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input id="image-url" name="imageUrl" placeholder="https://..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="image-caption">Caption (optional)</Label>
                  <Input id="image-caption" name="caption" placeholder="Shot from the west wall" />
                </div>
                <Button type="submit" variant="outline" disabled={addImageMutation.isPending}>
                  {addImageMutation.isPending ? "Adding..." : "Add image"}
                </Button>
              </form>

              <div className="grid gap-4">
                {(activeStudio?.images ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No images yet. Add one above to showcase the studio.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeStudio?.images
                      ?.slice()
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((image) => (
                        <div
                          key={image.id}
                          className="group relative overflow-hidden rounded-xl border border-border/40 bg-surface-alt"
                        >
                          <img
                            src={image.image_url}
                            alt={image.caption ?? "Studio image"}
                            className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground">
                            <span className="truncate">{image.caption ?? "Untitled"}</span>
                            <button
                              type="button"
                              className="text-red-400 transition hover:text-red-300"
                              onClick={() => handleRemoveImage(image.id)}
                              disabled={deleteImageMutation.isPending}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border border-dashed border-border/40 bg-surface/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {isLoading ? "Loading studios..." : "Create a studio to get started."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
