import { NextRequest, NextResponse } from "next/server";
import { cleanText, getClientIp, rateLimit } from "@/lib/security";

function fallbackReply(
  optionTitle: string,
  savedAnswer: string,
  businessName: string
) {
  const title = optionTitle || "this option";

  if (
    title.toLowerCase().includes("other") ||
    title.toLowerCase().includes("custom")
  ) {
    return `Thanks, we can check this with the ${businessName} team. Tell us what you need help with, then choose a suitable time so we can understand your requirement and confirm the best solution.`;
  }

  const base =
    savedAnswer ||
    "The team will review your requirement and recommend the best next step.";

  return `${title} is a good choice. ${base} Tell us a little more about what you need so we can recommend the best available time.`;
}

function normalizeModel(model: string) {
  if (!model) return "models/gemini-2.5-flash";
  return model.startsWith("models/") ? model : `models/${model}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limited = rateLimit(`public-assistant:${ip}`, 18, 60_000);

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown> = {};

  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const businessName = cleanText(body.businessName, 120) || "the business";
  const optionTitle = cleanText(
    body.selectedOption || body.optionTitle,
    160
  );
  const savedAnswer = cleanText(body.savedAnswer || body.answer, 1600);
  const prospectQuestion = cleanText(body.question || body.message, 700);
  const serviceName = cleanText(body.serviceName, 160) || optionTitle;

  if (!optionTitle && !savedAnswer && !prospectQuestion) {
    return NextResponse.json(
      { error: "Missing selected option." },
      { status: 400 }
    );
  }

  const fallback = fallbackReply(optionTitle, savedAnswer, businessName);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      reply: fallback,
      setupRequired: true,
    });
  }

  const prompt = `You are the public booking assistant for ${businessName}.

A prospect selected this option:
Option title: ${optionTitle}
Related service: ${serviceName}
Saved owner answer: ${savedAnswer}
Prospect context: ${prospectQuestion}

Write a clean business response for the prospect.

Rules:
- Do not show raw field labels like "Service:" or "Price:".
- Do not copy database-style bullet text directly.
- Do not say "AI is thinking".
- Do not invent prices, discounts, guarantees, or features.
- Use only the selected option and saved owner answer.
- Keep it short, confident, and helpful.
- If the option is Other or Custom, tell them we can check it with the team and guide them to share details and choose a slot.
- End by asking them to share a few details or continue booking.

Return only the response text.`;

  try {
    const model = normalizeModel(
      process.env.GEMINI_MODEL || "models/gemini-2.5-flash"
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 220,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join(" ")
      .trim();

    return NextResponse.json({
      reply: reply || fallback,
    });
  } catch (error) {
    console.error("Gemini option reply failed:", error);

    return NextResponse.json({
      reply: fallback,
      aiFallback: true,
    });
  }
}