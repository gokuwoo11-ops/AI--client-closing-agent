type DeliveryStatus = "sent" | "setup_required" | "failed" | "skipped";

type DeliveryResult = {
  status: DeliveryStatus;
  provider: string;
  externalMessageId?: string;
  details?: string;
  raw?: unknown;
};

type ProviderConfig = Record<string, unknown> | null | undefined;

type SendChannelReplyInput = {
  workspaceId: string;
  channel: string;
  recipientId?: string | null;
  recipientPhone?: string | null;
  reply: string;
};

function getString(config: ProviderConfig, ...keys: string[]) {
  for (const key of keys) {
    const value = config?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function graphVersion() {
  return (process.env.META_GRAPH_API_VERSION || "v20.0").replace(/^\//, "");
}

async function loadProviderConfig(workspaceId: string, provider: string): Promise<ProviderConfig> {
  const { db } = await import("@/lib/db");
  const integration = await (db as any).integration.findUnique({
    where: { workspaceId_provider: { workspaceId, provider } },
    select: { config: true, isActive: true },
  });
  if (!integration?.isActive) return null;
  return integration.config as ProviderConfig;
}

async function postJson(url: string, body: Record<string, unknown>, accessToken: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      body: parsed,
    };
  }

  return {
    ok: true,
    status: response.status,
    body: parsed,
  };
}

async function sendWhatsAppReply(input: SendChannelReplyInput, config: ProviderConfig): Promise<DeliveryResult> {
  const accessToken = getString(config, "accessToken", "whatsappAccessToken") || process.env.WHATSAPP_ACCESS_TOKEN || "";
  const phoneNumberId = getString(config, "phoneNumberId", "whatsappPhoneNumberId") || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const to = input.recipientPhone || input.recipientId || "";

  if (!accessToken || !phoneNumberId || !to) {
    return {
      status: "setup_required",
      provider: "whatsapp",
      details: "WhatsApp reply not sent. Configure a real access token, phone number ID, and recipient phone number.",
    };
  }

  const url = `https://graph.facebook.com/${graphVersion()}/${encodeURIComponent(phoneNumberId)}/messages`;
  const result = await postJson(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: input.reply },
    },
    accessToken
  );

  if (!result.ok) {
    return { status: "failed", provider: "whatsapp", details: `WhatsApp API failed with status ${result.status}.`, raw: result.body };
  }

  const body = result.body as { messages?: Array<{ id?: string }> } | null;
  return { status: "sent", provider: "whatsapp", externalMessageId: body?.messages?.[0]?.id, raw: result.body };
}

async function sendMessengerReply(input: SendChannelReplyInput, config: ProviderConfig, provider: "facebook" | "instagram"): Promise<DeliveryResult> {
  const accessToken =
    getString(config, "accessToken", "pageAccessToken") ||
    (provider === "instagram" ? process.env.INSTAGRAM_ACCESS_TOKEN : process.env.FACEBOOK_PAGE_ACCESS_TOKEN) ||
    "";
  const recipientId = input.recipientId || "";

  if (!accessToken || !recipientId) {
    return {
      status: "setup_required",
      provider,
      details: `${provider} reply not sent. Configure a real page access token and recipient ID.`,
    };
  }

  const url = `https://graph.facebook.com/${graphVersion()}/me/messages`;
  const result = await postJson(
    url,
    {
      recipient: { id: recipientId },
      message: { text: input.reply },
    },
    accessToken
  );

  if (!result.ok) {
    return { status: "failed", provider, details: `${provider} API failed with status ${result.status}.`, raw: result.body };
  }

  const body = result.body as { message_id?: string } | null;
  return { status: "sent", provider, externalMessageId: body?.message_id, raw: result.body };
}

export async function sendChannelReply(input: SendChannelReplyInput): Promise<DeliveryResult> {
  const reply = String(input.reply || "").trim();
  if (!reply) return { status: "skipped", provider: input.channel, details: "No AI reply was generated." };

  const channel = String(input.channel || "").toLowerCase();
  const config = await loadProviderConfig(input.workspaceId, channel);

  if (channel === "whatsapp") return sendWhatsAppReply(input, config);
  if (channel === "facebook") return sendMessengerReply(input, config, "facebook");
  if (channel === "instagram") return sendMessengerReply(input, config, "instagram");

  return { status: "setup_required", provider: channel, details: `No real sender is configured for ${channel}.` };
}
