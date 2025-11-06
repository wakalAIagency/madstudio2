import { NextResponse } from "next/server";
import { deleteAvailabilityRule } from "@/server/services/availability";
import { requireAdmin } from "@/server/auth/session";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteAvailabilityRule(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete rule" },
      { status: 500 },
    );
  }
}
