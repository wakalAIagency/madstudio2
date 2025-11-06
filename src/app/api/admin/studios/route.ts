import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/auth/session";
import { createStudioEntry, listStudios } from "@/server/services/studios";

const createStudioSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/i),
  description: z.string().max(256).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const studios = await listStudios();
    return NextResponse.json({ studios });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load studios",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = createStudioSchema.parse(await request.json());
    const studio = await createStudioEntry({
      name: payload.name,
      slug: payload.slug.toLowerCase(),
      description: payload.description,
    });
    return NextResponse.json({ studio }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create studio",
      },
      { status: 500 },
    );
  }
}
