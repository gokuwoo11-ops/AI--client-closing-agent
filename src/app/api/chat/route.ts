import { NextRequest, NextResponse } from "next/server";
import { hasDatabase } from "@/lib/workspace";

export const runtime = "nodejs";

type AnyRecord = Record<string, any>;

function extractText(data: AnyRecord) {
  return data.candidates?.[0]?.content?.parts?.map((p: AnyRecord) => p.text).join("\n") || "";
}

async function loadWorkspaceContext(workspaceId?: string | null) {
  if (!workspaceId || !hasDatabase()) return {};

  const { db } = await import("@/lib/db");
  const workspace = await (db as any).workspace.findUnique({
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
    const body = await req.json();
    const { messages, workspaceId } = body;
    let { agentConfig, businessProfile } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const loaded = await loadWorkspaceContext(workspaceId);
    agentConfig = agentConfig || loaded.agentConfig;
    businessProfile = businessProfile || loaded.businessProfile;

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
    const servicesText = businessProfile?.services?.length
      ? businessProfile.services
          .map((s: { name: string; price?: string; description?: string; duration?: string }) =>
            `- ${s.name}${s.price ? ` (${s.price})` : ""}${s.duration ? `, ${s.duration}` : ""}: ${s.description || ""}`
          )
          .join("\n")
      : "Services information is not configured yet.";
    const faqsText = businessProfile?.faqs?.length
      ? businessProfile.faqs.map((f: { question: string; answer: string }) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
      : "";
    const history = messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join("\n");

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
