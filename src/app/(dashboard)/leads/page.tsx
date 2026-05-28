"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, CalendarCheck, ExternalLink, Mail, Phone, RefreshCw, Search, SlidersHorizontal, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type ApiMessage = { id?: string; senderType: string; content: string; createdAt: string };
type ApiConversation = { id: string; channel: string; messages: ApiMessage[] };
type Appointment = {
  id: string;
  status: string;
  serviceName?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  leadName?: string | null;
  leadEmail?: string | null;
  leadPhone?: string | null;
};
type Lead = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  requirements?: string | null;
  budget?: string | null;
  timeline?: string | null;
  status: string;
  score: number;
  source: string;
  summary?: string | null;
  nextAction?: string | null;
  createdAt: string;
  conversations?: ApiConversation[];
  appointments?: Appointment[];
};
type Workspace = { id: string; name: string };

const sourceLabels: Record<string, string> = {
  website: "Website",
  website_widget: "Widget",
  chat_widget: "Widget",
  ai_booking_funnel: "Booking Funnel",
  email: "Email",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  manual: "Manual",
};
const sourceColors: Record<string, string> = {
  website: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
  website_widget: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  chat_widget: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  ai_booking_funnel: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  email: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  whatsapp: "text-green-300 bg-green-500/10 border-green-500/20",
  instagram: "text-pink-300 bg-pink-500/10 border-pink-500/20",
  facebook: "text-sky-300 bg-sky-500/10 border-sky-500/20",
  manual: "text-gray-300 bg-gray-500/10 border-gray-500/20",
};
const statusColors: Record<string, string> = {
  NEW: "text-pink-300 bg-pink-500/10 border-pink-500/20",
  CONTACTED: "text-blue-300 bg-blue-500/10 border-blue-500/20",
  QUALIFIED: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
  BOOKING_SENT: "text-purple-300 bg-purple-500/10 border-purple-500/20",
  BOOKED: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  FOLLOW_UP: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  WON: "text-green-300 bg-green-500/10 border-green-500/20",
  LOST: "text-red-300 bg-red-500/10 border-red-500/20",
  SPAM: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};

function appointmentLabel(appointment?: Appointment) {
  if (!appointment?.scheduledStart) return "No slot yet";
  const start = new Date(appointment.scheduledStart);
  const end = appointment.scheduledEnd ? new Date(appointment.scheduledEnd) : null;
  return `${start.toLocaleDateString([], { month: "short", day: "numeric" })} • ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${end ? ` - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`;
}

export default function LeadsCRMPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const workspaceRes = await fetch("/api/workspace/current", { cache: "no-store" });
      const workspaceData = await workspaceRes.json();
      if (!workspaceRes.ok || !workspaceData.workspace?.id) throw new Error(workspaceData.error || "Please sign in to load your workspace.");
      setWorkspace(workspaceData.workspace);
      const leadsRes = await fetch("/api/leads", { cache: "no-store" });
      const leadsData = await leadsRes.json();
      if (!leadsRes.ok) throw new Error(leadsData.error || "Failed to load leads.");
      setLeads(leadsData.leads || []);
    } catch (err) {
      setLeads([]);
      setError(err instanceof Error ? err.message : "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const haystack = `${lead.name || ""} ${lead.email || ""} ${lead.phone || ""} ${lead.requirements || ""} ${lead.nextAction || ""}`.toLowerCase();
        return (
          haystack.includes(searchQuery.toLowerCase()) &&
          (statusFilter === "ALL" || lead.status === statusFilter) &&
          (sourceFilter === "ALL" || lead.source === sourceFilter)
        );
      }),
    [leads, searchQuery, statusFilter, sourceFilter]
  );

  const bookedCount = leads.filter((lead) => lead.status === "BOOKED" || (lead.appointments?.length || 0) > 0).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-white">
            <Users className="h-7 w-7 text-indigo-400" /> Leads CRM
          </h1>
          <p className="mt-1 text-xs text-gray-400">
            {workspace ? `${workspace.name} • ${leads.length} leads • ${bookedCount} booked` : "Loading your workspace leads"}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/15">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <Link href="/appointments" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-500">
            <CalendarCheck className="h-3.5 w-3.5" /> Schedule
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
        Booked leads are highlighted. Click any row to see full conversation, qualification details, and appointment info.
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search leads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#0c101d] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none rounded-lg border border-white/10 bg-[#0c101d] py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="ALL">All Statuses</option>
            {["NEW", "CONTACTED", "QUALIFIED", "BOOKING_SENT", "BOOKED", "FOLLOW_UP", "WON", "LOST", "SPAM"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="appearance-none rounded-lg border border-white/10 bg-[#0c101d] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="ALL">All Channels</option>
          {Object.entries(sourceLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5 glassmorphism">
        {loading ? (
          <div className="p-16 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>
        ) : error ? (
          <div className="p-8 text-sm text-red-300">{error}</div>
        ) : filteredLeads.length === 0 ? (
          <div className="space-y-3 p-16 text-center">
            <Bot className="mx-auto h-12 w-12 text-gray-600" />
            <p className="font-bold text-white">No leads captured yet</p>
            <p className="text-xs text-gray-500">Share the AI booking link or install the website widget to capture the first real lead.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-[#090d16]/50 text-gray-500">
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Lead</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Channel</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Booking</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Score</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 font-bold uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredLeads.map((lead) => {
                  const appointment = lead.appointments?.[0];
                  const isBooked = lead.status === "BOOKED" || Boolean(appointment);
                  return (
                    <tr key={lead.id} className={cn("group transition-colors hover:bg-white/[0.02]", isBooked && "bg-emerald-500/[0.07] ring-1 ring-inset ring-emerald-400/10")}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white">{lead.name || "Anonymous"}</p>
                          {isBooked && <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase text-slate-950">Booked</span>}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2">
                          {lead.email && <span className="flex items-center gap-1 text-gray-500"><Mail className="h-3 w-3" />{lead.email}</span>}
                          {lead.phone && <span className="flex items-center gap-1 text-gray-500"><Phone className="h-3 w-3" />{lead.phone}</span>}
                        </div>
                        {lead.nextAction && <p className="mt-1 max-w-xs truncate text-[10px] text-gray-500">{lead.nextAction}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase", sourceColors[lead.source] || sourceColors.manual)}>
                          {sourceLabels[lead.source] || lead.source}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {appointment ? (
                          <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-emerald-100">
                            <p className="font-black">{appointmentLabel(appointment)}</p>
                            <p className="mt-1 text-[10px] text-emerald-200/80">{appointment.serviceName || "Service not selected"}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">Not booked yet</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", lead.score >= 80 ? "bg-emerald-500/10 text-emerald-400" : lead.score >= 60 ? "bg-indigo-500/10 text-indigo-400" : "bg-gray-500/10 text-gray-400")}>
                          <Zap className="h-3 w-3" />{lead.score}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase", statusColors[lead.status] || "border-gray-500/20 bg-gray-500/10 text-gray-400")}>{lead.status}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <Link href={`/leads/${lead.id}`} className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-600/10 px-3 py-1.5 text-[10px] font-bold text-indigo-300 hover:bg-indigo-600/20">
                          View <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
