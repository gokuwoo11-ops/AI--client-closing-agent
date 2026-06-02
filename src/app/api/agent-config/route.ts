import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { hasDatabase } from "@/lib/workspace";
import { cleanText } from "@/lib/security";

export const runtime = "nodejs";

async function requireSignedInWorkspace() {
  const current = await getCurrentWorkspace();
  if (!current?.workspace?.id) throw new Error("Not authenticated or workspace not found.");
  return current.workspace.id;
}

function safeAgentConfig(input: Record<string, unknown> = {}) {
  return {
    name: cleanText(input.name, 80) || "Booking Assistant",
    tone: cleanText(input.tone, 60) || "professional",
    bookingLink: cleanText(input.bookingLink, 500) || null,
    customInstructions: cleanText(input.customInstructions, 4000) || null,
    fallbackMessage: cleanText(input.fallbackMessage, 600) || "The team will confirm the best details for you.",
    handoffRules: cleanText(input.handoffRules, 2000) || null,
    leadScoringRules: cleanText(input.leadScoringRules, 2000) || null,
  };
}

function safeBusinessProfile(input: Record<string, unknown> = {}) {
  return {
    name: cleanText(input.name, 160) || "Business Workspace",
    niche: cleanText(input.niche, 140) || "Service business",
    websiteUrl: cleanText(input.websiteUrl, 400) || null,
    servicesStyle: cleanText(input.servicesStyle, 800) || null,
    pricingStyle: cleanText(input.pricingStyle, 800) || null,
    targetCustomer: cleanText(input.targetCustomer, 800) || null,
    location: cleanText(input.location, 180) || null,
    contactEmail: cleanText(input.contactEmail, 180) || "owner@example.com",
    contactPhone: cleanText(input.contactPhone, 80) || null,
    bookingLink: cleanText(input.bookingLink, 500) || null,
    workingHours: cleanText(input.workingHours, 400) || null,
  };
}

export async function GET() {
  try {
    if (!hasDatabase()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const workspaceId = await requireSignedInWorkspace();
    const { db } = await import("@/lib/db");
    const [agentConfig, businessProfile] = await Promise.all([
      (db as any).agentConfig.findUnique({ where: { workspaceId } }),
      (db as any).businessProfile.findUnique({ where: { workspaceId }, include: { services: true, faqs: true } }),
    ]);
    return NextResponse.json({ agentConfig, businessProfile });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load config" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const workspaceId = await requireSignedInWorkspace();
    const body = (await req.json()) as Record<string, unknown>;
    const { db } = await import("@/lib/db");
    const result: Record<string, unknown> = {};

    if (body.agentConfig && typeof body.agentConfig === "object") {
      const agentConfig = safeAgentConfig(body.agentConfig as Record<string, unknown>);
      result.agentConfig = await (db as any).agentConfig.upsert({
        where: { workspaceId },
        update: agentConfig,
        create: { workspaceId, ...agentConfig },
      });
    }

    if (body.businessProfile && typeof body.businessProfile === "object") {
      const businessProfile = safeBusinessProfile(body.businessProfile as Record<string, unknown>);
      result.businessProfile = await (db as any).businessProfile.upsert({
        where: { workspaceId },
        update: businessProfile,
        create: { workspaceId, ...businessProfile },
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save config" }, { status: 500 });
  }
}
