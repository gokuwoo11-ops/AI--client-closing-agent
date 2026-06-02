"use client";

import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Repeat2,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  GlassPanel,
  PremiumMotionBackground,
  StatusBadge,
} from "@/components/premium/PremiumMotionBackground";

type Appointment = {
  id: string;
  title?: string;
  name?: string;
  leadName?: string;
  email?: string;
  phone?: string;
  startsAt?: string;
  endsAt?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  status?: string;
  selectedOption?: string;
  serviceNeeded?: string;
  requirement?: string;
  requirements?: string;
  message?: string;
  notes?: string;
};

type BookingSlot = {
  id: string;
  title?: string;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
};

type AnyRecord = Record<string, unknown>;

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

type RepeatMode = "EVERY_DAY" | "WEEKDAYS" | "WEEKENDS" | "CUSTOM";

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function arrayFromPayload<T>(payload: unknown, keys: string[]): T[] {
  const record = asRecord(payload);

  if (!record) return [];

  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }

  if (Array.isArray(payload)) return payload as T[];

  return [];
}

function formatDate(value?: string) {
  if (!value) return { day: "Time not set", time: "—" };

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return { day: "Time not set", time: "—" };

  return {
    day: date.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
    }),
    time: date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function duration(start?: string, end?: string) {
  if (!start || !end) return "";

  const s = new Date(start).getTime();
  const e = new Date(end).getTime();

  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return "";

  return `${Math.round((e - s) / 60000)} min`;
}

function toneFor(
  status?: string,
): "indigo" | "emerald" | "amber" | "slate" | "red" {
  const low = (status || "Booked").toLowerCase();

  if (low.includes("confirm") || low.includes("book")) return "emerald";
  if (low.includes("follow") || low.includes("pending")) return "amber";
  if (low.includes("lost") || low.includes("cancel")) return "red";

  return "indigo";
}

function startOf(appointment: Appointment) {
  return appointment.startsAt || appointment.scheduledStart;
}

function endOf(appointment: Appointment) {
  return appointment.endsAt || appointment.scheduledEnd;
}

