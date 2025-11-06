import { differenceInMinutes, isEqual, parseISO, set } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { getClientEnv, getServerEnv } from "./env";

export const TIME_FORMAT = "HH:mm";
export const DATE_FORMAT = "yyyy-MM-dd";
export const DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm";

export function getTimezone() {
  if (typeof window === "undefined") {
    return getServerEnv().TIMEZONE;
  }

  try {
    return (
      getClientEnv().NEXT_PUBLIC_TIMEZONE ??
      process.env.NEXT_PUBLIC_TIMEZONE ??
      "Asia/Muscat"
    );
  } catch {
    return process.env.NEXT_PUBLIC_TIMEZONE ?? "Asia/Muscat";
  }
}

export function formatDateTime(date: Date | string, fmt = DATE_TIME_FORMAT) {
  const tz = getTimezone();
  const value = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(value, tz, fmt);
}

export function formatTime(date: Date | string) {
  return formatDateTime(date, TIME_FORMAT);
}

export function toTimezone(date: Date | string) {
  const tz = getTimezone();
  const value = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(value, tz);
}

export function combineDateAndTime(date: string, time: string) {
  const base = parseISO(date);
  const [hours, minutes] = time.split(":").map(Number);
  return set(base, {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  });
}

export function isSameSlot(start: string, end: string, compare: SlotWindow) {
  return (
    isEqual(parseISO(start), parseISO(compare.start)) &&
    isEqual(parseISO(end), parseISO(compare.end))
  );
}

export function slotDurationMinutes(slot: SlotWindow) {
  return differenceInMinutes(parseISO(slot.end), parseISO(slot.start));
}

export interface SlotWindow {
  start: string;
  end: string;
}

export function formatSlotLabel(slot: SlotWindow) {
  return `${formatTime(slot.start)} – ${formatTime(slot.end)}`;
}
