import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { hasDatabase } from "@/lib/workspace";

export const runtime = "nodejs";

function getDateRange(range: string | null) {
  const now = new Date();

  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { gte: start, lt: end };
  }

  if (range === "all") {
    return undefined;
  }

  return { gte: now };
}

export async function GET(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Database is not configured.", appointments: [] }, { status: 503 });
    }

    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id) {
      return NextResponse.json({ error: "Not authenticated.", appointments: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "upcoming";
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 200);
    const scheduledStart = getDateRange(range);

    const { db } = await import("@/lib/db");
    const client = db as any;

    const appointments = await client.appointment.findMany({
      where: {
        workspaceId: current.workspace.id,
        ...(scheduledStart ? { scheduledStart } : {}),
        status: { in: ["BOOKED", "REQUESTED"] },
      },
      orderBy: [{ scheduledStart: "asc" }, { createdAt: "asc" }],
      take: limit,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            source: true,
            score: true,
            nextAction: true,
          },
        },
        bookingSlot: true,
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Appointments GET failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load appointments.", appointments: [] },
      { status: 500 }
    );
  }
}
