import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, requireWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> }
) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    }

    const { workspaceId: rawWorkspaceId } = await context.params;
    const workspaceId = requireWorkspaceId(rawWorkspaceId);
    const { db } = await import("@/lib/db");
    const client = db as any;

    const workspace = await client.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true,
        businessProfile: {
          include: { services: true, faqs: true },
        },
        agentConfig: true,
        bookingSlots: {
          where: { isActive: true, startsAt: { gte: new Date() } },
          orderBy: { startsAt: "asc" },
          take: 12,
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Public workspace load failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load booking funnel." },
      { status: 500 }
    );
  }
}
