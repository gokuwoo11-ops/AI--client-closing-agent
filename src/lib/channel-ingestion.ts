import { generateLeadQualification } from "@/lib/ai";
import { assertWorkspaceExists, getWorkspaceOwnerUserId, hasDatabase, requireWorkspaceId } from "@/lib/workspace";

export type IncomingChannelMessage = {
  saveAgentReply?: boolean;
  /** When true, always create a fresh lead record. Use this for public form/funnel submissions so each new request is visible separately. */
  createNewLead?: boolean;
  workspaceId?: string | null;
  channel: string;
  externalConversationId?: string | null;
  externalMessageId?: string | null;
  senderName?: string | null;
  senderEmail?: string | null;
  senderPhone?: string | null;
  serviceNeeded?: string | null;
  budget?: string | null;
  timeline?: string | null;
  messageText: string;
  rawPayload?: Record<string, unknown>;
};

export type IngestionResult = {
  leadId: string;
  conversationId: string;
  reply: string;
  summary: string;
  nextAction: string;
  score: number;
  mode: string;
  replySaved: boolean;
};

function normalizeChannel(channel: string) {
  const lowered = String(channel || "manual").toLowerCase().trim();
  if (lowered === "website_form") return "website";
  if (lowered === "widget") return "website_widget";
  return lowered || "manual";
}

export async function handleIncomingChannelMessage(input: IncomingChannelMessage): Promise<IngestionResult> {
  if (!hasDatabase()) throw new Error("Database is not configured. Add DATABASE_URL and run Prisma migration before capturing leads.");

  const workspaceId = requireWorkspaceId(input.workspaceId);
  await assertWorkspaceExists(workspaceId);

  const { db } = await import("@/lib/db");
  const client = db as any;
  const channel = normalizeChannel(input.channel);
  const messageText = String(input.messageText || "").trim();
  if (!messageText) throw new Error("messageText is required.");

  const agentConfig = await client.agentConfig.upsert({
    where: { workspaceId },
    update: {},
    create: { workspaceId, name: "Sales Assistant", tone: "professional" },
  });

  const businessProfile = await client.businessProfile.findUnique({
    where: { workspaceId },
    include: { services: true, faqs: true },
  });

  const ai = await generateLeadQualification({
    lead: {
      name: input.senderName,
      email: input.senderEmail,
      phone: input.senderPhone,
      serviceNeeded: input.serviceNeeded || null,
      budget: input.budget || null,
      timeline: input.timeline || null,
      message: messageText,
    },
    agentConfig,
    businessProfile,
  });

  const shouldCreateFreshLead = input.createNewLead === true;

  let lead = shouldCreateFreshLead
    ? null
    : input.senderEmail
      ? await client.lead.findFirst({ where: { workspaceId, email: input.senderEmail } })
      : input.senderPhone
        ? await client.lead.findFirst({ where: { workspaceId, phone: input.senderPhone } })
        : null;

  if (!lead) {
    lead = await client.lead.create({
      data: {
        workspaceId,
        name: input.senderName || "Unknown Lead",
        email: input.senderEmail || null,
        phone: input.senderPhone || null,
        source: channel,
        score: ai.score,
        summary: ai.summary,
        nextAction: ai.nextAction,
        status: ai.score >= 70 ? "QUALIFIED" : "NEW",
        requirements: messageText.slice(0, 500),
        budget: input.budget || null,
        timeline: input.timeline || null,
      },
    });
  } else {
    lead = await client.lead.update({
      where: { id: lead.id },
      data: {
        score: ai.score,
        summary: ai.summary,
        nextAction: ai.nextAction,
        requirements: lead.requirements || messageText.slice(0, 500),
        budget: lead.budget || input.budget || null,
        timeline: lead.timeline || input.timeline || null,
        lastContactedAt: new Date(),
      },
    });
  }

  let conversation = input.externalConversationId
    ? await client.conversation.findFirst({ where: { leadId: lead.id, externalId: input.externalConversationId } })
    : await client.conversation.findFirst({ where: { leadId: lead.id, channel }, orderBy: { createdAt: "desc" } });

  if (!conversation) {
    conversation = await client.conversation.create({
      data: {
        leadId: lead.id,
        agentConfigId: agentConfig.id,
        channel,
        externalId: input.externalConversationId || null,
        summary: ai.summary,
        nextAction: ai.nextAction,
      },
    });
  }

  await client.message.create({
    data: {
      conversationId: conversation.id,
      senderType: "LEAD",
      content: messageText,
      externalId: input.externalMessageId || null,
      channelMetadata: input.rawPayload || undefined,
    },
  });

  const shouldSaveAgentReply = input.saveAgentReply !== false;
  let replySaved = false;

  if (ai.reply && shouldSaveAgentReply) {
    await client.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "AGENT",
        content: ai.reply,
      },
    });
    replySaved = true;
  }

  await client.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date(), summary: ai.summary, nextAction: ai.nextAction },
  });

  const ownerUserId = await getWorkspaceOwnerUserId(workspaceId);
  if (ownerUserId) {
    await client.notification.create({
      data: {
        workspaceId,
        userId: ownerUserId,
        title: `New ${channel} message from ${input.senderName || input.senderEmail || input.senderPhone || "Unknown"}`,
        message: ai.summary,
        link: `/leads/${lead.id}`,
      },
    }).catch(() => null);
  }

  return {
    leadId: lead.id,
    conversationId: conversation.id,
    reply: ai.reply,
    summary: ai.summary,
    nextAction: ai.nextAction,
    score: ai.score,
    mode: ai.mode,
    replySaved,
  };
}

export async function recordAgentReply(conversationId: string, content: string, metadata?: Record<string, unknown>) {
  if (!hasDatabase()) throw new Error("Database is not configured.");
  const text = String(content || "").trim();
  if (!text) return null;
  const { db } = await import("@/lib/db");
  return (db as any).message.create({
    data: {
      conversationId,
      senderType: "AGENT",
      content: text,
      channelMetadata: metadata || undefined,
    },
  });
}

export async function resolveWorkspaceIdForWebhook(provider: string, explicitWorkspaceId?: string | null, externalAccountId?: string | null) {
  if (explicitWorkspaceId) return requireWorkspaceId(explicitWorkspaceId);
  if (!hasDatabase()) throw new Error("Database is not configured. Add DATABASE_URL before receiving webhooks.");
  if (!externalAccountId) {
    throw new Error(`${provider} webhook cannot be mapped to a workspace. Add the real provider account ID to the workspace Integration config.`);
  }

  const { db } = await import("@/lib/db");
  const integrations = await (db as any).integration.findMany({
    where: { provider, isActive: true },
    select: { workspaceId: true, config: true },
  });

  const matched = integrations.find((integration: any) => {
    const config = integration.config || {};
    return [
      config.phoneNumberId,
      config.whatsappPhoneNumberId,
      config.pageId,
      config.facebookPageId,
      config.instagramBusinessAccountId,
      config.accountId,
    ]
      .filter(Boolean)
      .map(String)
      .includes(String(externalAccountId));
  });

  if (!matched?.workspaceId) {
    throw new Error(`${provider} webhook is not connected to any workspace. Complete real integration setup first.`);
  }

  return matched.workspaceId;
}

