import { NextRequest, NextResponse } from "next/server";
import { handleIncomingChannelMessage } from "@/lib/channel-ingestion";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id) {
      return NextResponse.json({ error: "Not authenticated or workspace not found" }, { status: 401 });
    }
    const workspaceId = current.workspace.id;
    const result = await handleIncomingChannelMessage({
      workspaceId,
      channel: body.channel || "manual",
      externalConversationId: body.externalConversationId || `${body.channel || "manual"}-${body.senderPhone || body.senderEmail || crypto.randomUUID()}`,
      externalMessageId: body.externalMessageId || crypto.randomUUID(),
      senderName: body.senderName || null,
      senderEmail: body.senderEmail || null,
      senderPhone: body.senderPhone || null,
      serviceNeeded: body.serviceNeeded || null,
      budget: body.budget || null,
      timeline: body.timeline || null,
      messageText: body.messageText || body.message || "New inquiry",
      rawPayload: { source: "manual-inbound", body: { ...body, workspaceId } },
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Manual inbound ingestion failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to ingest channel message" }, { status: 500 });
  }
}
