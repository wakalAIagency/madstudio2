"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatInTimeZone } from "date-fns-tz";

import type { AvailableSlot } from "@/hooks/use-slots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const bookingSchema = z.object({
  visitorName: z.string().min(2, "Please enter your name"),
  visitorEmail: z.string().email("Enter a valid email"),
  visitorPhone: z.string().min(5, "Phone number is required"),
  notes: z.string().max(500).optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  slots: AvailableSlot[];
  timezone: string;
  onSubmitted: (result: {
    bookings: Array<{ id: string; slotId: string; token: string }>;
    holdExpiresAt?: string;
  }) => void;
}

export function BookingForm({ slots, timezone, onSubmitted }: BookingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      visitorName: "",
      visitorEmail: "",
      visitorPhone: "",
      notes: "",
    },
  });

  const slotSummaries = slots.map((slot) => ({
    id: slot.id,
    label: formatInTimeZone(slot.startAt, timezone, "EEEE, MMMM d · HH:mm"),
    endLabel: formatInTimeZone(slot.endAt, timezone, "HH:mm"),
  }));

  const onSubmit = (values: BookingFormValues) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slotIds: slots.map((slot) => slot.id),
            ...values,
          }),
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Unable to submit booking");
        }

        const data = await response.json();
        onSubmitted({ bookings: data.bookings, holdExpiresAt: data.holdExpiresAt });
        reset();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Unable to submit booking",
        );
      }
    });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Booking details
        </h3>
        <p className="text-sm text-muted-foreground">
          You&apos;re requesting {slots.length} slot{slots.length > 1 ? "s" : ""} ({timezone}). The Madstudio
          team will confirm by email.
        </p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {slotSummaries.map((summary) => (
            <li key={summary.id}>
              • {summary.label} – {summary.endLabel}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="visitorName">Full name</Label>
          <Input id="visitorName" placeholder="Jane Doe" {...register("visitorName")} />
          {errors.visitorName && (
            <p className="text-xs text-red-500">{errors.visitorName.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="visitorEmail">Email</Label>
          <Input
            id="visitorEmail"
            type="email"
            placeholder="you@example.com"
            {...register("visitorEmail")}
          />
          {errors.visitorEmail && (
            <p className="text-xs text-red-500">{errors.visitorEmail.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="visitorPhone">Phone</Label>
          <Input id="visitorPhone" placeholder="+968 9999 0000" {...register("visitorPhone")} />
          {errors.visitorPhone && (
            <p className="text-xs text-red-500">{errors.visitorPhone.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" rows={4} placeholder="Any creative direction or special requests?" {...register("notes")} />
          {errors.notes && (
            <p className="text-xs text-red-500">{errors.notes.message}</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Submitting..." : "Request booking"}
      </Button>
    </form>
  );
}
