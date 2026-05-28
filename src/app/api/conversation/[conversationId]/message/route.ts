import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateLeadQualification } from "@/lib/ai";

export const runtime = "nodejs";

type MessageRouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function POST(req: NextRequest, context: MessageRouteContext) {
  try {
    const { conversationId } = await context.params;
    const body = await req.json().catch(() => ({}));

    const message = String(body.message || "").trim();

    if (!conversationId) {
      return NextResponse.json(
        { error: "Missing conversationId" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const conversation = await db.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        lead: true,
        agentConfig: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const businessProfile = await db.businessProfile.findUnique({
      where: {
        workspaceId: conversation.lead.workspaceId,
      },
      include: {
        services: true,
        faqs: true,
      },
    });

    const leadMessage = [
      conversation.lead.requirements,
      "Latest customer reply:",
      message,
    ]
      .filter(Boolean)
      .join("\n\n");

    const ai = await generateLeadQualification({
      lead: {
        name: conversation.lead.name,
        email: conversation.lead.email,
        phone: conversation.lead.phone,
        serviceNeeded: conversation.lead.requirements,
        budget: conversation.lead.budget,
        timeline: conversation.lead.timeline,
        message: leadMessage,
      },
      agentConfig: conversation.agentConfig,
      businessProfile,
    });

    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "LEAD",
        content: message,
      },
    });

    if (ai.reply) {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          senderType: "AGENT",
          content: ai.reply,
        },
      });
    }

    await db.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        summary: ai.summary,
        nextAction: ai.nextAction,
        lastMessageAt: new Date(),
      },
    });

    await db.lead.update({
      where: {
        id: conversation.leadId,
      },
      data: {
        summary: ai.summary,
        nextAction: ai.nextAction,
        score: ai.score,
        lastContactedAt: new Date(),
      },
    });

    const updatedConversation = await db.conversation.findUnique({
      where: {
        id: conversation.id,
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversation: updatedConversation,
      ai,
    });
  } catch (error) {
    console.error("Conversation message error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send conversation message",
      },
      { status: 500 }
    );
  }
}