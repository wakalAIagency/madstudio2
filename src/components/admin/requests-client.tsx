"use client";

import { useMemo, useState } from "react";
import { RequestsList } from "@/components/admin/requests-list";
import { useStudios, useCreateStudio } from "@/hooks/use-studios";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface RequestsClientProps {
  timezone: string;
  defaultStudioId?: string;
}

export function RequestsClient({ timezone, defaultStudioId }: RequestsClientProps) {
  const { data: studios = [], isLoading } = useStudios();
  const createStudioMutation = useCreateStudio();
  const [selectedStudioId, setSelectedStudioId] = useState<string | undefined>(defaultStudioId);

  const studioOptions = useMemo(() => studios.map((studio) => ({ id: studio.id, name: studio.name })), [studios]);
  const activeStudioId = selectedStudioId ?? studioOptions[0]?.id;

  const handleAddStudio = async () => {
    const name = window.prompt("Studio name");
    if (!name) return;
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    try {
      const studio = await createStudioMutation.mutateAsync({ name, slug });
      setSelectedStudioId(studio.id);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to create studio");
    }
  };

  const hasStudios = studioOptions.length > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Booking requests</h1>
          <p className="text-sm text-muted-foreground">
            Review pending bookings, approve sessions, or decline with a note.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="studio-select" className="text-xs uppercase tracking-wide text-muted-foreground">
              Studio
            </Label>
            <Select
              id="studio-select"
              value={activeStudioId ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedStudioId(value || undefined);
              }}
              disabled={isLoading || studioOptions.length === 0}
              className="min-w-[200px]"
            >
              <option value="" disabled>
                {isLoading ? "Loading studios..." : "Select a studio"}
              </option>
              {studioOptions.map((studio) => (
                <option key={studio.id} value={studio.id}>
                  {studio.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddStudio} disabled={createStudioMutation.isPending}>
            {createStudioMutation.isPending ? "Adding…" : "Add studio"}
          </Button>
        </div>
      </div>

      {hasStudios ? (
        <RequestsList timezone={timezone} studioId={activeStudioId} />
      ) : (
        <Card className="border border-dashed border-border/60 bg-surface/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No studios yet. Add one to begin managing requests.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
