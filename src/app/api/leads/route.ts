import { NextRequest, NextResponse } from "next/server";
import { handleIncomingChannelMessage } from "@/lib/channel-ingestion";
import { hasDatabase, requireWorkspaceId } from "@/lib/workspace";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { cleanText, getClientIp, rateLimit } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limited = rateLimit(`lead-api:${ip}`, 12, 60_000);
    if (!limited.ok) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

    if (!hasDatabase()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const workspaceId = requireWorkspaceId(cleanText(body.workspaceId, 140));
    const name = cleanText(body.name, 100) || "Unknown Lead";
    const email = cleanText(body.email, 140);
    const phone = cleanText(body.phone, 50);
    const messageText = cleanText(body.requirements || body.message || body.messageText, 1200);

    if (!messageText) return NextResponse.json({ error: "Message is required." }, { status: 400 });
    if (!email && !phone) return NextResponse.json({ error: "Email or phone is required." }, { status: 400 });
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    const safeBody = {
      workspaceId,
      name,
      email,
      phone,
      serviceNeeded: cleanText(body.serviceNeeded || body.service, 180),
      budget: cleanText(body.budget, 80),
      timeline: cleanText(body.timeline, 120),
      message: messageText,
      source: cleanText(body.source || body.channel, 80) || "website",
    };

    const result = await handleIncomingChannelMessage({
      createNewLead: true,
      workspaceId,
      channel: safeBody.source,
      senderName: name,
      senderEmail: email || null,
      senderPhone: phone || null,
      serviceNeeded: safeBody.serviceNeeded || null,
      budget: safeBody.budget || null,
      timeline: safeBody.timeline || null,
      messageText,
      rawPayload: { source: "lead-api", body: safeBody },
    });
    return NextResponse.json({ success: true, leadId: result.leadId, result });
  } catch (error) {
    console.error("Lead API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save lead" }, { status: 500 });
  }
}

export async function GET() {
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
