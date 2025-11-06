import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { deleteStudioEntry, updateStudioEntry } from "@/server/services/studios";

const updateStudioSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/i),
  description: z.string().max(512).nullable().optional(),
});

interface Context {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = updateStudioSchema.parse(await request.json());
    const { id } = await context.params;
    const studio = await updateStudioEntry({
      id,
      name: payload.name,
      slug: payload.slug.toLowerCase(),
      description: payload.description ?? null,
    });
    return NextResponse.json({ studio });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update studio" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteStudioEntry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete studio" },
      { status: 500 },
    );
  }
}
