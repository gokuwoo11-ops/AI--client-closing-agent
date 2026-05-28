"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bot, Calendar, CheckCircle, ChevronDown, ClipboardCopy, ExternalLink, Loader2, Mail, MessageSquare, Phone, Save, Sparkles, User, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { id?: string; senderType: string; content: string; createdAt: string };
type Conversation = { id: string; channel: string; messages: Message[] };
type Appointment = { id: string; status: string; serviceName?: string | null; scheduledStart?: string | null; scheduledEnd?: string | null; requestedTime?: string | null; leadName?: string | null; leadEmail?: string | null; leadPhone?: string | null; notes?: string | null };
type Lead = { id: string; name?: string | null; email?: string | null; phone?: string | null; requirements?: string | null; budget?: string | null; timeline?: string | null; status: string; score: number; source: string; summary?: string | null; nextAction?: string | null; notes?: string | null; createdAt: string; conversations?: Conversation[]; appointments?: Appointment[] };

const STATUS_OPTIONS = ["NEW","CONTACTED","QUALIFIED","BOOKING_SENT","BOOKED","FOLLOW_UP","WON","LOST","SPAM"];
const statusColors: Record<string,string> = { NEW:"bg-pink-500/15 text-pink-300 border-pink-500/20", CONTACTED:"bg-blue-500/15 text-blue-300 border-blue-500/20", QUALIFIED:"bg-indigo-500/15 text-indigo-300 border-indigo-500/20", BOOKING_SENT:"bg-purple-500/15 text-purple-300 border-purple-500/20", BOOKED:"bg-emerald-500/15 text-emerald-300 border-emerald-500/20", FOLLOW_UP:"bg-yellow-500/15 text-yellow-300 border-yellow-500/20", WON:"bg-green-500/15 text-green-300 border-green-500/20", LOST:"bg-red-500/15 text-red-300 border-red-500/20", SPAM:"bg-gray-500/15 text-gray-400 border-gray-500/20" };
const sourceLabel: Record<string,string> = { website:"Website Form", chat_widget:"Chat Widget", website_widget:"Website Widget", ai_booking_funnel:"Booking Funnel", email:"Email", whatsapp:"WhatsApp", instagram:"Instagram", facebook:"Facebook", manual:"Manual" };

function formatAppointment(appointment: Appointment) {
  if (!appointment.scheduledStart) return appointment.requestedTime || "No time selected";
  const start = new Date(appointment.scheduledStart);
  const end = appointment.scheduledEnd ? new Date(appointment.scheduledEnd) : null;
  return `${start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} • ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${end ? ` - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-indigo-400 transition-colors"><ClipboardCopy className="h-3 w-3" /> {copied ? "Copied!" : label}</button>;
}

