"use client";

import { useMemo, useState } from "react";
import { AvailabilityForm } from "@/components/admin/availability-form";
import { AvailabilityRules } from "@/components/admin/availability-rules";
import { useStudios, useCreateStudio } from "@/hooks/use-studios";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AvailabilityClientProps {
  timezone: string;
  defaultStudioId?: string;
}

export function AvailabilityClient({ timezone, defaultStudioId }: AvailabilityClientProps) {
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Availability</h1>
          <p className="text-sm text-muted-foreground">
            Define weekly studio hours and add exceptions for holidays or special events.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="availability-studio" className="text-xs uppercase tracking-wide text-muted-foreground">
              Studio
            </Label>
            <Select
              id="availability-studio"
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
        <div className="grid gap-8 lg:grid-cols-[1fr,1fr]">
          <Card className="border border-border/60 bg-surface shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Add rule</CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityForm studioId={activeStudioId} />
            </CardContent>
          </Card>
          <Card className="border border-border/60 bg-surface shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Current rules</CardTitle>
            </CardHeader>
            <CardContent>
              <AvailabilityRules timezone={timezone} studioId={activeStudioId} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border border-dashed border-border/60 bg-surface/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No studios yet. Add one to configure availability.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
