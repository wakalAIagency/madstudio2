import { NextResponse } from "next/server";
import { requireAdmin } from "@/server/auth/session";
import { removeStudioImage } from "@/server/services/studios";

interface Context {
  params: Promise<{ id: string; imageId: string }>;
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageId } = await context.params;
    await removeStudioImage(imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete image" },
      { status: 500 },
    );
  }
}
