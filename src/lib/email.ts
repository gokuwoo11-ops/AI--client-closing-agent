import { Resend } from "resend";

export type EmailSendResult = {
  mode: "sent" | "setup_required" | "failed";
  message: string;
};

function getEmailClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return { resend: new Resend(apiKey), from };
}

export async function sendEmail({
  to,
  subject,
  text,
}: {
  to?: string | null;
  subject: string;
  text: string;
}): Promise<EmailSendResult> {
  const safeTo = to?.trim();
  if (!safeTo) {
    return { mode: "setup_required", message: "Recipient email is missing." };
  }

  const client = getEmailClient();
  if (!client) {
    return {
      mode: "setup_required",
      message: "RESEND_API_KEY and RESEND_FROM_EMAIL are required before email can be sent.",
    };
  }

  try {
    await client.resend.emails.send({
      from: client.from,
      to: safeTo,
      subject,
      text,
    });

    return { mode: "sent", message: `Email sent to ${safeTo}.` };
  } catch (error) {
    console.error("Email send failed:", error);
    return {
      mode: "failed",
      message: error instanceof Error ? error.message : "Email send failed.",
    };
  }
}

export function formatSlot(slot?: {
  title?: string | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  timezone?: string | null;
}) {
  if (!slot?.startsAt) return "No slot selected yet.";

  const start = new Date(slot.startsAt);
  const end = slot.endsAt ? new Date(slot.endsAt) : null;
  const dateText = start.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const endText = end
    ? end.toLocaleTimeString("en-IN", { timeStyle: "short" })
    : "";
  const range = endText ? `${dateText} - ${endText}` : dateText;

  return `${slot.title ? `${slot.title}: ` : ""}${range}${slot.timezone ? ` (${slot.timezone})` : ""}`;
}
