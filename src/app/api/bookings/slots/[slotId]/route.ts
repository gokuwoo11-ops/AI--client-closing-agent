import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { hasDatabase } from "@/lib/workspace";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ slotId: string }> }
) {
  try {
    if (!hasDatabase()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    const { slotId } = await context.params;
    const { db } = await import("@/lib/db");

    const existing = await (db as any).bookingSlot.findFirst({
      where: { id: slotId, workspaceId: current.workspace.id },
    });
    if (!existing) return NextResponse.json({ error: "Slot not found." }, { status: 404 });

    await (db as any).bookingSlot.update({
      where: { id: slotId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Slot DELETE failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to remove slot" }, { status: 500 });
  }
}
