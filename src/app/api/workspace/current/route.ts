import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/current-workspace";

export const runtime = "nodejs";

export async function GET() {
  try {
    const current = await getCurrentWorkspace();

    if (!current) {
      return NextResponse.json(
        { error: "Not authenticated or workspace not found" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: current.user,
      workspace: current.workspace,
    });
  } catch (error) {
    console.error("Current workspace error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load current workspace",
      },
      { status: 500 }
    );
  }
}