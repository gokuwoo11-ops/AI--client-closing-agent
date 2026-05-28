import { NextRequest, NextResponse } from "next/server";
import { handleIncomingChannelMessage } from "@/lib/channel-ingestion";
import { assertWorkspaceExists, hasDatabase, requireWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

function clean(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    }

    const body = await req.json();
    const workspaceId = requireWorkspaceId(body.workspaceId);
    await assertWorkspaceExists(workspaceId);

    const name = clean(body.name) || "Booking Funnel Lead";
    const email = clean(body.email);
    const phone = clean(body.phone);
    const serviceNeeded = clean(body.serviceNeeded || body.serviceName);
    const preferredTime = clean(body.preferredTime);
    const message = clean(body.message || body.requirements) || "New qualified booking inquiry";

    if (!serviceNeeded) {
      return NextResponse.json({ error: "Service is required before showing booking times." }, { status: 400 });
    }

    if (!name || name === "Booking Funnel Lead") {
      return NextResponse.json({ error: "Name is required before showing booking times." }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json({ error: "Phone or email is required before showing booking times." }, { status: 400 });
    }

    const result = await handleIncomingChannelMessage({
      workspaceId,
      createNewLead: true,
      channel: "ai_booking_funnel",
      senderName: name,
      senderEmail: email,
      senderPhone: phone,
      serviceNeeded,
      timeline: preferredTime,
      messageText: [
        `Qualification completed before slot selection.`,
        serviceNeeded ? `Service: ${serviceNeeded}` : null,
        preferredTime ? `Preferred time: ${preferredTime}` : null,
        `Requirement: ${message}`,
      ]
        .filter(Boolean)
        .join("\n"),
      rawPayload: { source: "public-booking-qualification", body: { ...body, workspaceId } },
    });

    const { db } = await import("@/lib/db");
    await (db as any).lead.update({
      where: { id: result.leadId },
      data: {
        status: result.score >= 65 ? "QUALIFIED" : "NEW",
        nextAction: result.nextAction || "Show available booking slots.",
        timeline: preferredTime,
      },
    });

    return NextResponse.json({
      success: true,
      leadId: result.leadId,
      conversationId: result.conversationId,
      ai: {
        reply:
          result.reply ||
          "Thanks, your details look good. Please choose one of the available times below to confirm your booking request.",
        summary: result.summary,
        nextAction: result.nextAction,
        score: result.score,
        mode: result.mode,
      },
    });
  } catch (error) {
    console.error("Public qualification failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to qualify booking request." },
      { status: 500 }
    );
  }
}
