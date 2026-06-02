import { NextRequest, NextResponse } from "next/server";
import { formatSlot, sendEmail } from "@/lib/email";
import { cleanText, getClientIp, rateLimit } from "@/lib/security";
import { assertWorkspaceExists, hasDatabase, requireWorkspaceId } from "@/lib/workspace";
import { sendPushToWorkspaceOwners } from "@/lib/push-alerts";

export const runtime = "nodejs";

function clean(value: unknown, max = 900) {
  const text = cleanText(value, max);
  return text || null;
}

function safeSummary(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join("\n").slice(0, 1400);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limited = rateLimit(`public-booking:${ip}`, 10, 60_000);
    if (!limited.ok) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });

    if (!hasDatabase()) return NextResponse.json({ error: "Booking is not available right now." }, { status: 503 });

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Honeypot field. Real users never fill it.
    if (body.website) return NextResponse.json({ success: true });

    const workspaceId = requireWorkspaceId(clean(body.workspaceId, 140));
    await assertWorkspaceExists(workspaceId);

    const name = clean(body.name, 100) || "New Prospect";
    const email = clean(body.email, 140);
    const phone = clean(body.phone, 50);
    const intent = clean(body.intent, 40) || "booking";
    const mainOption = clean(body.mainOptionTitle || body.mainOption, 180);
    const subOption = clean(body.subOptionTitle || body.selectedOptionTitle || body.selectedOption || body.optionTitle, 180);
    const serviceNeeded = clean(body.serviceNeeded || subOption || mainOption, 180) || "General enquiry";
    const preferredTime = clean(body.preferredTime, 180);
    const message = clean(body.message || body.requirements || body.requirement || body.details, 1200) || "New funnel request";
    const slotId = clean(body.slotId, 140);
    const customRequest = clean(body.customRequest, 1200);
    const optionPath = Array.isArray(body.optionPath)
      ? body.optionPath.map((item) => clean(item, 120)).filter(Boolean).join(" → ")
      : clean(body.optionPath, 500);

    if (!email && !phone) return NextResponse.json({ error: "Email or phone is required so the business can follow up." }, { status: 400 });
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    const { db } = await import("@/lib/db");
    const client = db as any;

    const selectedSlot = slotId ? await client.bookingSlot.findFirst({ where: { id: slotId, workspaceId, isActive: true } }) : null;
    if (slotId && !selectedSlot) return NextResponse.json({ error: "That booking slot is no longer available. Please choose another time." }, { status: 409 });

    if (selectedSlot) {
      const alreadyBooked = await client.appointment.count({ where: { bookingSlotId: selectedSlot.id, status: { in: ["BOOKED", "REQUESTED"] } } });
      if (alreadyBooked >= selectedSlot.capacity) {
        await client.bookingSlot.update({ where: { id: selectedSlot.id }, data: { isActive: false } });
        return NextResponse.json({ error: "That booking slot was just taken. Please choose another time." }, { status: 409 });
      }
    }

    const workspace = await client.workspace.findUnique({
      where: { id: workspaceId },
      include: { businessProfile: true, agentConfig: true, members: { include: { user: true }, orderBy: { createdAt: "asc" }, take: 1 } },
    });

    const agentConfig = workspace?.agentConfig || await client.agentConfig.upsert({ where: { workspaceId }, update: {}, create: { workspaceId, name: "Booking Assistant", tone: "professional" } });
    const slotText = selectedSlot ? formatSlot(selectedSlot) : preferredTime || "Team will confirm";
    const hasSlot = Boolean(selectedSlot);
    const status = hasSlot ? "BOOKED" : intent === "enquiry" ? "QUALIFIED" : "BOOKING_SENT";
    const requestSummary = safeSummary([
      `Intent: ${intent}`,
      mainOption ? `Main option: ${mainOption}` : null,
      subOption ? `Selected option: ${subOption}` : null,
      optionPath ? `Option path: ${optionPath}` : null,
      customRequest ? `Custom request: ${customRequest}` : null,
      `Service: ${serviceNeeded}`,
      `Selected/preferred time: ${slotText}`,
      `Requirement: ${message}`,
    ]);

    const lead = await client.lead.create({
      data: {
        workspaceId,
        name,
        email: email || null,
        phone: phone || null,
        source: hasSlot ? "booking_funnel" : "enquiry_funnel",
        status,
        score: hasSlot ? 90 : 70,
        requirements: requestSummary,
        timeline: preferredTime || slotText,
        summary: hasSlot ? `${name} booked ${serviceNeeded} for ${slotText}.` : `${name} submitted ${intent} for ${serviceNeeded}.`,
        nextAction: hasSlot ? `Prepare for appointment: ${slotText}.` : "Review the request and guide the prospect toward a suitable time.",
        notes: optionPath || null,
      },
    });

    const conversation = await client.conversation.create({ data: { leadId: lead.id, agentConfigId: agentConfig.id, channel: "public_booking_funnel", summary: lead.summary, nextAction: lead.nextAction } });
    await client.message.create({ data: { conversationId: conversation.id, senderType: "LEAD", content: requestSummary, channelMetadata: { source: "public-nested-option-funnel", body: { ...body, workspaceId } } } });

    const appointment = await client.appointment.create({
      data: {
        workspaceId,
        leadId: lead.id,
        bookingSlotId: selectedSlot?.id || null,
        status: selectedSlot ? "BOOKED" : "REQUESTED",
        serviceName: serviceNeeded,
        requestedTime: preferredTime || null,
        scheduledStart: selectedSlot?.startsAt || null,
        scheduledEnd: selectedSlot?.endsAt || null,
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        notes: requestSummary,
      },
    });

    if (selectedSlot) {
      const bookedCount = await client.appointment.count({ where: { bookingSlotId: selectedSlot.id, status: { in: ["BOOKED", "REQUESTED"] } } });
      if (bookedCount >= selectedSlot.capacity) await client.bookingSlot.update({ where: { id: selectedSlot.id }, data: { isActive: false } });
    }

    const ownerUserId = workspace?.members?.[0]?.user?.id || null;
    if (ownerUserId) {
      await client.notification.create({ data: { workspaceId, userId: ownerUserId, title: hasSlot ? "New appointment booked" : "New enquiry received", message: lead.summary || requestSummary, link: `/leads/${lead.id}` } }).catch(() => null);
    }
