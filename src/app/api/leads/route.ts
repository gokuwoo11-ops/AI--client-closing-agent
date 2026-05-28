import { NextRequest, NextResponse } from "next/server";
import { handleIncomingChannelMessage } from "@/lib/channel-ingestion";
import { hasDatabase, requireWorkspaceId } from "@/lib/workspace";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const body = await req.json();
    const workspaceId = requireWorkspaceId(body.workspaceId);
    const result = await handleIncomingChannelMessage({
      workspaceId,
      channel: body.source || body.channel || "website",
      senderName: body.name || null,
      senderEmail: body.email || null,
      senderPhone: body.phone || null,
      serviceNeeded: body.serviceNeeded || body.service || null,
      budget: body.budget || null,
      timeline: body.timeline || null,
      messageText: body.requirements || body.message || body.messageText || "New inquiry",
      rawPayload: { source: "lead-api", body: { ...body, workspaceId } },
    });
    return NextResponse.json({ success: true, leadId: result.leadId, result });
  } catch (error) {
    console.error("Lead API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save lead" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!hasDatabase()) return NextResponse.json({ error: "Database is not configured.", leads: [] }, { status: 503 });
    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id) {
      return NextResponse.json({ error: "Not authenticated or workspace not found.", leads: [] }, { status: 401 });
    }
    const workspaceId = current.workspace.id;
    const { db } = await import("@/lib/db");
    const leads = await (db as any).lead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        conversations: {
          orderBy: { lastMessageAt: "desc" },
          take: 1,
          include: { messages: { orderBy: { createdAt: "asc" } } },
        },
        appointments: {
          orderBy: [{ scheduledStart: "asc" }, { createdAt: "desc" }],
          take: 3,
        },
      },
    });
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("GET leads error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch leads", leads: [] }, { status: 500 });
  }
}
