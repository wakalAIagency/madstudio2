"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useApproveBooking, useAdminRequests, useDeclineBooking } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RequestsListProps {
  timezone: string;
  studioId?: string;
}

export function RequestsList({ timezone, studioId }: RequestsListProps) {
  const { data = [], isLoading, isError, refetch } = useAdminRequests(studioId);
  const approveMutation = useApproveBooking(studioId);
  const declineMutation = useDeclineBooking(studioId);

  if (!studioId) {
    return <p className="text-sm text-muted-foreground">Select a studio to view requests.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading requests…</p>;
  }

  if (isError) {
    return (
      <Card className="border border-red-200 bg-red-50/60">
        <CardContent className="space-y-3 py-6 text-sm text-red-600">
          <p>We couldn&apos;t load booking requests.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border border-dashed border-border/60 bg-surface/60">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No pending requests at the moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((booking) => {
        const slotLabel = booking.slot
          ? `${formatInTimeZone(booking.slot.startAt, timezone, "EEE, MMM d · HH:mm")} - ${formatInTimeZone(booking.slot.endAt, timezone, "HH:mm")}`
          : "Slot info unavailable";

        return (
          <Card key={booking.id} className="border border-border/60 bg-surface">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  {booking.visitorName}
                </CardTitle>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{booking.visitorEmail}</span>
                  <span>{booking.visitorPhone}</span>
                  <span>{slotLabel}</span>
                </div>
              </div>
              <Badge variant="outline">Pending</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.notes && (
                <div className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
                  {booking.notes}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate(booking.id)}
                  disabled={approveMutation.isPending || declineMutation.isPending}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const reason = window.prompt("Optional: reason for declining?");
                    declineMutation.mutate({ bookingId: booking.id, reason: reason ?? undefined });
                  }}
                  disabled={approveMutation.isPending || declineMutation.isPending}
                >
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