await sendPushToWorkspaceOwners({
  workspaceId,
  title: hasSlot ? "New appointment booked" : "New enquiry received",
  body:
    lead.summary ||
    `${name} submitted a new ${intent || "request"} for ${
      serviceNeeded || "your service"
    }.`,
  url: `/leads/${lead.id}`,
}).catch((error) => {
  console.error("Browser push notification failed:", error);
});
    const businessName = workspace?.businessProfile?.name || workspace?.name || "the business";
    const ownerEmail = workspace?.businessProfile?.contactEmail || workspace?.members?.[0]?.user?.email || null;
    const ownerEmailResult = await sendEmail({
      to: ownerEmail,
      subject: hasSlot ? `New booked appointment: ${businessName}` : `New enquiry: ${businessName}`,
      text: [hasSlot ? "New appointment booked from the public funnel." : "New enquiry submitted from the public funnel.", "", `Business: ${businessName}`, `Lead: ${name}`, `Email: ${email || "Not provided"}`, `Phone: ${phone || "Not provided"}`, mainOption ? `Main option: ${mainOption}` : null, subOption ? `Selected option: ${subOption}` : null, `Service: ${serviceNeeded}`, `Slot/time: ${slotText}`, `Requirement: ${message}`, "", `Open lead: /leads/${lead.id}`].filter(Boolean).join("\n"),
    });
    const leadEmailResult = await sendEmail({
      to: email,
      subject: hasSlot ? `Your booking with ${businessName} is confirmed` : `We received your request for ${businessName}`,
      text: hasSlot ? [`Hi ${name},`, "", `Your booking with ${businessName} has been received.`, `Selected option: ${subOption || serviceNeeded}`, `Scheduled time: ${slotText}`, "", "The team will connect with you at the scheduled time.", "", businessName].join("\n") : [`Hi ${name},`, "", `Thanks for reaching out to ${businessName}.`, `Selected option: ${subOption || serviceNeeded}`, "The team received your request and will follow up if anything else is needed.", "", businessName].join("\n"),
    });

    return NextResponse.json({ success: true, leadId: lead.id, conversationId: conversation.id, appointment, notifications: { ownerEmail: ownerEmailResult, leadEmail: leadEmailResult } });
  } catch (error) {
    console.error("Public booking failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to submit booking request." }, { status: 500 });
  }
}

