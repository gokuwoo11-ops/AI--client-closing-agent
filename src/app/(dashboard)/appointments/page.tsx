"use client";

import { motion } from "framer-motion";
import { CalendarClock, Clock, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GlassPanel, PremiumMotionBackground, StatusBadge } from "@/components/premium/PremiumMotionBackground";

type Appointment = { id: string; title?: string; name?: string; leadName?: string; leadEmail?: string; leadPhone?: string; email?: string; phone?: string; startsAt?: string; scheduledStart?: string; endsAt?: string; scheduledEnd?: string; status?: string; selectedOption?: string; serviceNeeded?: string; requirement?: string; requirements?: string; message?: string; notes?: string };
type AnyRecord = Record<string, unknown>;

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
    day: date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" }),
    time: date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  };
}

function duration(start?: string, end?: string) {
  if (!start || !end) return "";
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return "";
  return `${Math.round((e - s) / 60000)} min`;
}

function toneFor(status?: string): "indigo" | "emerald" | "amber" | "slate" | "red" {
  const low = (status || "Booked").toLowerCase();
  if (low.includes("confirm") || low.includes("book")) return "emerald";
  if (low.includes("follow") || low.includes("pending")) return "amber";
  if (low.includes("lost") || low.includes("cancel")) return "red";
  return "indigo";
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/appointments", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (!alive) return;
        setAppointments(arrayFromPayload<Appointment>(payload, ["appointments", "bookings", "items", "data", "results"]));
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const sorted = useMemo(() => [...appointments].sort((a, b) => new Date(a.startsAt || a.scheduledStart || 0).getTime() - new Date(b.startsAt || b.scheduledStart || 0).getTime()), [appointments]);
  const upcoming = sorted.filter((item) => { const start = item.startsAt || item.scheduledStart; return !start || new Date(start).getTime() >= Date.now(); });
  const old = sorted.filter((item) => { const start = item.startsAt || item.scheduledStart; return start && new Date(start).getTime() < Date.now(); }).reverse();

  return (
    <PremiumMotionBackground variant="owner">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="signature-font text-3xl text-amber-200/90">Daily Schedule</p>
          <h1 className="mt-1 text-4xl font-black tracking-tight text-white">Bookings sorted by time</h1>
          <p className="mt-2 text-sm font-medium text-white/45">Upcoming appointments stay first. Older completed calls stay lower.</p>
        </div>

        <GlassPanel className="p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-400/10 text-indigo-200"><CalendarClock className="h-5 w-5" /></div>
              <div>
                <h2 className="text-xl font-black text-white">Upcoming bookings</h2>
                <p className="text-xs font-semibold text-white/35">Earliest appointment appears first.</p>
              </div>
            </div>
            <StatusBadge tone="emerald">{upcoming.length} upcoming</StatusBadge>
          </div>

          <div className="space-y-3">
            {upcoming.map((appointment, index) => <AppointmentCard key={appointment.id} appointment={appointment} index={index} />)}
            {!loading && upcoming.length === 0 && <EmptySchedule />}
          </div>
        </GlassPanel>

        {old.length > 0 && (
          <GlassPanel className="mt-6 p-4 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Completed / older</h2>
              <StatusBadge tone="slate">Lower priority</StatusBadge>
            </div>
            <div className="space-y-3 opacity-75">
              {old.slice(0, 8).map((appointment, index) => <AppointmentCard key={appointment.id} appointment={appointment} index={index} compact />)}
            </div>
          </GlassPanel>
        )}
      </main>
    </PremiumMotionBackground>
  );
}

function AppointmentCard({ appointment, index, compact = false }: { appointment: Appointment; index: number; compact?: boolean }) {
  const startValue = appointment.startsAt || appointment.scheduledStart;
  const endValue = appointment.endsAt || appointment.scheduledEnd;
  const start = formatDate(startValue);
  const message = appointment.requirement || appointment.requirements || appointment.message || appointment.notes || "No requirement added.";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      className={`rounded-3xl border border-white/10 bg-white/[.04] p-5 transition hover:border-white/20 hover:bg-white/[.065] ${compact ? "" : "hover:-translate-y-1"}`}
    >
      <div className="grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-indigo-200">{start.day}</p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-black text-white"><Clock className="h-5 w-5 text-white/35" /> {start.time}</p>
          <p className="mt-1 text-xs font-semibold text-white/35">{duration(startValue, endValue)}</p>
        </div>
        <div>
          <p className="text-lg font-black text-white">{appointment.title || appointment.serviceNeeded || appointment.selectedOption || "Appointment"}</p>
          <p className="mt-1 text-sm font-semibold text-white/45"><UsersRound className="mr-2 inline h-4 w-4" />{appointment.leadName || appointment.name || "Lead"} {appointment.leadPhone || appointment.phone ? `· ${appointment.leadPhone || appointment.phone}` : ""}</p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-white/38">{message}</p>
        </div>
        <StatusBadge tone={toneFor(appointment.status)}>{appointment.status || "Booked"}</StatusBadge>
      </div>
    </motion.div>
  );
}

function EmptySchedule() {
  return (
    <div className="rounded-3xl border border-dashed border-white/12 bg-white/[.025] p-10 text-center">
      <CalendarClock className="mx-auto h-8 w-8 text-white/28" />
      <p className="mt-4 text-lg font-black text-white/75">No bookings yet</p>
      <p className="mt-2 text-sm text-white/38">When prospects choose slots, their appointments will appear here in time order.</p>
    </div>
  );
}
