import { NextRequest, NextResponse } from "next/server";
import { hasDatabase } from "@/lib/workspace";
import { cleanText, getClientIp, rateLimit } from "@/lib/security";

export const runtime = "nodejs";

type AnyRecord = Record<string, unknown>;
type ChatMessage = { role: string; content: string };

function extractText(data: AnyRecord) {
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  const first = candidates[0] as AnyRecord | undefined;
  const content = first?.content as AnyRecord | undefined;
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  return parts
    .map((part) => (part && typeof part === "object" ? (part as AnyRecord).text : ""))
    .filter((text): text is string => typeof text === "string" && Boolean(text.trim()))
    .join("\n");
}

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function cleanMessage(value: unknown): ChatMessage | null {
  const record = asRecord(value);
  if (!record) return null;
  const role = cleanText(record.role, 20);
  const content = cleanText(record.content, 900);
  if (!content) return null;
  return { role: role === "assistant" ? "assistant" : "user", content };
}

async function loadWorkspaceContext(workspaceId?: string | null) {
  if (!workspaceId || !hasDatabase()) return {};

  const { db } = await import("@/lib/db");
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      businessProfile: { include: { services: true, faqs: true } },
      agentConfig: true,
    },
  });

  return {
    businessProfile: workspace?.businessProfile || null,
    agentConfig: workspace?.agentConfig || null,
  };
}

function normalizeGeminiModel(model?: string) {
  const fallback = "models/gemini-2.5-flash";
  const selected = model?.trim() || fallback;
  return selected.startsWith("models/") ? selected : `models/${selected}`;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limited = rateLimit(`chat:${ip}`, 20, 60_000);
    if (!limited.ok) return NextResponse.json({ error: "Too many chat requests. Please try again later." }, { status: 429 });

    let body: AnyRecord = {};
    try {
      body = (await req.json()) as AnyRecord;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const workspaceId = cleanText(body.workspaceId, 140);
    const messages = Array.isArray(body.messages) ? body.messages.map(cleanMessage).filter(Boolean) as ChatMessage[] : [];
    let agentConfig = asRecord(body.agentConfig);
    let businessProfile = asRecord(body.businessProfile);

    if (!messages.length) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const loaded = await loadWorkspaceContext(workspaceId);
    agentConfig = agentConfig || asRecord(loaded.agentConfig);
    businessProfile = businessProfile || asRecord(loaded.businessProfile);

    const apiKey = process.env.GEMINI_API_KEY;
    const model = normalizeGeminiModel(process.env.GEMINI_MODEL);

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini is not configured. Add GEMINI_API_KEY to enable AI chat." },
        { status: 503 }
      );
    }

    const agentName = agentConfig?.name || "AI Booking Assistant";
    const tone = agentConfig?.tone || "professional";
    const bookingLink = agentConfig?.bookingLink || businessProfile?.bookingLink || "";
    const customInstructions = agentConfig?.customInstructions || "";
    const fallbackMessage =
      agentConfig?.fallbackMessage ||
      "I'm not certain about that — please share your phone or email and our team will follow up.";
    const services = Array.isArray(businessProfile?.services) ? businessProfile.services : [];
    const faqs = Array.isArray(businessProfile?.faqs) ? businessProfile.faqs : [];
    const servicesText = services.length
      ? services
          .map((item) => {
            const service = asRecord(item) || {};
            const name = cleanText(service.name, 120) || "Service";
            const price = cleanText(service.price, 80);
            const duration = cleanText(service.duration, 80);
            const description = cleanText(service.description, 240);
            return `- ${name}${price ? ` (${price})` : ""}${duration ? `, ${duration}` : ""}: ${description}`;
          })
          .join("\n")
      : "Services information is not configured yet.";
    const faqsText = faqs.length
      ? faqs
          .map((item) => {
            const faq = asRecord(item) || {};
            return `Q: ${cleanText(faq.question, 220)}\nA: ${cleanText(faq.answer, 500)}`;
          })
          .join("\n\n")
      : "";
    const history = messages.slice(-12).map((m) => `${m.role}: ${m.content}`).join("\n");

    const prompt = `You are ${agentName}, a ${tone} AI booking assistant for ${businessProfile?.name || "this business"}.

PRIMARY JOB:
- Reply instantly.
- Qualify the prospect.
- Ask for service, date/time preference, name, phone, and email if missing.
- Push politely toward booking a slot.
- Do not pretend a booking is confirmed unless the system already shows an actual slot or booking link.

BUSINESS INFORMATION:
- Business: ${businessProfile?.name || "Not configured"}
- Niche: ${businessProfile?.niche || "Service Business"}
- Location: ${businessProfile?.location || "Not configured"}
- Working hours: ${businessProfile?.workingHours || "Not configured"}

SERVICES OFFERED:
${servicesText}

${faqsText ? `FREQUENTLY ASKED QUESTIONS:\n${faqsText}` : ""}

BOOKING LINK: ${bookingLink || "Not configured"}

RULES:
- Be ${tone}, concise, and helpful.
- Ask one question at a time when possible.
- Never invent prices, guarantees, discounts, services, policies, or available slots.
- If a booking link exists, use it when the prospect seems ready.
- If asked something outside configured knowledge, say: "${fallbackMessage}"
${customInstructions ? `\nADDITIONAL RULES:\n${customInstructions}` : ""}

Conversation so far:
${history}

Reply with the next best message only.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.45, maxOutputTokens: 260 },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: `Gemini request failed: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const reply = extractText(data).trim();
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Chat failed" }, { status: 500 });
  }
}
