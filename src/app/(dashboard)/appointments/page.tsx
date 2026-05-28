"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Mail, Phone, RefreshCw, UserRound } from "lucide-react";

type Appointment = {
  id: string;
  status: string;
  serviceName?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  requestedTime?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
  leadPhone?: string | null;
  notes?: string | null;
  lead?: { id: string; name?: string | null; email?: string | null; phone?: string | null; status: string; score: number } | null;
};

function formatDate(value?: string | null) {
  if (!value) return "No date selected";
  return new Date(value).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function formatTime(appointment: Appointment) {
  if (!appointment.scheduledStart) return appointment.requestedTime || "No time selected";
  const start = new Date(appointment.scheduledStart);
  const end = appointment.scheduledEnd ? new Date(appointment.scheduledEnd) : null;
  return `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${end ? ` - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [range, setRange] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextRange = range) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments?range=${nextRange}&limit=100`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load schedule.");
      setAppointments(data.appointments || []);
    } catch (err) {
      setAppointments([]);
      setError(err instanceof Error ? err.message : "Failed to load schedule.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(range);
  }, [range]);

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appointment of appointments) {
      const key = appointment.scheduledStart ? formatDate(appointment.scheduledStart) : "No scheduled date";
      map.set(key, [...(map.get(key) || []), appointment]);
    }
    return Array.from(map.entries());
  }, [appointments]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.22),transparent_32%),linear-gradient(135deg,#0f172a,#070b14_58%,#111827)] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-100">
              <CalendarCheck className="h-3.5 w-3.5" /> Owner schedule
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">Daily booked schedule</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Bookings are sorted by time. The earliest confirmed appointment appears first for each day.
            </p>
          </div>
          <button onClick={() => load()} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/15">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {["today", "upcoming", "all"].map((item) => (
          <button
            key={item}
            onClick={() => setRange(item)}
            className={`rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] ${range === item ? "bg-emerald-400 text-slate-950" : "border border-white/10 bg-white/10 text-white hover:bg-white/15"}`}
          >
            {item}
          </button>
        ))}
        <Link href="/funnel" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white hover:bg-white/15">
          Manage slots
        </Link>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      {loading ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center text-sm text-slate-400">Loading schedule...</div>
      ) : appointments.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-10 text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-slate-600" />
          <p className="mt-4 font-black text-white">No bookings found</p>
          <p className="mt-2 text-sm text-slate-400">Bookings will appear here after prospects qualify and choose an available slot.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, items]) => (
            <section key={date} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
              <h2 className="text-xl font-black text-white">{date}</h2>
              <div className="mt-4 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {items.map((appointment, index) => (
                  <Link key={appointment.id} href={appointment.lead?.id ? `/leads/${appointment.lead.id}` : "/appointments"} className="block p-4 transition hover:bg-white/[0.03]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-sm font-black text-slate-950">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-lg font-black text-white">{formatTime(appointment)}</p>
                          <p className="mt-1 text-sm font-bold text-slate-300">{appointment.leadName || appointment.lead?.name || "Booked prospect"}</p>
                          <p className="mt-1 text-xs text-slate-500">{appointment.serviceName || "Service not selected"}</p>
                          {appointment.notes && <p className="mt-2 max-w-xl text-xs leading-5 text-slate-400">{appointment.notes}</p>}
                        </div>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 font-black uppercase text-emerald-300">{appointment.status}</p>
                        {appointment.leadPhone && <p className="mt-2 flex items-center justify-end gap-1"><Phone className="h-3 w-3" />{appointment.leadPhone}</p>}
                        {appointment.leadEmail && <p className="mt-1 flex items-center justify-end gap-1"><Mail className="h-3 w-3" />{appointment.leadEmail}</p>}
                        {!appointment.leadPhone && !appointment.leadEmail && <p className="mt-2 flex items-center justify-end gap-1"><UserRound className="h-3 w-3" />No contact saved</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
