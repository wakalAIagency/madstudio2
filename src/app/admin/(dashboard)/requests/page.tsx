import { RequestsClient } from "@/components/admin/requests-client";
import { getServerEnv } from "@/lib/env";
import { ensureDefaultStudio } from "@/server/services/studios";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const { TIMEZONE } = getServerEnv();
  const defaultStudio = await ensureDefaultStudio().catch(() => null);

  return <RequestsClient timezone={TIMEZONE} defaultStudioId={defaultStudio?.id} />;
}
