import { NextRequest, NextResponse } from "next/server";
import { cleanText, getClientIp, rateLimit } from "@/lib/security";

function normalizeModel(model: string) {
  if (!model) return "models/gemini-2.5-flash";
  return model.startsWith("models/") ? model : `models/${model}`;
}

function isBrokenReply(reply: string) {
  const text = reply.trim();
  if (!text || text.length < 85) return true;
  if (/great choice!?\s*you['’]?ve?\s*$/i.test(text)) return true;
  if (/you['’]?ve\s*$/i.test(text)) return true;
  if (!/[.!?]$/.test(text)) return true;
  return false;
}

function fallbackReply(args: { optionTitle: string; savedAnswer: string; businessName: string; mainOption: string }) {
  const title = args.optionTitle || "this option";
  const parent = args.mainOption && args.mainOption !== title ? args.mainOption : "this service";
  const base = args.savedAnswer || "The team will review your requirement and recommend the best next step.";

  if (/other|custom/i.test(title)) {
    return `Thanks. This is a custom request under ${parent}. Share the exact details below, then choose a suitable time so the ${args.businessName} team can review it with you and confirm the best solution.`;
  }

  return `${title} is a good fit for this request. ${base} Share a few details about what you need, then choose a suitable time so the ${args.businessName} team can guide you properly.`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = rateLimit(`public-assistant:${ip}`, 18, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const businessName = cleanText(body.businessName, 120) || "the business";
  const mainOption = cleanText(body.mainOption, 180);
  const optionTitle = cleanText(body.selectedOption || body.optionTitle, 180);
  const savedAnswer = cleanText(body.savedAnswer || body.answer, 1800);
  const prospectQuestion = cleanText(body.question || body.message, 800);
  const serviceName = cleanText(body.serviceName, 180) || optionTitle;

  if (!optionTitle && !savedAnswer && !prospectQuestion) {
    return NextResponse.json({ error: "Missing selected option." }, { status: 400 });
  }

  const fallback = fallbackReply({ optionTitle, savedAnswer, businessName, mainOption });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ reply: fallback, setupRequired: true });

  const prompt = `You are the public booking assistant for ${businessName}.

The prospect is inside this option flow:
Main option/category: ${mainOption || optionTitle}
Final selected option: ${optionTitle}
Related service: ${serviceName}
Owner saved answer: ${savedAnswer}
Prospect context: ${prospectQuestion}

Write a complete clean business response for the prospect.

Rules:
- Use only the main option, selected option, and owner saved answer.
- Never show raw labels like "Service:" or "Price:".
- Never copy database-style bullet text directly.
- Never say "AI is thinking".
- Never invent prices, discounts, guarantees, or features.
- If the final selected option is Other/Custom, keep the response connected to the main option/category.
- Keep the response short, confident, and helpful.
- End by asking them to share a few details or continue booking.
- Return only the final response text.`;

  try {
    const model = normalizeModel(process.env.GEMINI_MODEL || "models/gemini-2.5-flash");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.32, maxOutputTokens: 230 },
      }),
    });

    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join(" ").trim() || "";

    return NextResponse.json({ reply: isBrokenReply(reply) ? fallback : reply, aiFallback: isBrokenReply(reply) || undefined });
  } catch (error) {
    console.error("Gemini option reply failed:", error);
    return NextResponse.json({ reply: fallback, aiFallback: true });
  }
}
