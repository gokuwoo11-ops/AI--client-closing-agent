import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { hasDatabase } from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasDatabase()) return NextResponse.json({ error: "Database is not configured.", slots: [] }, { status: 503 });
    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id) return NextResponse.json({ error: "Not authenticated.", slots: [] }, { status: 401 });
    const { db } = await import("@/lib/db");
    const slots = await (db as any).bookingSlot.findMany({
      where: { workspaceId: current.workspace.id },
      orderBy: { startsAt: "asc" },
      take: 100,
    });
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Slot GET failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load slots", slots: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const body = await req.json();
    const title = String(body.title || "Available appointment").trim();
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt || startsAt.getTime() + 30 * 60 * 1000);

    if (!Number.isFinite(startsAt.getTime())) {
      return NextResponse.json({ error: "Valid startsAt is required." }, { status: 400 });
    }
    if (!Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
      return NextResponse.json({ error: "endsAt must be after startsAt." }, { status: 400 });
    }

    const { db } = await import("@/lib/db");
    const slot = await (db as any).bookingSlot.create({
      data: {
        workspaceId: current.workspace.id,
        title,
        startsAt,
        endsAt,
        timezone: String(body.timezone || "Asia/Kolkata"),
        capacity: Math.max(1, Number(body.capacity || 1)),
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ success: true, slot });
  } catch (error) {
    console.error("Slot POST failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create slot" }, { status: 500 });
  }
}
