import { StudiosClient } from "@/components/admin/studios-client";
import { ensureDefaultStudio } from "@/server/services/studios";

export const dynamic = "force-dynamic";

export default async function AdminStudiosPage() {
  const defaultStudio = await ensureDefaultStudio().catch(() => null);
  return <StudiosClient defaultStudioId={defaultStudio?.id ?? undefined} />;
}
