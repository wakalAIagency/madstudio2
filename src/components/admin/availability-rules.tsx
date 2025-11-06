"use client";

import { format, parseISO } from "date-fns";
import { useAvailabilityRules, useDeleteAvailabilityRule } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityRules({ timezone, studioId }: { timezone: string; studioId?: string }) {
  const { data = [], isLoading, isError, refetch } = useAvailabilityRules(studioId);
  const deleteMutation = useDeleteAvailabilityRule(studioId);

  if (!studioId) {
    return <p className="text-sm text-muted-foreground">Select a studio to view availability.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading availability…</p>;
  }

  if (isError) {
    return (
      <Card className="border border-red-200 bg-red-50/60">
        <CardContent className="space-y-3 py-6 text-sm text-red-600">
          <p>We couldn&apos;t load availability rules.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border border-dashed border-border/60 bg-surface/60">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No rules yet. Add weekly hours or specific exceptions.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((rule) => {
        const descriptor = getRuleDescription(rule, timezone);
        return (
          <Card key={rule.id} className="border border-border/60 bg-surface">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  {descriptor.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{descriptor.subtitle}</p>
              </div>
              <Badge variant="outline">{rule.rule_type}</Badge>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">{descriptor.window}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(rule.id)}
                disabled={deleteMutation.isPending}
              >
                Remove
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function getRuleDescription(
  rule: {
    rule_type: "weekly" | "exception";
    weekday: number | null;
    start_time: string;
    end_time: string;
    date: string | null;
    is_open: boolean;
  },
  timezone: string,
) {
  const window = `${rule.start_time} – ${rule.end_time} (${timezone})`;

  if (rule.rule_type === "weekly" && rule.weekday !== null) {
    return {
      title: `Weekly: ${dayLabels[rule.weekday]}`,
      subtitle: rule.is_open ? "Open" : "Closed",
      window,
    };
  }

  const dateLabel = rule.date ? format(parseISO(rule.date), "MMMM d, yyyy") : "Specific date";

  return {
    title: `Exception: ${dateLabel}`,
    subtitle: rule.is_open ? "Open" : "Closed",
    window,
  };
}
