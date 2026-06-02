import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { hasDatabase } from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Database is not configured.", notifications: [] }, { status: 503 });
    }

    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id || !current?.user?.id) {
      return NextResponse.json({ error: "Not authenticated.", notifications: [] }, { status: 401 });
    }

    const { db } = await import("@/lib/db");
    const notifications = await (db as any).notification.findMany({
      where: {
        workspaceId: current.workspace.id,
        userId: current.user.id,
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((item: { isRead: boolean }) => !item.isRead).length,
    });
  } catch (error) {
    console.error("Notifications GET failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load notifications.", notifications: [] },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    }

    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id || !current?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const markAllRead = body?.markAllRead !== false;

    if (!markAllRead) {
      return NextResponse.json({ error: "Unsupported notification update." }, { status: 400 });
    }

    const { db } = await import("@/lib/db");
    await (db as any).notification.updateMany({
      where: {
        workspaceId: current.workspace.id,
        userId: current.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PATCH failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update notifications." },
      { status: 500 },
    );
  }
}
