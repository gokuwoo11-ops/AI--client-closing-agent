import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/workspace";

export async function POST(request: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 500 },
      );
    }

    const current = await getCurrentWorkspace();

    const workspaceId = current?.workspace?.id;
    const userId = current?.user?.id || current?.authUser?.id;

    if (!workspaceId || !userId) {
      return NextResponse.json(
        { error: "You must be signed in to enable notifications." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const subscription = body?.subscription;

    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Invalid push subscription." },
        { status: 400 },
      );
    }

    await (db as any).pushSubscription.upsert({
      where: { endpoint },
      update: {
        workspaceId,
        userId,
        p256dh,
        auth,
        userAgent: request.headers.get("user-agent") || null,
      },
      create: {
        workspaceId,
        userId,
        endpoint,
        p256dh,
        auth,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscribe failed:", error);

    return NextResponse.json(
      { error: "Could not enable notifications." },
      { status: 500 },
    );
  }
}