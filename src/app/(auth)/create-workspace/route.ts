import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = body.email;
    const name = body.name;
    const supabaseId = body.supabaseId;

    if (!email || !supabaseId) {
      return NextResponse.json(
        { error: "Missing email or supabaseId" },
        { status: 400 }
      );
    }

    const user = await db.user.upsert({
      where: { email },
      update: {
        name: name || undefined,
        supabaseId,
      },
      create: {
        email,
        name: name || null,
        supabaseId,
      },
    });

    const existingMembership = await db.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    });

    if (existingMembership) {
      return NextResponse.json({
        user,
        workspace: existingMembership.workspace,
      });
    }

    const workspace = await db.workspace.create({
      data: {
        name: name ? `${name}'s Workspace` : "My Workspace",
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
        agentConfig: {
          create: {
            name: "Sales Assistant",
            tone: "professional",
          },
        },
      },
    });

    return NextResponse.json({ user, workspace });
  } catch (error) {
    console.error("Create workspace error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create workspace",
      },
      { status: 500 }
    );
  }
}