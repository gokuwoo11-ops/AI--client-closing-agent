import { NextRequest, NextResponse } from "next/server";
import { formatSlot, sendEmail } from "@/lib/email";
import { assertWorkspaceExists, hasDatabase, requireWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

function clean(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function safeSummary(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join("\n").slice(0, 900);
}

export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    }

    const body = await req.json();
    const workspaceId = requireWorkspaceId(body.workspaceId);
    await assertWorkspaceExists(workspaceId);

    const name = clean(body.name) || "New Prospect";
    const email = clean(body.email);
    const phone = clean(body.phone);
    const serviceNeeded = clean(body.serviceNeeded || body.serviceName) || "General enquiry";
    const preferredTime = clean(body.preferredTime);
    const message = clean(body.message || body.requirements) || "New funnel request";
    const slotId = clean(body.slotId);

    if (!email && !phone) {
      return NextResponse.json({ error: "Email or phone is required so the business can follow up." }, { status: 400 });
    }

    const { db } = await import("@/lib/db");
    const client = db as any;

    const selectedSlot = slotId
      ? await client.bookingSlot.findFirst({ where: { id: slotId, workspaceId, isActive: true } })
      : null;

    if (slotId && !selectedSlot) {
      return NextResponse.json({ error: "That booking slot is no longer available. Please choose another time." }, { status: 409 });
    }

    if (selectedSlot) {
      const alreadyBooked = await client.appointment.count({
        where: { bookingSlotId: selectedSlot.id, status: { in: ["BOOKED", "REQUESTED"] } },
      });
      if (alreadyBooked >= selectedSlot.capacity) {
        await client.bookingSlot.update({ where: { id: selectedSlot.id }, data: { isActive: false } });
        return NextResponse.json({ error: "That booking slot was just taken. Please choose another time." }, { status: 409 });
      }
    }

    const workspace = await client.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        businessProfile: true,
        agentConfig: true,
        members: { include: { user: true }, orderBy: { createdAt: "asc" }, take: 1 },
      },
    });

    const agentConfig =
      workspace?.agentConfig ||
      (await client.agentConfig.upsert({
        where: { workspaceId },
        update: {},
        create: { workspaceId, name: "Booking Assistant", tone: "professional" },
      }));

    const slotText = selectedSlot ? formatSlot(selectedSlot) : preferredTime || "Not selected";
    const status = selectedSlot ? "BOOKED" : "QUALIFIED";
    const requestSummary = safeSummary([
      `Request type: ${selectedSlot ? "Booking" : "Enquiry"}`,
      `Service: ${serviceNeeded}`,
      `Selected/preferred time: ${slotText}`,
      `Message: ${message}`,
    ]);

    // IMPORTANT: public funnel submissions must always be visible as a fresh lead/request.
    // Do not dedupe by phone/email here. Same person can submit multiple enquiries/bookings.
    const lead = await client.lead.create({
      data: {
        workspaceId,
        name,
        email: email || null,
        phone: phone || null,
        source: selectedSlot ? "booking_funnel" : "enquiry_funnel",
        status,
        score: selectedSlot ? 85 : 60,
        requirements: requestSummary,
        timeline: preferredTime || slotText,
        summary: selectedSlot
          ? `${name} booked/requested ${serviceNeeded} for ${slotText}.`
          : `${name} submitted an enquiry about ${serviceNeeded}.`,
        nextAction: selectedSlot
          ? `Prepare for appointment: ${slotText}.`
          : "Review enquiry and follow up with the prospect.",
      },
    });

    const conversation = await client.conversation.create({
      data: {
        leadId: lead.id,
        agentConfigId: agentConfig.id,
        channel: "public_booking_funnel",
        summary: lead.summary,
        nextAction: lead.nextAction,
      },
    });

    await client.message.create({
      data: {
        conversationId: conversation.id,
        senderType: "LEAD",
        content: requestSummary,
        channelMetadata: { source: "public-options-funnel", body: { ...body, workspaceId } },
      },
    });

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
        notes: message,
      },
    });

    if (selectedSlot) {
      const bookedCount = await client.appointment.count({
        where: { bookingSlotId: selectedSlot.id, status: { in: ["BOOKED", "REQUESTED"] } },
      });
      if (bookedCount >= selectedSlot.capacity) {
        await client.bookingSlot.update({ where: { id: selectedSlot.id }, data: { isActive: false } });
      }
    }

    const ownerUserId = workspace?.members?.[0]?.user?.id || null;
    if (ownerUserId) {
      await client.notification
        .create({
          data: {
            workspaceId,
            userId: ownerUserId,
            title: selectedSlot ? "New appointment booked" : "New enquiry received",
            message: lead.summary || requestSummary,
            link: `/leads/${lead.id}`,
          },
        })
        .catch(() => null);
    }

    const businessName = workspace?.businessProfile?.name || workspace?.name || "the business";
    const ownerEmail = workspace?.businessProfile?.contactEmail || workspace?.members?.[0]?.user?.email || null;

    const ownerEmailResult = await sendEmail({
      to: ownerEmail,
      subject: selectedSlot ? `New booked appointment: ${businessName}` : `New enquiry: ${businessName}`,
      text: [
        selectedSlot ? "New appointment booked from the public funnel." : "New enquiry submitted from the public funnel.",
        "",
        `Business: ${businessName}`,
        `Lead: ${name}`,
        `Email: ${email || "Not provided"}`,
        `Phone: ${phone || "Not provided"}`,
        `Service: ${serviceNeeded}`,
        `Slot/time: ${slotText}`,
        `Message: ${message}`,
        "",
        `Open lead: /leads/${lead.id}`,
      ].join("\n"),
    });

    const leadEmailResult = await sendEmail({
      to: email,
      subject: selectedSlot ? `Your appointment request with ${businessName}` : `We received your enquiry for ${businessName}`,
      text: selectedSlot
        ? [
            `Hi ${name},`,
            "",
            `Thanks for reaching out to ${businessName}.`,
            `Your selected appointment slot is: ${slotText}`,
            "",
            "The team will confirm the final details if needed.",
            "",
            businessName,
          ].join("\n")
        : [
            `Hi ${name},`,
            "",
            `Thanks for reaching out to ${businessName}.`,
            "We received your enquiry and the team will follow up if anything else is needed.",
            "",
            businessName,
          ].join("\n"),
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      conversationId: conversation.id,
      appointment,
      notifications: {
        ownerEmail: ownerEmailResult,
        leadEmail: leadEmailResult,
      },
    });
  } catch (error) {
    console.error("Public booking failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit booking request." },
      { status: 500 }
    );
  }
}