export default function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("NEW");
  const [notes, setNotes] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/leads/${leadId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setLead(data.lead);
        setStatus(data.lead?.status || "NEW");
        setNotes(data.lead?.notes || "");
      } finally { setLoading(false); }
    }
    if (leadId) load();
  }, [leadId]);

  async function patchLead(data: Record<string, unknown>, message: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json.lead) setLead((prev) => ({ ...(prev || json.lead), ...json.lead }));
      setSavedMessage(message);
      setTimeout(() => setSavedMessage(""), 1800);
    } finally { setSaving(false); }
  }

  const messages = lead?.conversations?.flatMap((c) => c.messages || []) || [];
  const suggestedReply = useMemo(() => lead ? `Hi ${lead.name || "there"}, thanks for reaching out. I saw your requirement: ${lead.requirements || "your inquiry"}. ${lead.budget ? `Your mentioned budget is ${lead.budget}. ` : ""}${lead.timeline ? `Timeline noted: ${lead.timeline}. ` : ""}Would you like to book a quick call so we can confirm the next step?` : "", [lead]);
  const whatsappUrl = lead?.phone ? `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(suggestedReply)}` : "";

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>;
  if (!lead) return <div className="flex flex-col items-center justify-center h-64 gap-4"><p className="text-gray-400">Lead not found.</p><button onClick={() => router.push("/leads")} className="text-indigo-400 hover:underline text-sm">← Back to leads</button></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4"><button onClick={() => router.push("/leads")} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></button><div className="flex-1"><h1 className="text-xl font-extrabold text-white">{lead.name || "Anonymous Lead"}</h1><div className="flex items-center gap-3 mt-1 flex-wrap"><span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase", statusColors[lead.status] || statusColors.NEW)}>{lead.status}</span><span className="text-[11px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">{sourceLabel[lead.source] || lead.source}</span><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold text-indigo-400 bg-indigo-500/10 border-indigo-500/20"><Zap className="h-3 w-3" />{lead.score}/100</span><span className="text-[11px] text-gray-500">{new Date(lead.createdAt).toLocaleString()}</span></div></div>{savedMessage && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {savedMessage}</span>}</div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-5">
          <div className="glassmorphism rounded-xl border border-white/5 p-5 space-y-4"><h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><User className="h-4 w-4 text-indigo-400" /> Contact</h3>{lead.email && <div className="flex items-center justify-between gap-2 text-sm text-gray-300"><span className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-500" />{lead.email}</span><CopyButton value={lead.email} label="Copy" /></div>}{lead.phone && <div className="space-y-2"><div className="flex items-center justify-between gap-2 text-sm text-gray-300"><span className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" />{lead.phone}</span><CopyButton value={lead.phone} label="Copy" /></div><a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-green-400 text-xs font-bold hover:underline">Open WhatsApp <ExternalLink className="h-3 w-3" /></a></div>}{!lead.email && !lead.phone && <p className="text-xs text-gray-500">No contact details.</p>}</div>
          {lead.appointments && lead.appointments.length > 0 && <div className="glassmorphism rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 space-y-3"><h3 className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-2"><Calendar className="h-4 w-4 text-emerald-300" /> Booked Schedule</h3>{lead.appointments.map((appointment) => <div key={appointment.id} className="rounded-lg border border-emerald-300/20 bg-black/20 p-3"><p className="text-sm font-black text-white">{formatAppointment(appointment)}</p><p className="mt-1 text-xs text-emerald-200">{appointment.serviceName || "Service not selected"} • {appointment.status}</p>{appointment.notes && <p className="mt-2 text-xs leading-5 text-slate-400">{appointment.notes}</p>}</div>)}</div>}
          <div className="glassmorphism rounded-xl border border-white/5 p-5 space-y-3"><h3 className="text-xs font-bold text-white uppercase tracking-wider">Lead Details</h3>{[["Budget", lead.budget], ["Timeline", lead.timeline], ["Requirement", lead.requirements]].map(([label, value]) => value ? <div key={label as string}><p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{label}</p><p className="text-sm text-gray-300 mt-0.5">{value}</p></div> : null)}</div>
          <div className="glassmorphism rounded-xl border border-white/5 p-5 space-y-3"><h3 className="text-xs font-bold text-white uppercase tracking-wider">Update Status</h3><div className="relative"><select value={status} onChange={(e) => { setStatus(e.target.value); patchLead({ status: e.target.value }, "Status saved"); }} disabled={saving} className="w-full px-4 py-2.5 rounded-lg bg-[#090d16] border border-white/10 text-white text-sm appearance-none"><option value={status}>{status}</option>{STATUS_OPTIONS.filter(s => s !== status).map(s => <option key={s} value={s}>{s}</option>)}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /></div><button onClick={() => { setStatus("CONTACTED"); patchLead({ status: "CONTACTED" }, "Marked contacted"); }} className="w-full py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-300 text-xs font-bold">Mark as Contacted</button></div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="glassmorphism rounded-xl border border-indigo-500/10 p-5 space-y-4"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><Sparkles className="h-4 w-4 text-indigo-400" /></div><h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Closing Assist</h3></div>{lead.summary && <p className="text-sm text-gray-300 leading-relaxed">{lead.summary}</p>}{lead.nextAction && <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-lg p-3"><p className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mb-1">Suggested Next Action</p><p className="text-sm text-indigo-200">{lead.nextAction}</p></div>}<div className="bg-black/20 border border-white/5 rounded-xl p-3"><p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Suggested WhatsApp / Email Reply</p><p className="text-sm text-gray-300 whitespace-pre-wrap">{suggestedReply}</p><div className="mt-3 flex gap-2"><CopyButton value={suggestedReply} label="Copy reply" />{lead.phone && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-green-400 hover:underline">Send on WhatsApp →</a>}</div></div></div>

          <div className="glassmorphism rounded-xl border border-white/5 overflow-hidden"><div className="px-5 py-3 border-b border-white/5 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-indigo-400" /><h3 className="text-xs font-bold text-white uppercase tracking-wider">Conversation Thread</h3><span className="text-[10px] text-gray-500 ml-auto">{messages.length} messages</span></div><div className="p-5 space-y-4 max-h-80 overflow-y-auto">{messages.length === 0 && <p className="text-xs text-gray-500 text-center py-8">No messages yet.</p>}{messages.map((msg, i) => { const isLead = msg.senderType === "LEAD"; const isAgent = msg.senderType === "AGENT"; return <div key={msg.id || i} className={cn("flex gap-2.5", isLead ? "flex-row" : "flex-row-reverse")}><div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 border text-[9px] font-bold", isLead ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : isAgent ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-pink-500/10 border-pink-500/20 text-pink-400")}>{isLead ? "LD" : isAgent ? "AI" : "ME"}</div><div className={cn("px-4 py-2.5 rounded-xl text-sm leading-relaxed border max-w-[80%]", isLead ? "bg-white/[0.02] border-white/5 text-gray-200 rounded-tl-none" : isAgent ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-200 rounded-tr-none" : "bg-pink-600/10 border-pink-500/20 text-pink-200 rounded-tr-none")}><p className="whitespace-pre-wrap">{msg.content}</p><span className="block mt-1 text-[9px] text-gray-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div></div>; })}</div></div>

          <div className="glassmorphism rounded-xl border border-white/5 p-5 space-y-3"><h3 className="text-xs font-bold text-white uppercase tracking-wider">Internal Notes</h3><textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Private notes for this lead..." className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" /><button onClick={() => patchLead({ notes }, "Notes saved")} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg disabled:opacity-60">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Save Notes</button></div>
        </div>
      </div>
    </div>
  );
}
