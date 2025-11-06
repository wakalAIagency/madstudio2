import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { addStudioImage } from "@/server/services/studios";

const createImageSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().max(256).optional(),
  sortOrder: z.number().int().optional(),
});

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: Context) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = createImageSchema.parse(await request.json());
    const { id } = await context.params;
    const image = await addStudioImage({
      studioId: id,
      imageUrl: payload.imageUrl,
      caption: payload.caption,
      sortOrder: payload.sortOrder,
    });
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add image" },
      { status: 500 },
    );
  }
}
