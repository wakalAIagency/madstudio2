import { AdminOverviewClient } from "@/components/admin/overview-client";
import { ensureDefaultStudio } from "@/server/services/studios";

export default async function AdminOverviewPage() {
  const defaultStudio = await ensureDefaultStudio().catch(() => null);
  return <AdminOverviewClient defaultStudioId={defaultStudio?.id} />;
}
