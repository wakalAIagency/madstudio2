"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudios, useCreateStudio } from "@/hooks/use-studios";
import { useAdminOverview } from "@/hooks/use-admin";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const cards = [
  {
    key: "pending",
    label: "Pending approvals",
    description: "Awaiting your review",
  },
  {
    key: "today",
    label: "Today",
    description: "Approved sessions scheduled today",
  },
  {
    key: "thisWeek",
    label: "This week",
    description: "Upcoming approved sessions",
  },
] as const;

interface AdminOverviewClientProps {
  defaultStudioId?: string;
}

export function AdminOverviewClient({ defaultStudioId }: AdminOverviewClientProps) {
  const { data: studios = [], isLoading } = useStudios();
  const createStudioMutation = useCreateStudio();
  const [selectedStudioId, setSelectedStudioId] = useState<string | undefined>(defaultStudioId);

  const studioOptions = useMemo(() => studios.map((studio) => ({ id: studio.id, name: studio.name })), [studios]);
  const activeStudioId = selectedStudioId ?? studioOptions[0]?.id;

  const { data: stats, isLoading: statsLoading } = useAdminOverview(activeStudioId);

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
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track booking demand and stay ahead of your schedule.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="overview-studio" className="text-xs uppercase tracking-wide text-muted-foreground">
              Studio
            </Label>
            <Select
              id="overview-studio"
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
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.key} className="bg-surface shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-4xl font-semibold text-foreground">
                  {statsLoading || !stats ? "—" : stats[card.key]}
                </p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-dashed border-border/60 bg-surface/60">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No studios yet. Add one to view dashboard metrics.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
