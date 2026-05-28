import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

const allowedStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "BOOKING_SENT",
  "BOOKED",
  "FOLLOW_UP",
  "WON",
  "LOST",
  "SPAM",
];

type LeadRouteContext = {
  params: Promise<{
    leadId: string;
  }>;
};

export async function GET(_req: NextRequest, context: LeadRouteContext) {
  try {
    const { leadId } = await context.params;

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id) {
      return NextResponse.json({ error: "Not authenticated or workspace not found" }, { status: 401 });
    }

    const lead = await db.lead.findFirst({
      where: { id: leadId, workspaceId: current.workspace.id },
      include: {
        appointments: {
          orderBy: [{ scheduledStart: "asc" }, { createdAt: "desc" }],
        },
        conversations: {
          orderBy: { createdAt: "desc" },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found", leadId }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Lead detail fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: LeadRouteContext) {
  try {
    const { leadId } = await context.params;

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    const current = await getCurrentWorkspace();
    if (!current?.workspace?.id) {
      return NextResponse.json({ error: "Not authenticated or workspace not found" }, { status: 401 });
    }

    const existingLead = await db.lead.findFirst({
      where: { id: leadId, workspaceId: current.workspace.id },
      select: { id: true },
    });

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));

    const data: {
      status?: any;
      notes?: string | null;
      summary?: string | null;
      nextAction?: string | null;
    } = {};

    if (typeof body.status === "string" && allowedStatuses.includes(body.status)) {
      data.status = body.status;
    }

    if (typeof body.notes === "string") {
      data.notes = body.notes;
    }

    if (typeof body.summary === "string") {
      data.summary = body.summary;
    }

    if (typeof body.nextAction === "string") {
      data.nextAction = body.nextAction;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const lead = await db.lead.update({
      where: { id: leadId },
      data,
      include: {
        appointments: {
          orderBy: [{ scheduledStart: "asc" }, { createdAt: "desc" }],
        },
        conversations: {
          orderBy: { createdAt: "desc" },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Lead update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update lead" },
      { status: 500 }
    );
  }
}