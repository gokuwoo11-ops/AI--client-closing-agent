type AnyRecord = Record<string, any>;

export type LeadQualificationInput = {
  lead: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    serviceNeeded?: string | null;
    budget?: string | null;
    timeline?: string | null;
    message?: string | null;
  };
  agentConfig?: AnyRecord | null;
  businessProfile?: AnyRecord | null;
};

export type LeadQualificationResult = {
  reply: string;
  summary: string;
  nextAction: string;
  score: number;
  mode: "gemini" | "setup_required";
};

function setupRequired(input: LeadQualificationInput): LeadQualificationResult {
  const lead = input.lead;
  const message = lead.message || lead.serviceNeeded || "New inquiry";

  return {
    reply: "",
    summary: `AI is not configured yet. Incoming inquiry: ${message.slice(0, 220)}`,
    nextAction:
      "Configure GEMINI_API_KEY and GEMINI_MODEL to generate AI replies, summaries, and lead scores.",
    score: lead.email || lead.phone ? 35 : 20,
    mode: "setup_required",
  };
}

function extractJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue to object extraction
  }

  const match = cleaned.match(/\{[\s\S]*\}/);

  if (match) {
    return JSON.parse(match[0]);
  }

  throw new Error("Gemini did not return valid JSON");
}

function normalizeGeminiModel(model?: string) {
  const fallback = "models/gemini-2.5-flash";
  const selected = model?.trim() || fallback;

  return selected.startsWith("models/") ? selected : `models/${selected}`;
}

export async function generateLeadQualification(
  input: LeadQualificationInput
): Promise<LeadQualificationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return setupRequired(input);
  }

  try {
    const lead = input.lead;

    const model = normalizeGeminiModel(process.env.GEMINI_MODEL);

    const businessName = input.businessProfile?.name || "the business";
    const niche = input.businessProfile?.niche || "service business";
    const tone = input.agentConfig?.tone || "professional";
    const customInstructions = input.agentConfig?.customInstructions || "";
    const fallbackMessage = input.agentConfig?.fallbackMessage || "";
    const handoffRules = input.agentConfig?.handoffRules || "";
    const bookingLink =
      input.agentConfig?.bookingLink || input.businessProfile?.bookingLink || "";

    const services = Array.isArray(input.businessProfile?.services)
      ? input.businessProfile.services
          .map((s: AnyRecord) =>
            `${s.name || "Service"}: ${s.description || ""} ${s.price || ""}`.trim()
          )
          .join("\n")
      : "";

    const faqs = Array.isArray(input.businessProfile?.faqs)
      ? input.businessProfile.faqs
          .map((f: AnyRecord) => `Q: ${f.question}\nA: ${f.answer}`)
          .join("\n\n")
      : "";

    const prompt = `
You are an AI client closing assistant for ${businessName}, a ${niche}.

Your job:
- Reply to the lead in a helpful sales-assistant style.
- Qualify the lead.
- Summarize the opportunity for the business owner.
- Suggest the next best action.
- Score the lead from 0 to 100.

Business details:
Business name: ${businessName}
Business niche: ${niche}
Tone: ${tone}
Booking link: ${bookingLink || "Not configured"}

Business services:
${services || "No services configured yet."}

Business FAQs:
${faqs || "No FAQs configured yet."}

Custom instructions:
${customInstructions || "No custom instructions configured."}

Fallback message:
${fallbackMessage || "If unsure, politely suggest that a human team member will follow up."}

Handoff rules:
${handoffRules || "Hand off to a human when the lead asks for unclear pricing, custom scope, complaints, or urgent support."}

Lead details:
Name: ${lead.name || "Unknown"}
Email: ${lead.email || "Unknown"}
Phone: ${lead.phone || "Unknown"}
Service needed: ${lead.serviceNeeded || "Unknown"}
Budget: ${lead.budget || "Unknown"}
Timeline: ${lead.timeline || "Unknown"}
Message: ${lead.message || ""}

Rules:
- Return ONLY strict JSON.
- Do not include markdown.
- Do not include explanations outside JSON.
- Do not invent prices, guarantees, discounts, policies, or services.
- If services/FAQs are not configured, keep the reply helpful but general.
- Ask 1 or 2 useful qualification questions if needed.
- Include the booking link only if it is configured.
- Score must be a number from 0 to 100.
- reply must be short, human-like, and useful.
- summary must be for the business owner, not the lead.
- nextAction must tell the owner what to do next.

Return this exact JSON shape:
{
  "reply": "string",
  "summary": "string",
  "nextAction": "string",
  "score": 50
}
`.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini request failed: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p: AnyRecord) => p.text)
        .filter(Boolean)
        .join("\n") || "{}";

    const parsed = extractJson(text);

    const fallback = setupRequired(input);

    return {
      reply: String(parsed.reply || ""),
      summary: String(parsed.summary || fallback.summary),
      nextAction: String(parsed.nextAction || fallback.nextAction),
      score: Math.max(0, Math.min(100, Number(parsed.score || 50))),
      mode: "gemini",
    };
  } catch (error) {
    console.warn("Gemini generation failed:", error);
    return setupRequired(input);
  }
}