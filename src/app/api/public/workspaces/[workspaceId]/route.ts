import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, requireWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "Booking page is not available right now." },
        { status: 503 },
      );
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
          include: {
            services: true,
            faqs: true,
          },
        },

        agentConfig: true,

        funnelOptionPages: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            options: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },

        bookingSlots: {
          where: {
            isActive: true,
            startsAt: { gte: new Date() },

            // Prevent already booked/requested slots from showing again.
            appointments: {
              none: {
                status: {
                  in: ["BOOKED", "REQUESTED"],
                },
              },
            },
          },
          orderBy: { startsAt: "asc" },

          // Important: show enough slots, not only first few morning slots.
          take: 200,
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Public workspace load failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load booking page.",
      },
      { status: 500 },
    );
  }
}