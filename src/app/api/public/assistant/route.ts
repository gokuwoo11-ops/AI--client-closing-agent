import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, requireWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

type AnyRecord = Record<string, any>;

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type FormState = {
  name?: string;
  email?: string;
  phone?: string;
  serviceNeeded?: string;
  message?: string;
  preferredTime?: string;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function compact(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI did not return valid JSON");
  }
}

function normalizeGeminiModel(model?: string) {
  const fallback = "models/gemini-2.5-flash";
  const selected = model?.trim() || fallback;
  return selected.startsWith("models/") ? selected : `models/${selected}`;
}

function serviceLine(service: AnyRecord) {
  const details = [
    service.description,
    service.price ? `Price: ${service.price}` : null,
    service.duration ? `Duration: ${service.duration}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  return details ? `${service.name}: ${details}` : service.name;
}

function serviceMatches(text: string, service: AnyRecord) {
  const value = compact(text);
  const name = compact(service.name || "");
  if (!name) return false;
  if (value.includes(name)) return true;
  return name
    .split(" ")
    .filter((part) => part.length >= 4)
    .some((part) => value.includes(part));
}

function faqMatches(text: string, faq: AnyRecord) {
  const value = compact(text);
  const question = compact(faq.question || "");
  if (!value || !question) return false;
  if (value.includes(question) || question.includes(value)) return true;
  const terms = question.split(" ").filter((term) => term.length >= 4);
  if (terms.length === 0) return false;
  const matches = terms.filter((term) => value.includes(term)).length;
  return matches >= Math.min(2, terms.length);
}

function extractContact(text: string) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.replace(/\s+/g, " ") || "";
  return { email, phone };
}

function nextMissingQuestion(form: FormState, businessName: string) {
  if (!form.serviceNeeded) return `What service do you need help with from ${businessName}?`;
  if (!form.message) return "Tell me a little more about what you need, your goal, or the issue you want solved.";
  if (!form.preferredTime) return "When would you prefer to book or get this done?";
  if (!form.name) return "What is your name?";
  if (!form.phone && !form.email) return "What phone or email should the team use to confirm your booking?";
  return "Great, you can choose an available booking time now.";
}

function deterministicAnswer(
  latestMessage: string,
  workspace: AnyRecord,
  currentForm: FormState,
) {
  const business = workspace.businessProfile || {};
  const businessName = business.name || workspace.name || "this business";
  const services: AnyRecord[] = business.services || [];
  const faqs: AnyRecord[] = business.faqs || [];
  const value = compact(latestMessage);
  const updatedFields: FormState = {};

  const matchedFaq = faqs.find((faq) => faqMatches(latestMessage, faq));
  if (matchedFaq) {
    return {
      reply: `${matchedFaq.answer}\n\n${nextMissingQuestion(currentForm, businessName)}`,
      updatedFields,
      readyToBook: false,
      leadQualified: false,
      needsHuman: false,
      unknownQuestion: false,
    };
  }

  const matchedService = services.find((service) => serviceMatches(latestMessage, service));
  if (matchedService) {
    updatedFields.serviceNeeded = matchedService.name;
    return {
      reply: `${serviceLine(matchedService)}\n\nTell me a little more about what you need so I can check the best available time.`,
      updatedFields,
      readyToBook: false,
      leadQualified: true,
      needsHuman: false,
      unknownQuestion: false,
    };
  }

  const asksServices = ["service", "services", "provide", "offer", "what do you do", "do you do"].some((term) => value.includes(term));
  if (asksServices) {
    const serviceText = services.length
      ? services.slice(0, 8).map((service) => `• ${serviceLine(service)}`).join("\n")
      : "The team has not added detailed services yet.";
    return {
      reply: `${businessName} can help with:\n${serviceText}\n\nWhich service do you need help with?`,
      updatedFields,
      readyToBook: false,
      leadQualified: false,
      needsHuman: false,
      unknownQuestion: false,
    };
  }

  const asksPrice = ["price", "pricing", "cost", "charge", "fee", "rate"].some((term) => value.includes(term));
  if (asksPrice) {
    const priced = services.filter((service) => service.price);
    const serviceText = priced.length
      ? priced.slice(0, 8).map((service) => `• ${service.name}: ${service.price}`).join("\n")
      : "The exact price depends on what you need.";
    return {
      reply: `${serviceText}\n\nWhich service are you interested in?`,
      updatedFields,
      readyToBook: false,
      leadQualified: false,
      needsHuman: !priced.length,
      unknownQuestion: !priced.length,
    };
  }

  if ((value.includes("where") || value.includes("location")) && business.location) {
    return {
      reply: `${businessName} is located at ${business.location}. ${nextMissingQuestion(currentForm, businessName)}`,
      updatedFields,
      readyToBook: false,
      leadQualified: false,
      needsHuman: false,
      unknownQuestion: false,
    };
  }

  if ((value.includes("hours") || value.includes("open") || value.includes("working")) && business.workingHours) {
    return {
      reply: `${businessName} is available during: ${business.workingHours}. ${nextMissingQuestion(currentForm, businessName)}`,
      updatedFields,
      readyToBook: false,
      leadQualified: false,
      needsHuman: false,
      unknownQuestion: false,
    };
  }

  const contact = extractContact(latestMessage);
  if (contact.email && !currentForm.email) updatedFields.email = contact.email;
  if (contact.phone && !currentForm.phone) updatedFields.phone = contact.phone;

  const merged = { ...currentForm, ...updatedFields };
  const readyToBook = Boolean(
    merged.serviceNeeded && merged.message && merged.preferredTime && merged.name && (merged.phone || merged.email),
  );

  return {
    reply: readyToBook
      ? "Thanks. I have the details needed. Please choose an available booking time below to confirm your request."
      : nextMissingQuestion(merged, businessName),
    updatedFields,
    readyToBook,
    leadQualified: Boolean(merged.serviceNeeded),
    needsHuman: false,
    unknownQuestion: false,
  };
}

function safeString(value: unknown) {
  const text = String(value || "").trim();
  return text || undefined;
}

async function recordKnowledgeGap(workspaceId: string, question: string, answerAttempt: string) {
  try {
    const { db } = await import("@/lib/db");
    const client = db as any;
    if (client.knowledgeGap?.create) {
      await client.knowledgeGap.create({
        data: { workspaceId, question: question.slice(0, 700), answerAttempt: answerAttempt.slice(0, 1200) },
      });
    }
  } catch (error) {
    console.warn("Could not record knowledge gap:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    }

    const body = await req.json();
    const workspaceId = requireWorkspaceId(body.workspaceId);
    const latestMessage = clean(body.message);
    const currentForm = (body.form || {}) as FormState;
    const conversation = Array.isArray(body.messages) ? (body.messages as ChatMessage[]).slice(-10) : [];

    if (!latestMessage) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const { db } = await import("@/lib/db");
    const client = db as any;
    const workspace = await client.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        businessProfile: { include: { services: true, faqs: true } },
        agentConfig: true,
        bookingSlots: {
          where: { isActive: true, startsAt: { gte: new Date() } },
          orderBy: { startsAt: "asc" },
          take: 12,
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
    }

    const business = workspace.businessProfile || {};
    const businessName = business.name || workspace.name || "this business";
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallback = deterministicAnswer(latestMessage, workspace, currentForm);
      return NextResponse.json({ success: true, mode: "setup_required", ...fallback });
    }

    const services = Array.isArray(business.services)
      ? business.services
          .map((s: AnyRecord) => `- ${s.name || "Service"}${s.description ? `: ${s.description}` : ""}${s.price ? ` | Price: ${s.price}` : ""}${s.duration ? ` | Duration: ${s.duration}` : ""}`)
          .join("\n")
      : "";

    const faqs = Array.isArray(business.faqs)
      ? business.faqs.map((f: AnyRecord) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")
      : "";

    const slots = Array.isArray(workspace.bookingSlots)
      ? workspace.bookingSlots.map((slot: AnyRecord) => `- ${slot.title}: ${new Date(slot.startsAt).toISOString()} to ${new Date(slot.endsAt).toISOString()}`).join("\n")
      : "";

    const prompt = `
You are the public booking assistant for ${businessName}.

Main mission:
1. Answer ANY question that is related to this business using the saved business knowledge below.
2. If the prospect asks a business question, answer it first.
3. After answering, smoothly ask the next missing qualification question.
4. Collect enough details before showing booking times.
5. Do not answer unrelated questions. Politely redirect to booking with this business.

Business profile:
Name: ${businessName}
Type/niche: ${business.niche || "Not configured"}
Location: ${business.location || "Not configured"}
Working hours: ${business.workingHours || "Not configured"}
Contact email: ${business.contactEmail || "Not configured"}
Contact phone: ${business.contactPhone || "Not configured"}
Target customer: ${business.targetCustomer || "Not configured"}
Services style: ${business.servicesStyle || "Not configured"}
Pricing style: ${business.pricingStyle || "Not configured"}
Website: ${business.websiteUrl || "Not configured"}

Services:
${services || "No services configured."}

FAQs:
${faqs || "No FAQs configured."}

Available booking slots for later use:
${slots || "No slots configured."}

Agent settings:
Tone: ${workspace.agentConfig?.tone || "professional"}
Custom instructions: ${workspace.agentConfig?.customInstructions || "Answer accurately from business knowledge, qualify the prospect, and guide to booking."}
Fallback message: ${workspace.agentConfig?.fallbackMessage || "I’ll confirm that with the team."}

Current collected fields:
serviceNeeded: ${currentForm.serviceNeeded || ""}
message/details: ${currentForm.message || ""}
preferredTime: ${currentForm.preferredTime || ""}
name: ${currentForm.name || ""}
phone: ${currentForm.phone || ""}
email: ${currentForm.email || ""}

Recent conversation:
${conversation.map((m) => `${m.role}: ${m.content}`).join("\n")}

Latest prospect message:
${latestMessage}

Qualification fields needed before booking times:
- serviceNeeded: what service or help they need
- message: their goal, problem, requirement, or context
- preferredTime: when they want it
- name
- phone or email

Rules:
- Return ONLY strict JSON. No markdown.
- Reply naturally like a real receptionist.
- Answer any business-related question: services, price, duration, location, hours, booking, policy, contact, process, requirements, availability, reschedule, cancellation, who it is for.
- Use ONLY the saved business knowledge above. Do not invent prices, discounts, guarantees, policies, services, or unavailable slots.
- If the answer is not in business knowledge, say you will confirm with the team, then continue qualification.
- Ask only ONE next question after answering.
- Do not show actual slots in the chat reply. Set readyToBook true when the required fields are collected, and the page will show slots.
- If the user gives multiple details in one message, extract them into updatedFields.
- If the user says yes/ok after a service was mentioned, keep the existing serviceNeeded.
- For unrelated questions, politely redirect to business booking and do not deeply answer.

Return this JSON shape exactly:
{
  "reply": "string",
  "updatedFields": {
    "serviceNeeded": "string or empty",
    "message": "string or empty",
    "preferredTime": "string or empty",
    "name": "string or empty",
    "phone": "string or empty",
    "email": "string or empty"
  },
  "leadQualified": true,
  "readyToBook": false,
  "needsHuman": false,
  "unknownQuestion": false,
  "missingFields": ["serviceNeeded"]
}
`.trim();

    try {
      const model = normalizeGeminiModel(process.env.GEMINI_MODEL);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.25, responseMimeType: "application/json" },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((p: AnyRecord) => p.text)
          .filter(Boolean)
          .join("\n") || "{}";
      const parsed = extractJson(text);
      const updatedFields = parsed.updatedFields || {};
      const merged = {
        ...currentForm,
        serviceNeeded: safeString(updatedFields.serviceNeeded) || currentForm.serviceNeeded,
        message: safeString(updatedFields.message) || currentForm.message,
        preferredTime: safeString(updatedFields.preferredTime) || currentForm.preferredTime,
        name: safeString(updatedFields.name) || currentForm.name,
        phone: safeString(updatedFields.phone) || currentForm.phone,
        email: safeString(updatedFields.email) || currentForm.email,
      };
      const readyToBook = Boolean(
        merged.serviceNeeded && merged.message && merged.preferredTime && merged.name && (merged.phone || merged.email),
      );
      const finalReply = String(parsed.reply || nextMissingQuestion(merged, businessName));

      if (parsed.unknownQuestion || parsed.needsHuman) {
        await recordKnowledgeGap(workspaceId, latestMessage, finalReply);
      }

      return NextResponse.json({
        success: true,
        mode: "gemini",
        reply: finalReply,
        updatedFields: merged,
        leadQualified: Boolean(parsed.leadQualified ?? merged.serviceNeeded),
        readyToBook,
        needsHuman: Boolean(parsed.needsHuman),
        unknownQuestion: Boolean(parsed.unknownQuestion),
        missingFields: parsed.missingFields || [],
      });
    } catch (error) {
      console.warn("Public assistant Gemini failed:", error);
      const fallback = deterministicAnswer(latestMessage, workspace, currentForm);
      return NextResponse.json({ success: true, mode: "fallback", ...fallback });
    }
  } catch (error) {
    console.error("Public assistant failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not answer this message." },
      { status: 500 },
    );
  }
}
