export function getSlotDurationMinutes() {
  const envValue =
    process.env.SLOT_DURATION_MINUTES ??
    process.env.NEXT_PUBLIC_SLOT_DURATION_MINUTES;

  if (envValue) {
    const parsed = Number(envValue);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 60;
}

