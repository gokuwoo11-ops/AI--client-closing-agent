"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clipboard,
  Copy,
  Inbox,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Settings2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

type Workspace = { id: string; name: string };
type Conversation = { id: string; messages?: Array<{ id: string; senderType: string; content: string }> };
type Appointment = {
  id: string;
  status: string;
  serviceName?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
  leadPhone?: string | null;
  notes?: string | null;
  lead?: { id: string; name?: string | null; email?: string | null; phone?: string | null; status: string; score: number } | null;
};
type Lead = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  source: string;
  score: number;
  createdAt: string;
  nextAction?: string | null;
  conversations?: Conversation[];
  appointments?: Appointment[];
};

function StatCard({ label, value, icon: Icon, detail }: { label: string; value: string | number; icon: React.ElementType; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
        <div className="rounded-2xl bg-indigo-400/10 p-3 text-indigo-300 ring-1 ring-indigo-300/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function formatAppointmentTime(appointment: Appointment) {
  if (!appointment.scheduledStart) return "No time selected";
  const start = new Date(appointment.scheduledStart);
  const end = appointment.scheduledEnd ? new Date(appointment.scheduledEnd) : null;
  return `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${end ? ` - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`;
}

export default function DashboardOverviewPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const workspaceRes = await fetch("/api/workspace/current", { cache: "no-store" });
      const workspaceData = await workspaceRes.json();
      if (!workspaceRes.ok || !workspaceData.workspace?.id) throw new Error(workspaceData.error || "Please sign in to load your workspace.");
      setWorkspace(workspaceData.workspace);

      const [leadsRes, appointmentsRes] = await Promise.all([
        fetch("/api/leads", { cache: "no-store" }),
        fetch("/api/appointments?range=today&limit=25", { cache: "no-store" }),
      ]);

      const leadsData = await leadsRes.json();
      if (!leadsRes.ok) throw new Error(leadsData.error || "Failed to load leads.");
      setLeads(leadsData.leads || []);

      const appointmentsData = await appointmentsRes.json();
      if (!appointmentsRes.ok) throw new Error(appointmentsData.error || "Failed to load appointments.");
      setAppointments(appointmentsData.appointments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      setLeads([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const bookingFunnelUrl = workspace ? `${appUrl}/book/${workspace.id}` : "";
  const widgetScript = workspace ? `<script src="${appUrl}/api/widget.js?workspaceId=${workspace.id}" defer></script>` : "";

  const metrics = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((lead) => lead.score >= 70 || ["QUALIFIED", "BOOKING_SENT", "BOOKED", "WON"].includes(lead.status)).length;
    const booked = leads.filter((lead) => ["BOOKED", "WON"].includes(lead.status)).length;
    const openConversations = leads.reduce((sum, lead) => sum + (lead.conversations?.length || 0), 0);
    return { total, hot, booked, openConversations };
  }, [leads]);

  async function copy(value: string, key: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1600);
  }

  const bookedLeads = leads.filter((lead) => lead.status === "BOOKED" || (lead.appointments?.length || 0) > 0).slice(0, 5);
  const today = new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,.35),transparent_35%),linear-gradient(135deg,#0f172a,#070b14_55%,#111827)] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="absolute right-8 top-8 hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200 lg:block">
          Owner schedule controls the AI
        </div>
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-100">
            <Sparkles className="h-3.5 w-3.5" /> AI booking assistant
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">
            Today’s leads, bookings, and AI schedule in one owner app.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Update slots in the Booking Funnel. The prospect chatbot automatically reads those live slots, qualifies the prospect, then shows only available booking times.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/funnel" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-200">
              Manage slots <CalendarCheck className="h-4 w-4" />
            </Link>
            <Link href="/agent" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15">
              Configure AI <Settings2 className="h-4 w-4" />
            </Link>
            <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm font-black text-white hover:bg-black/30">
              Refresh <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      <section className="rounded-[28px] border border-emerald-300/20 bg-emerald-300/[0.06] p-5 shadow-2xl shadow-black/10 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Daily schedule • {today}</p>
            <h2 className="mt-2 text-2xl font-black text-white">Today’s booked appointments</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Earliest booking appears first, so 10 AM comes before 11 AM.</p>
          </div>
          <Link href="/appointments" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/15">
            View full schedule <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-slate-400">Loading schedule...</div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm leading-6 text-slate-400">
            No booked appointments today yet. Once prospects confirm a slot, bookings will appear here sorted by time.
          </div>
        ) : (
          <div className="grid gap-3">
            {appointments.map((appointment, index) => (
              <Link key={appointment.id} href={appointment.lead?.id ? `/leads/${appointment.lead.id}` : "/appointments"} className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-300/30 hover:bg-emerald-300/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-black uppercase text-slate-950">#{index + 1}</span>
                      <p className="text-lg font-black text-white">{formatAppointmentTime(appointment)}</p>
                    </div>
                    <p className="mt-2 text-sm font-bold text-slate-200">{appointment.leadName || appointment.lead?.name || "Booked prospect"}</p>
                    <p className="mt-1 text-xs text-slate-400">{appointment.serviceName || "Service not selected"}</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {appointment.leadPhone && <p className="flex items-center justify-end gap-1"><Phone className="h-3 w-3" />{appointment.leadPhone}</p>}
                    {appointment.leadEmail && <p className="mt-1 flex items-center justify-end gap-1"><Mail className="h-3 w-3" />{appointment.leadEmail}</p>}
                    <p className="mt-2 font-black uppercase text-emerald-300">{appointment.status}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads captured" value={loading ? "..." : metrics.total} icon={Users} detail="Real database records" />
        <StatCard label="Hot leads" value={loading ? "..." : metrics.hot} icon={Zap} detail="Qualified or high score" />
        <StatCard label="Booked" value={loading ? "..." : metrics.booked} icon={CalendarCheck} detail="Confirmed slot requests" />
        <StatCard label="Conversations" value={loading ? "..." : metrics.openConversations} icon={Inbox} detail="Inbox threads created" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/10 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">Prospect front door</p>
          <h2 className="mt-2 text-2xl font-black text-white">AI booking link + website widget</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Put the booking link in WhatsApp/Instagram/Facebook auto-replies. Put the widget script on the client website.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-6 text-slate-200">
            {bookingFunnelUrl || "Sign in and create a workspace to generate the booking link."}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button disabled={!bookingFunnelUrl} onClick={() => copy(bookingFunnelUrl, "booking")} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-400 disabled:opacity-40">
              <Clipboard className="h-4 w-4" /> {copied === "booking" ? "Copied" : "Copy booking link"}
            </button>
            <button disabled={!widgetScript} onClick={() => copy(widgetScript, "widget")} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/15 disabled:opacity-40">
              <Copy className="h-4 w-4" /> {copied === "widget" ? "Copied" : "Copy widget code"}
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/10 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Booked leads</p>
          <h2 className="mt-2 text-2xl font-black text-white">Highlighted booking pipeline</h2>
          <div className="mt-5 space-y-3">
            {bookedLeads.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">Booked leads will appear here after prospects confirm a slot.</p>
            ) : (
              bookedLeads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`} className="block rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 transition hover:bg-emerald-300/15">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-white">{lead.name || "Booked prospect"}</p>
                      <p className="mt-1 text-xs text-slate-400">{lead.nextAction || "Appointment booked"}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-black uppercase text-slate-950">Booked</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-indigo-500/10 via-white/[0.04] to-emerald-500/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Final flow</p>
            <h2 className="mt-2 text-2xl font-black text-white">Auto-reply link → chatbot qualification → live schedule → booked appointment.</h2>
          </div>
          <Link href="/funnel" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-200">
            Setup funnel <MessageCircle className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
