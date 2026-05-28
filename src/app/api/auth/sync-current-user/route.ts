import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await db.user.upsert({
      where: { email: authUser.email },
      update: {
        name: authUser.user_metadata?.name || authUser.email.split("@")[0],
        supabaseId: authUser.id,
        avatarUrl: authUser.user_metadata?.avatar_url || null,
      },
      create: {
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split("@")[0],
        supabaseId: authUser.id,
        avatarUrl: authUser.user_metadata?.avatar_url || null,
      },
    });

    const existingMembership = await db.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    });

    if (existingMembership) {
      return NextResponse.json({
        success: true,
        user,
        workspace: existingMembership.workspace,
      });
    }

    const workspace = await db.workspace.create({
      data: {
        name: `${user.name || "My"} Workspace`,
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

    return NextResponse.json({
      success: true,
      user,
      workspace,
    });
  } catch (error) {
    console.error("Sync current user error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync authenticated user",
      },
      { status: 500 }
    );
  }
}