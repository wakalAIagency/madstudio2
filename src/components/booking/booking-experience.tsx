/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlotCalendar } from "./slot-calendar";
import { BookingForm } from "./booking-form";
import { useAvailableSlots, type AvailableSlot } from "@/hooks/use-slots";
import { useStudios } from "@/hooks/use-studios";
import type { Studio, StudioImage } from "@/types";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface BookingExperienceProps {
  timezone: string;
  defaultStudioId?: string;
}

type BookingConfirmation = {
  bookings: Array<{ id: string; slotId: string; token: string }>;
  holdExpiresAt?: string;
  slots: AvailableSlot[];
};

type StudioOption = Pick<Studio, "id" | "name" | "description"> & {
  images: StudioImage[];
};

export function BookingExperience({ timezone, defaultStudioId }: BookingExperienceProps) {
  const studiosQuery = useStudios();
  const studios: Studio[] = useMemo(
    () => studiosQuery.data ?? [],
    [studiosQuery.data],
  );
  const studiosLoading = studiosQuery.isLoading;
  const [selectedStudioId, setSelectedStudioId] = useState<string | undefined>(defaultStudioId);

  const studioOptions: StudioOption[] = useMemo(
    () =>
      studios.map((studio) => ({
        id: studio.id,
        name: studio.name,
        description: studio.description,
        images: studio.images ?? [],
      })),
    [studios],
  );
  const activeStudioId = selectedStudioId ?? studioOptions[0]?.id;

  const { data: slots = [], isLoading, refetch, isError } = useAvailableSlots(activeStudioId);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const selectedSlots = useMemo(
    () => slots.filter((slot) => selectedSlotIds.includes(slot.id)),
    [selectedSlotIds, slots],
  );

  const selectedStudio = useMemo(
    () => studioOptions.find((studio) => studio.id === activeStudioId),
    [studioOptions, activeStudioId],
  );

  const galleryImages = useMemo(() => {
    if (!selectedStudio?.images) return [];
    return [...selectedStudio.images].sort((a, b) => a.sort_order - b.sort_order);
  }, [selectedStudio]);

  if (isLoading) {
    return (
      <Card className="border-none bg-surface/60 p-12 text-center shadow-lg">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading available slots...</p>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border border-red-200 bg-red-50/70 p-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-red-700">We couldn&apos;t load availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-red-600">
          <p>Please refresh the page. If the issue persists, reach out at booking@madstudio.om.</p>
          <Button variant="outline" onClick={() => refetch()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-12">
      {selectedStudio && galleryImages.length > 0 ? (
        <StudioHeroGallery studio={selectedStudio} images={galleryImages} />
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="border-none bg-surface shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Choose your session</CardTitle>
            <p className="text-sm text-muted-foreground">
              All times shown in {timezone}.{" "}
              {selectedStudio ? `Studio: ${selectedStudio.name}.` : null}
            </p>
          </div>
          <Badge variant="outline">Live availability</Badge>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="studio-select" className="text-xs uppercase tracking-wide text-muted-foreground">
                Studio
              </Label>
              <Select
                id="studio-select"
                value={activeStudioId ?? ""}
                onChange={(event) => {
                  const value = event.target.value || undefined;
                  setSelectedSlotIds([]);
                  setConfirmation(null);
                  setSelectedStudioId(value);
                }}
                disabled={studiosLoading || studioOptions.length === 0}
                className="min-w-[220px]"
              >
                <option value="" disabled>
                  {studiosLoading ? "Loading studios..." : "Select a studio"}
                </option>
                {studioOptions.map((studio) => (
                  <option key={studio.id} value={studio.id}>
                    {studio.name}
                  </option>
                ))}
              </Select>
            </div>
            {selectedStudio?.description && (
              <p className="text-sm text-muted-foreground/80 max-w-sm">
                {selectedStudio.description}
              </p>
            )}
          </div>
          <SlotCalendar
            slots={slots}
            timezone={timezone}
            selectedSlotIds={selectedSlotIds}
            onToggle={(slot) => {
              setSelectedSlotIds((prev) => {
                if (prev.includes(slot.id)) {
                  return prev.filter((id) => id !== slot.id);
                }
                return [...prev, slot.id];
              });
              setConfirmation(null);
            }}
          />
        </CardContent>
        </Card>

        <div className="space-y-6">
        {confirmation ? (
          <Card className="border border-border/60 bg-surface">
            <CardContent className="pt-6">
              <ConfirmationSummary
                bookings={confirmation.bookings}
                slots={confirmation.slots}
                holdExpiresAt={confirmation.holdExpiresAt}
                timezone={timezone}
                onBookAnother={async () => {
                  setConfirmation(null);
                  setSelectedSlotIds([]);
                  await refetch();
                }}
              />
            </CardContent>
          </Card>
        ) : selectedSlots.length > 0 ? (
          <Card className="border border-border/60 bg-surface">
            <CardContent className="pt-6">
              <BookingForm
                slots={selectedSlots}
                timezone={timezone}
                onSubmitted={(data) => {
                  const snapshot = selectedSlots.map((slot) => ({ ...slot }));
                  setConfirmation({
                    bookings: data.bookings,
                    holdExpiresAt: data.holdExpiresAt,
                    slots: snapshot,
                  });
                  setSelectedSlotIds([]);
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-border/60 bg-surface/40 p-8 text-center text-sm text-muted-foreground">
            {activeStudioId
              ? "Select one or more slots to continue."
              : "Choose a studio to view its availability."}
          </Card>
        )}

          <Card className="border-none bg-muted/30">
          <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How it works</p>
            <ol className="space-y-2 text-left">
              <li>1. Pick one or more open slots.</li>
              <li>2. Submit your details.</li>
              <li>3. Madstudio confirms by email (usually within 24 hours).</li>
            </ol>
            <p>
              Need a faster turnaround? Reach us directly at
              <a className="font-medium text-accent" href="mailto:booking@madstudio.om">
                {" "}
                booking@madstudio.om
              </a>
              . Selected slots remain on hold for 2 hours while pending approval.
            </p>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ConfirmationSummary({
  bookings,
  slots,
  holdExpiresAt,
  timezone,
  onBookAnother,
}: {
  bookings: Array<{ id: string; slotId: string; token: string }>;
  slots: AvailableSlot[];
  holdExpiresAt?: string;
  timezone: string;
  onBookAnother: () => void | Promise<void>;
}) {
  const slotDetails = slots.map((slot) => {
    const booking = bookings.find((item) => item.slotId === slot.id);
    return {
      slot,
      booking,
      startLabel: formatInTimeZone(slot.startAt, timezone, "EEEE, MMMM d · HH:mm"),
      endLabel: formatInTimeZone(slot.endAt, timezone, "HH:mm"),
    };
  });

  const holdLabel =
    holdExpiresAt && formatInTimeZone(holdExpiresAt, timezone, "EEE, MMM d · HH:mm");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Request received!</h3>
        <p className="text-sm text-muted-foreground">
          Your request covers {slots.length} slot{slots.length > 1 ? "s" : ""}. We&apos;ll email you once the
          session{slots.length > 1 ? "s are" : " is"} confirmed.
        </p>
      </div>
      <div className="rounded-lg border border-border/60 bg-surface/70 p-4 text-sm">
        <p className="font-medium text-foreground">
          Requested slot{slots.length > 1 ? "s" : ""}
        </p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {slotDetails.map(({ slot, startLabel, endLabel, booking }) => (
            <li key={slot.id} className="flex flex-col gap-1">
              <span>
                {startLabel} – {endLabel} ({timezone})
              </span>
              {booking && (
                <span className="text-xs text-muted-foreground">
                  Reference: <span className="font-mono text-foreground">{booking.id.slice(0, 8)}</span> · Token: {" "}
                  <span className="font-mono text-foreground">{booking.token.slice(0, 12)}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2 text-xs text-muted-foreground">
        {holdLabel && (
          <p>
            Hold expires at <span className="font-medium text-foreground">{holdLabel}</span> if not approved.
          </p>
        )}
        <p>If you need changes, reply to your confirmation email.</p>
      </div>
      <Button variant="outline" onClick={() => onBookAnother()}>Book another session</Button>
    </div>
  );
}

function StudioHeroGallery({
  studio,
  images,
}: {
  studio: StudioOption;
  images: StudioImage[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [studio.id]);

  const featuredImage = images[activeIndex];
  const previewImages = images.slice(0, 6);

  return (
    <section className="space-y-4">
      <div className="rounded-[32px] border border-white/5 bg-gradient-to-br from-[#050505] via-[#0c1117] to-[#050505] p-6 text-white shadow-[0_25px_80px_-40px_rgba(0,0,0,0.8)]">
        <div className="grid gap-6 lg:grid-cols-[1.6fr,0.8fr]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
            <img
              src={featuredImage.image_url}
              alt={featuredImage.caption ?? `${studio.name} highlight`}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-sm uppercase tracking-[0.6em] text-white/60">
                {studio.name}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {featuredImage.caption ?? "Signature look"}
              </h2>
              {studio.description ? (
                <p className="mt-1 max-w-md text-sm text-white/70">
                  {studio.description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-[24px] bg-white/5 p-5 backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.45em] text-white/60">
                Studio preview
              </p>
              <p className="text-base font-medium text-white/90">
                swipe through the vibe
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {previewImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-2xl border transition ${
                    index === activeIndex
                      ? "border-[#29ff6d] shadow-[0_0_25px_rgba(41,255,109,0.35)]"
                      : "border-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={image.caption ?? `${studio.name} preview`}
                    className="h-full w-full object-cover"
                  />
                  {image.caption ? (
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[0.65rem] text-white/80 line-clamp-1">
                      {image.caption}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-[#29ff6d]" />
              {images.length > 1 ? `${images.length} curated angles` : "1 curated angle"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
