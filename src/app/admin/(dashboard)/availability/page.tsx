import { AvailabilityClient } from "@/components/admin/availability-client";
import { getServerEnv } from "@/lib/env";
import { ensureDefaultStudio } from "@/server/services/studios";

export default async function AvailabilityPage() {
  const { TIMEZONE } = getServerEnv();
  const defaultStudio = await ensureDefaultStudio().catch(() => null);

  return <AvailabilityClient timezone={TIMEZONE} defaultStudioId={defaultStudio?.id} />;
}
