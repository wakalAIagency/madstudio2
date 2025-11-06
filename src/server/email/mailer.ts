import { Resend } from "resend";
import { createEvent } from "ics";
import { formatInTimeZone } from "date-fns-tz";

import { getServerEnv } from "@/lib/env";
import type { Booking } from "@/types";
import { bookingSummary } from "@/server/services/booking";

function getResendClient() {
  const { RESEND_API_KEY } = getServerEnv();
  if (!RESEND_API_KEY) {
    return null;
  }
  return new Resend(RESEND_API_KEY);
}

export async function sendBookingRequestEmail(bookings: Booking[]) {
  if (bookings.length === 0) return;

  const resend = getResendClient();
  const env = getServerEnv();

  if (!resend || !env.BOOKING_FROM_EMAIL) {
    console.warn("Skipping booking email: Resend not configured");
    return;
  }

  const [firstBooking] = bookings;
  const subject =
    bookings.length > 1
      ? "Madstudio booking request received"
      : "Madstudio booking request received";
  const body = [
    `Hi ${firstBooking.visitor_name},`,
    "",
    "Thanks for requesting a session at Madstudio. We will confirm your booking soon.",
    "",
    bookings.length === 1
      ? `Reference: ${firstBooking.id}`
      : `References: ${bookings.map((b) => b.id.slice(0, 8)).join(", ")}`,
    "",
    "Requested slot(s):",
    ...bookings.map((booking) => {
      if (!booking.slot) return `- Slot details unavailable`;
      return `- ${formatInTimeZone(
        booking.slot.start_at,
        env.TIMEZONE,
        "EEEE, MMMM d yyyy · HH:mm",
      )} – ${formatInTimeZone(
        booking.slot.end_at,
        env.TIMEZONE,
        "HH:mm",
      )} (${env.TIMEZONE})`;
    }),
    "",
    "We'll hold this time for up to 2 hours while pending approval.",
    "",
    "Madstudio Team",
  ].join("\n");

  await resend.emails.send({
    from: env.BOOKING_FROM_EMAIL,
    to: firstBooking.visitor_email,
    subject,
    text: body,
  });
}

export async function sendBookingDecisionEmail(
  booking: Booking,
  status: "approved" | "declined",
  options?: { reason?: string },
) {
  const resend = getResendClient();
  const env = getServerEnv();

  if (!resend || !env.BOOKING_FROM_EMAIL) {
    console.warn(`Skipping booking ${status} email: Resend not configured`);
    return;
  }

  const slot = booking.slot;
  const subject =
    status === "approved"
      ? "Your Madstudio session is confirmed"
      : "Update on your Madstudio booking";

  const lines = [
    `Hi ${booking.visitor_name},`,
    "",
    status === "approved"
      ? "Great news — your session is confirmed!"
      : "Thanks for your request. Unfortunately, we couldn’t confirm this slot.",
  ];

  if (slot) {
    lines.push(
      "",
      `Slot: ${formatInTimeZone(
        slot.start_at,
        env.TIMEZONE,
        "EEEE, MMMM d yyyy · HH:mm",
      )} – ${formatInTimeZone(slot.end_at, env.TIMEZONE, "HH:mm")} (${env.TIMEZONE})`,
    );
  }

  if (status === "declined" && options?.reason) {
    lines.push("", `Reason: ${options.reason}`);
  }

  lines.push("", "Madstudio Team");

  const message = lines.join("\n");

  const attachments =
    status === "approved" && slot
      ? buildCalendarAttachment(booking, env.TIMEZONE)
      : undefined;

  await resend.emails.send({
    from: env.BOOKING_FROM_EMAIL,
    to: booking.visitor_email,
    subject,
    text: message,
    attachments: attachments ? [attachments] : undefined,
  });
}

function buildCalendarAttachment(booking: Booking, timezone: string) {
  if (!booking.slot) return undefined;

  const { error, value } = createEvent({
    title: "Madstudio Photo Session",
    startInputType: "utc",
    start: dateToIcsTuple(booking.slot.start_at),
    end: dateToIcsTuple(booking.slot.end_at),
    description: bookingSummary(booking),
    organizer: { name: "Madstudio", email: booking.visitor_email },
    productId: "madstudio-booking",
    url: process.env.BASE_URL ? `${process.env.BASE_URL}/admin` : undefined,
    calName: "Madstudio Sessions",
  });

  if (error || !value) {
    console.warn("Unable to create ICS attachment", error);
    return undefined;
  }

  return {
    content: Buffer.from(value),
    filename: `madstudio-${booking.id}.ics`,
    mimeType: "text/calendar",
  } as const;
}

function dateToIcsTuple(dateISO: string) {
  const date = new Date(dateISO);
  return [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
  ] as [number, number, number, number, number];
}
