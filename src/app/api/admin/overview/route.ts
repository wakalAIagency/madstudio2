import { NextResponse } from "next/server";
import { adminOverview } from "@/server/services/booking";
import { requireAdmin } from "@/server/auth/session";
import { ensureDefaultStudio } from "@/server/services/studios";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studioParam = searchParams.get("studioId");
    const studioId = studioParam ?? (await ensureDefaultStudio())?.id;
    if (!studioId) {
      return NextResponse.json({ error: "No studios configured" }, { status: 404 });
    }

    const stats = await adminOverview(studioId);
    return NextResponse.json({ stats, studioId });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load overview",
      },
      { status: 500 },
    );
  }
}
