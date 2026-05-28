import { NextRequest, NextResponse } from "next/server";
import { handleIncomingChannelMessage, recordAgentReply, resolveWorkspaceIdForWebhook } from "@/lib/channel-ingestion";
import { sendChannelReply } from "@/lib/channel-delivery";

export const runtime = "nodejs";
const CHANNEL = "facebook";

type AnyRecord = Record<string, unknown>;

function isWhatsAppChannel() {
  return String(CHANNEL) === "whatsapp";
}

function getNestedText(payload: AnyRecord): string {
  const entry = Array.isArray(payload.entry) ? (payload.entry[0] as AnyRecord | undefined) : undefined;
  const change = Array.isArray(entry?.changes) ? (entry?.changes?.[0] as AnyRecord | undefined) : undefined;
  const value = change?.value as AnyRecord | undefined;
  const messages = Array.isArray(value?.messages) ? value?.messages : undefined;
  const firstMessage = messages?.[0] as AnyRecord | undefined;
  const messaging = Array.isArray(entry?.messaging) ? (entry?.messaging?.[0] as AnyRecord | undefined) : undefined;
  const directMessage = payload.message as AnyRecord | undefined;
  const textObject = firstMessage?.text as AnyRecord | undefined;
  const messagingMessage = messaging?.message as AnyRecord | undefined;

  return String(
    textObject?.body ||
      directMessage?.text ||
      payload.text ||
      messagingMessage?.text ||
      ""
  ).trim();
}

function getExternalAccountId(payload: AnyRecord): string | null {
  const entry = Array.isArray(payload.entry) ? (payload.entry[0] as AnyRecord | undefined) : undefined;
  const change = Array.isArray(entry?.changes) ? (entry?.changes?.[0] as AnyRecord | undefined) : undefined;
  const value = change?.value as AnyRecord | undefined;
  const metadata = value?.metadata as AnyRecord | undefined;
  return String(
    payload.phoneNumberId ||
      payload.pageId ||
      payload.accountId ||
      metadata?.phone_number_id ||
      entry?.id ||
      ""
  ) || null;
}

function getSenderId(payload: AnyRecord): string | null {
  const entry = Array.isArray(payload.entry) ? (payload.entry[0] as AnyRecord | undefined) : undefined;
  const change = Array.isArray(entry?.changes) ? (entry?.changes?.[0] as AnyRecord | undefined) : undefined;
  const value = change?.value as AnyRecord | undefined;
  const messages = Array.isArray(value?.messages) ? value?.messages : undefined;
  const firstMessage = messages?.[0] as AnyRecord | undefined;
  const messaging = Array.isArray(entry?.messaging) ? (entry?.messaging?.[0] as AnyRecord | undefined) : undefined;
  const sender = messaging?.sender as AnyRecord | undefined;

  return String(
    payload.senderId ||
      payload.from ||
      firstMessage?.from ||
      sender?.id ||
      ""
  ) || null;
}

function getExternalMessageId(payload: AnyRecord): string | null {
  const entry = Array.isArray(payload.entry) ? (payload.entry[0] as AnyRecord | undefined) : undefined;
  const change = Array.isArray(entry?.changes) ? (entry?.changes?.[0] as AnyRecord | undefined) : undefined;
  const value = change?.value as AnyRecord | undefined;
  const messages = Array.isArray(value?.messages) ? value?.messages : undefined;
  const firstMessage = messages?.[0] as AnyRecord | undefined;
  const messaging = Array.isArray(entry?.messaging) ? (entry?.messaging?.[0] as AnyRecord | undefined) : undefined;
  const message = messaging?.message as AnyRecord | undefined;

  return String(payload.messageId || firstMessage?.id || message?.mid || "") || null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.FACEBOOK_VERIFY_TOKEN;
  if (!expected) return NextResponse.json({ error: "Webhook verify token is not configured." }, { status: 503 });
  if (mode === "subscribe" && token === expected) return new NextResponse(challenge || "", { status: 200 });
  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as AnyRecord;
    const text = getNestedText(payload);
    if (!text) return NextResponse.json({ received: true, ignored: "No text message found" });

    const externalAccountId = getExternalAccountId(payload);
    const workspaceId = await resolveWorkspaceIdForWebhook(CHANNEL, String(payload.workspaceId || (payload.metadata as AnyRecord | undefined)?.workspaceId || "") || null, externalAccountId);
    const senderId = getSenderId(payload);
    if (!senderId) return NextResponse.json({ received: true, ignored: "No sender ID found" }, { status: 202 });

    const result = await handleIncomingChannelMessage({
      workspaceId,
      channel: CHANNEL,
      saveAgentReply: false,
      externalConversationId: senderId,
      externalMessageId: getExternalMessageId(payload) || crypto.randomUUID(),
      senderName: typeof payload.senderName === "string" ? payload.senderName : null,
      senderEmail: typeof payload.senderEmail === "string" ? payload.senderEmail : null,
      senderPhone: isWhatsAppChannel() ? senderId : null,
      messageText: text,
      rawPayload: payload,
    });

    const delivery = await sendChannelReply({
      workspaceId,
      channel: CHANNEL,
      recipientId: senderId,
      recipientPhone: isWhatsAppChannel() ? senderId : null,
      reply: result.reply,
    });

    if (delivery.status === "sent") {
      await recordAgentReply(result.conversationId, result.reply, { delivery });
    }

    return NextResponse.json({ received: true, ...result, replySaved: delivery.status === "sent", delivery });
  } catch (error) {
    console.error(CHANNEL + " webhook failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed" }, { status: 500 });
  }
}