function daysForMode(mode: RepeatMode, customDays: number[]) {
  if (mode === "EVERY_DAY") return [0, 1, 2, 3, 4, 5, 6];
  if (mode === "WEEKDAYS") return [1, 2, 3, 4, 5];
  if (mode === "WEEKENDS") return [0, 6];

  return customDays;
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");

  const [repeatMode, setRepeatMode] = useState<RepeatMode>("WEEKDAYS");
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [slotDuration, setSlotDuration] = useState("30");
  const [bufferMinutes, setBufferMinutes] = useState("10");
  const [daysAhead, setDaysAhead] = useState("14");
  const [slotTitle, setSlotTitle] = useState("Consultation");
  const [timezone, setTimezone] = useState("Asia/Kolkata");

  useEffect(() => {
    const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (guessed) setTimezone(guessed);
  }, []);

  async function loadSchedule() {
    setLoading(true);

    try {
      const response = await fetch("/api/appointments?range=all", {
        cache: "no-store",
      });

      const payload = response.ok ? await response.json() : null;

      setAppointments(
        arrayFromPayload<Appointment>(payload, [
          "appointments",
          "bookings",
          "items",
          "data",
          "results",
        ]),
      );

      setSlots(arrayFromPayload<BookingSlot>(payload, ["bookingSlots", "slots"]));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSchedule();
  }, []);

  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(startOf(a) || 0).getTime() -
          new Date(startOf(b) || 0).getTime(),
      ),
    [appointments],
  );

  const upcoming = sorted.filter(
    (item) => !startOf(item) || new Date(startOf(item) || 0).getTime() >= Date.now(),
  );

  const old = sorted
    .filter((item) => startOf(item) && new Date(startOf(item) || 0).getTime() < Date.now())
    .reverse();

  const activeFutureSlots = slots.filter(
    (slot) => new Date(slot.startsAt).getTime() >= Date.now() && slot.isActive !== false,
  );

  function toggleCustomDay(day: number) {
    setCustomDays((prev) =>
      prev.includes(day)
        ? prev.filter((item) => item !== day)
        : [...prev, day].sort((a, b) => a - b),
    );
  }

  async function generateSlots() {
    setGenerating(true);
    setNotice("");

    try {
      const selectedDays = daysForMode(repeatMode, customDays);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "GENERATE_RECURRING_SLOTS",
          repeatMode,
          days: selectedDays,
          startTime,
          endTime,
          slotDurationMinutes: Number(slotDuration),
          bufferMinutes: Number(bufferMinutes),
          daysAhead: Number(daysAhead),
          title: slotTitle,
          timezone,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        createdCount?: number;
        skippedExisting?: number;
        totalConsidered?: number;
      };

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Could not generate slots.");
      }

      setNotice(
        `Generated ${payload.createdCount || 0} new slots. Skipped ${
          payload.skippedExisting || 0
        } existing slots.`,
      );

      await loadSchedule();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Could not generate slots.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PremiumMotionBackground variant="owner">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="signature-font text-3xl text-amber-200/90">
            Schedule
          </p>

          <h1 className="mt-1 text-4xl font-black tracking-tight text-white">
            Bookings and repeat availability
          </h1>

          <p className="mt-2 text-sm font-medium text-white/45">
            Set your weekly availability once, then generate real booking slots
            automatically.
          </p>
        </div>

        <GlassPanel className="mb-6 p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200">
                <Repeat2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  Repeat availability
                </h2>

                <p className="text-xs font-semibold text-white/35">
                  Like an alarm app: choose repeat days, time range, and slot
                  duration.
                </p>
              </div>
            </div>

            <StatusBadge tone="cyan">{activeFutureSlots.length} active slots</StatusBadge>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[.16em] text-white/38">
                Repeat
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: "EVERY_DAY", label: "Every day" },
                  { id: "WEEKDAYS", label: "Weekdays" },
                  { id: "WEEKENDS", label: "Weekends" },
                  { id: "CUSTOM", label: "Custom days" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRepeatMode(item.id as RepeatMode)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                      repeatMode === item.id
                        ? "border-amber-300/50 bg-amber-400/10 text-amber-100"
                        : "border-white/10 bg-white/[.035] text-white/55 hover:bg-white/[.06]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {repeatMode === "CUSTOM" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleCustomDay(day.value)}
                      className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                        customDays.includes(day.value)
                          ? "border-emerald-300/50 bg-emerald-400/10 text-emerald-100"
                          : "border-white/10 bg-white/[.035] text-white/45"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
              <p className="mb-3 text-xs font-black uppercase tracking-[.16em] text-white/38">
                Time and duration
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Start time">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="field-input"
                  />
                </Field>

                <Field label="End time">
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="field-input"
                  />
                </Field>

                <Field label="Slot duration">
                  <select
                    value={slotDuration}
                    onChange={(event) => setSlotDuration(event.target.value)}
                    className="field-input"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                </Field>

                <Field label="Buffer time">
                  <select
                    value={bufferMinutes}
                    onChange={(event) => setBufferMinutes(event.target.value)}
                    className="field-input"
                  >
                    <option value="0">No buffer</option>
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                  </select>
                </Field>

                <Field label="Generate for">
                  <select
                    value={daysAhead}
                    onChange={(event) => setDaysAhead(event.target.value)}
                    className="field-input"
                  >
                    <option value="7">Next 7 days</option>
                    <option value="14">Next 14 days</option>
                    <option value="30">Next 30 days</option>
                    <option value="60">Next 60 days</option>
                  </select>
                </Field>

                <Field label="Slot title">
                  <input
                    value={slotTitle}
                    onChange={(event) => setSlotTitle(event.target.value)}
                    placeholder="Consultation"
                    className="field-input"
                  />
                </Field>
              </div>

              <p className="mt-3 text-xs font-semibold text-white/30">
                Timezone: {timezone}
              </p>
            </div>
          </div>

          {notice ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-bold text-white/65">
              {notice}
            </div>
          ) : null}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={generateSlots}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Generate booking slots
            </button>
          </div>
        </GlassPanel>

        <GlassPanel className="p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/10 text-indigo-200">
                <CalendarClock className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  Upcoming bookings
                </h2>

                <p className="text-xs font-semibold text-white/35">
                  Earliest appointment appears first.
                </p>
              </div>
            </div>

            <StatusBadge tone="emerald">{upcoming.length} upcoming</StatusBadge>
          </div>

          <div className="space-y-3">
            {upcoming.map((appointment, index) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                index={index}
              />
            ))}

            {!loading && upcoming.length === 0 ? <EmptySchedule /> : null}
          </div>
        </GlassPanel>

        {old.length > 0 ? (
          <GlassPanel className="mt-6 p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">
                Completed / older
              </h2>

              <StatusBadge tone="slate">Lower priority</StatusBadge>
            </div>

            <div className="space-y-3 opacity-75">
              {old.slice(0, 8).map((appointment, index) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  index={index}
                  compact
                />
              ))}
            </div>
          </GlassPanel>
        ) : null}
      </main>
    </PremiumMotionBackground>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-white/38">
        {label}
      </span>

      {children}
    </label>
  );
}

function AppointmentCard({
  appointment,
  index,
  compact = false,
}: {
  appointment: Appointment;
  index: number;
  compact?: boolean;
}) {
  const start = formatDate(startOf(appointment));
  const message =
    appointment.requirement ||
    appointment.requirements ||
    appointment.message ||
    appointment.notes ||
    "No requirement added.";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      className={`rounded-3xl border border-white/10 bg-white/[.04] p-5 transition hover:border-white/20 hover:bg-white/[.065] ${
        compact ? "" : "hover:-translate-y-1"
      }`}
    >
      <div className="grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-indigo-200">
            {start.day}
          </p>

          <p className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
            <Clock className="h-5 w-5 text-white/35" />
            {start.time}
          </p>

          <p className="mt-1 text-xs font-semibold text-white/35">
            {duration(startOf(appointment), endOf(appointment))}
          </p>
        </div>

        <div>
          <p className="text-lg font-black text-white">
            {appointment.title ||
              appointment.serviceNeeded ||
              appointment.selectedOption ||
              "Appointment"}
          </p>

          <p className="mt-1 text-sm font-semibold text-white/45">
            <UsersRound className="mr-2 inline h-4 w-4" />
            {appointment.leadName || appointment.name || "Lead"}{" "}
            {appointment.phone ? `· ${appointment.phone}` : ""}
          </p>

          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/38">
            {message}
          </p>
        </div>

        <StatusBadge tone={toneFor(appointment.status)}>
          {appointment.status || "Booked"}
        </StatusBadge>
      </div>
    </motion.div>
  );
}

function EmptySchedule() {
  return (
    <div className="rounded-3xl border border-dashed border-white/12 bg-white/[.025] p-10 text-center">
      <CalendarClock className="mx-auto h-8 w-8 text-white/28" />

      <p className="mt-4 text-lg font-black text-white/75">
        No bookings yet
      </p>

      <p className="mt-2 text-sm text-white/38">
        When prospects choose slots, their appointments will appear here in time
        order.
      </p>
    </div>
  );
}