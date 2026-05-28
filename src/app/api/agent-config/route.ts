import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, requireWorkspaceId } from "@/lib/workspace";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    if (!hasDatabase()) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    const { searchParams } = new URL(req.url);
    const workspaceId = requireWorkspaceId(searchParams.get("workspaceId"));
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
    const body = await req.json();
    const workspaceId = requireWorkspaceId(body.workspaceId);
    const { db } = await import("@/lib/db");
    const { agentConfig, businessProfile } = body;
    const result: Record<string, unknown> = {};
    if (agentConfig) {
      result.agentConfig = await (db as any).agentConfig.upsert({ where: { workspaceId }, update: agentConfig, create: { workspaceId, ...agentConfig } });
    }
    if (businessProfile) {
      result.businessProfile = await (db as any).businessProfile.upsert({ where: { workspaceId }, update: businessProfile, create: { workspaceId, ...businessProfile } });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save config" }, { status: 500 });
  }
}
