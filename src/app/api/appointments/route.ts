import { NextRequest, NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/current-workspace";
import { hasDatabase } from "@/lib/workspace";

export const runtime = "nodejs";

type RepeatMode = "EVERY_DAY" | "WEEKDAYS" | "WEEKENDS" | "CUSTOM";

function getDateRange(range: string | null) {
  const now = new Date();

  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { gte: start, lt: end };
  }

  if (range === "all") {
    return undefined;
  }

  return { gte: now };
}

function parseTimeToMinutes(value: unknown) {
  const text = String(value || "");

  const match = /^(\d{2}):(\d{2})$/.exec(text);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const num = Number(value);

  if (!Number.isFinite(num)) return fallback;

  return Math.min(Math.max(Math.floor(num), min), max);
}

function selectedDaysFromInput(mode: RepeatMode, inputDays: unknown) {
  if (mode === "EVERY_DAY") return [0, 1, 2, 3, 4, 5, 6];
  if (mode === "WEEKDAYS") return [1, 2, 3, 4, 5];
  if (mode === "WEEKENDS") return [0, 6];

  const days = Array.isArray(inputDays)
    ? inputDays
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : [];

  return Array.from(new Set(days)).sort((a, b) => a - b);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function minutesToClock(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function timezoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );

  return asUTC - date.getTime();
}

function zonedDateTimeToUtc(dateKey: string, clock: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = clock.split(":").map(Number);

  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = timezoneOffsetMs(utcGuess, timeZone);

  return new Date(utcGuess.getTime() - offset);
}

export async function GET(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "Database is not configured.", appointments: [] },
        { status: 503 },
      );
    }

    const current = await getCurrentWorkspace();

    if (!current?.workspace?.id) {
      return NextResponse.json(
        { error: "Not authenticated.", appointments: [] },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "upcoming";
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 50), 1),
      200,
    );

    const scheduledStart = getDateRange(range);

    const { db } = await import("@/lib/db");
    const client = db as any;

    const appointments = await client.appointment.findMany({
      where: {
        workspaceId: current.workspace.id,
        ...(scheduledStart ? { scheduledStart } : {}),
        status: { in: ["BOOKED", "REQUESTED"] },
      },
      orderBy: [{ scheduledStart: "asc" }, { createdAt: "asc" }],
      take: limit,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            source: true,
            score: true,
            nextAction: true,
          },
        },
        bookingSlot: true,
      },
    });

    const bookingSlots = await client.bookingSlot.findMany({
      where: {
        workspaceId: current.workspace.id,
        isActive: true,
        startsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
      take: 300,
    });

    return NextResponse.json({ appointments, bookingSlots });
  } catch (error) {
    console.error("Appointments GET failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load appointments.",
        appointments: [],
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!hasDatabase()) {
      return NextResponse.json(
        { error: "Database is not configured." },
        { status: 503 },
      );
    }

    const current = await getCurrentWorkspace();

    if (!current?.workspace?.id) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 },
      );
    }

    const body = (await req.json()) as Record<string, unknown>;

    if (body.action !== "GENERATE_RECURRING_SLOTS") {
      return NextResponse.json(
        { error: "Unsupported appointment action." },
        { status: 400 },
      );
    }

    const repeatMode = String(body.repeatMode || "WEEKDAYS") as RepeatMode;
    const selectedDays = selectedDaysFromInput(repeatMode, body.days);

    if (selectedDays.length === 0) {
      return NextResponse.json(
        { error: "Choose at least one repeat day." },
        { status: 400 },
      );
    }

    const startMinutes = parseTimeToMinutes(body.startTime);
    const endMinutes = parseTimeToMinutes(body.endTime);

    if (startMinutes === null || endMinutes === null) {
      return NextResponse.json(
        { error: "Start time and end time are required." },
        { status: 400 },
      );
    }

    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        { error: "End time must be after start time." },
        { status: 400 },
      );
    }

    const slotDurationMinutes = clampNumber(
      body.slotDurationMinutes,
      10,
      240,
      30,
    );

    const bufferMinutes = clampNumber(body.bufferMinutes, 0, 120, 0);
    const daysAhead = clampNumber(body.daysAhead, 1, 90, 14);
    const title = String(body.title || "Consultation").trim().slice(0, 120);
    const timezone = String(body.timezone || "UTC").trim().slice(0, 80) || "UTC";

    const stepMinutes = slotDurationMinutes + bufferMinutes;
    const now = new Date();
    const candidates: {
      workspaceId: string;
      title: string;
      startsAt: Date;
      endsAt: Date;
      timezone: string;
      capacity: number;
      isActive: boolean;
    }[] = [];

    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset += 1) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);

      if (!selectedDays.includes(date.getDay())) continue;

      const dateKey = toDateKey(date);

      for (
        let cursor = startMinutes;
        cursor + slotDurationMinutes <= endMinutes;
        cursor += stepMinutes
      ) {
        const start = zonedDateTimeToUtc(
          dateKey,
          minutesToClock(cursor),
          timezone,
        );

        const end = zonedDateTimeToUtc(
          dateKey,
          minutesToClock(cursor + slotDurationMinutes),
          timezone,
        );

        if (start <= now) continue;

        candidates.push({
          workspaceId: current.workspace.id,
          title,
          startsAt: start,
          endsAt: end,
          timezone,
          capacity: 1,
          isActive: true,
        });
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        createdCount: 0,
        skippedExisting: 0,
        totalConsidered: 0,
        message: "No future slots matched this schedule.",
      });
    }

    if (candidates.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Too many slots. Reduce the date range or increase slot duration.",
        },
        { status: 400 },
      );
    }

    const { db } = await import("@/lib/db");
    const client = db as any;

    const firstStart = candidates[0].startsAt;
    const lastStart = candidates[candidates.length - 1].startsAt;

    const existing = await client.bookingSlot.findMany({
      where: {
        workspaceId: current.workspace.id,
        startsAt: {
          gte: firstStart,
          lte: lastStart,
        },
      },
      select: {
        startsAt: true,
      },
    });

    const existingStarts = new Set(
      existing.map((slot: { startsAt: Date }) => slot.startsAt.toISOString()),
    );

    const toCreate = candidates.filter(
      (slot) => !existingStarts.has(slot.startsAt.toISOString()),
    );

    if (toCreate.length > 0) {
      await client.bookingSlot.createMany({
        data: toCreate,
      });
    }

    return NextResponse.json({
      success: true,
      createdCount: toCreate.length,
      skippedExisting: candidates.length - toCreate.length,
      totalConsidered: candidates.length,
    });
  } catch (error) {
    console.error("Appointments POST failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not generate booking slots.",
      },
      { status: 500 },
    );
  }
}