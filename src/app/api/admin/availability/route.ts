import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createAvailabilityRule,
  generateSlotsForRange,
  listAvailabilityRules,
} from "@/server/services/availability";
import { requireAdmin } from "@/server/auth/session";
import { ensureDefaultStudio } from "@/server/services/studios";

const createRuleSchema = z.object({
  ruleType: z.enum(["weekly", "exception"]),
  weekday: z.number().min(0).max(6).nullable().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  isOpen: z.boolean().optional(),
  studioId: z.string().uuid(),
});

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

    const rules = await listAvailabilityRules(studioId);
    return NextResponse.json({ rules, studioId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load availability" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    const payload = createRuleSchema.parse(await request.json());
    const rule = await createAvailabilityRule({
      rule_type: payload.ruleType,
      weekday: payload.weekday ?? null,
      start_time: payload.startTime,
      end_time: payload.endTime,
      date: payload.date ?? null,
      is_open: payload.isOpen ?? true,
      created_by: session.user.id,
      studio_id: payload.studioId,
    });

    const now = new Date();
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + 30);
    await generateSlotsForRange({
      start: now.toISOString(),
      end: horizon.toISOString(),
      studioId: payload.studioId,
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create rule" },
      { status: 500 },
    );
  }
}
