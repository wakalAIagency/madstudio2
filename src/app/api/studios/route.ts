import { NextResponse } from "next/server";
import { listStudios } from "@/server/services/studios";

export async function GET() {
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
