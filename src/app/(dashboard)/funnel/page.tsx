"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, Clipboard, Copy, ExternalLink, Loader2, MessageCircle, Plus, Trash2, Zap } from "lucide-react";

type Slot = { id: string; title: string; startsAt: string; endsAt: string; timezone: string; isActive: boolean };
type Workspace = { id: string; name: string };

function formatInputDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatSlot(slot: Slot) {
  const start = new Date(slot.startsAt);
  const end = new Date(slot.endsAt);
  return `${slot.title} — ${start.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} to ${end.toLocaleTimeString([], { timeStyle: "short" })}`;
}

export default function BookingFunnelSetupPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [form, setForm] = useState({
    title: "Consultation slot",
    startsAt: formatInputDate(tomorrow),
    durationMinutes: "30",
    timezone: "Asia/Kolkata",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const workspaceRes = await fetch("/api/workspace/current", { cache: "no-store" });
      const workspaceData = await workspaceRes.json();
      if (!workspaceRes.ok || !workspaceData.workspace?.id) throw new Error(workspaceData.error || "Please sign in first.");
      setWorkspace(workspaceData.workspace);

      const slotsRes = await fetch("/api/bookings/slots", { cache: "no-store" });
      const slotsData = await slotsRes.json();
      if (!slotsRes.ok) throw new Error(slotsData.error || "Failed to load slots.");
      setSlots(slotsData.slots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load booking funnel setup.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const bookingLink = workspace ? `${appUrl}/book/${workspace.id}` : "";
  const widgetScript = workspace ? `<script src="${appUrl}/api/widget.js?workspaceId=${workspace.id}" defer></script>` : "";

  const autoReplyMessage = useMemo(() => {
    if (!bookingLink) return "";
    return `Hi! Thanks for reaching out. Please share your details, choose enquiry or booking, and check available times here: ${bookingLink}`;
  }, [bookingLink]);

  async function copy(value: string, key: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  async function addSlot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const startsAt = new Date(form.startsAt);
      const endsAt = new Date(startsAt.getTime() + Number(form.durationMinutes || 30) * 60 * 1000);
      const res = await fetch("/api/bookings/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          timezone: form.timezone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add slot.");
      setSlots((prev) => [...prev, data.slot].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add slot.");
    } finally {
      setSaving(false);
    }
  }

  async function removeSlot(slotId: string) {
    setError("");
    try {
      const res = await fetch(`/api/bookings/slots/${slotId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove slot.");
      setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove slot.");
    }
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.28),transparent_34%),linear-gradient(135deg,#0f172a,#070b14_58%,#111827)] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-100">
          <Zap className="h-3.5 w-3.5" /> Final funnel system
        </div>
        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
          One AI booking link for every channel.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          Paste this link inside WhatsApp greetings, Instagram auto-replies, Facebook Messenger, Google profile, website buttons, and ads. Every prospect lands in the same AI qualification + booking funnel.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {bookingLink && (
            <Link href={bookingLink} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-200">
              Open booking page <ExternalLink className="h-4 w-4" />
            </Link>
          )}
          <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15">
            Refresh <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">Client-facing link</p>
              <h2 className="mt-2 text-2xl font-black text-white">AI booking link</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">This is the link prospects should receive from every channel auto-reply.</p>
            </div>
            <CalendarCheck className="h-8 w-8 text-emerald-300" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-6 text-slate-200">
            {loading ? "Loading..." : bookingLink || "Sign in and create a workspace to generate your booking link."}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button disabled={!bookingLink} onClick={() => copy(bookingLink, "booking")} className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-400 disabled:opacity-40">
              <Copy className="h-4 w-4" /> {copied === "booking" ? "Copied" : "Copy booking link"}
            </button>
            <button disabled={!widgetScript} onClick={() => copy(widgetScript, "widget")} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-xs font-black text-white hover:bg-white/15 disabled:opacity-40">
              <Clipboard className="h-4 w-4" /> {copied === "widget" ? "Copied" : "Copy website widget"}
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Auto-reply message</p>
          <h2 className="mt-2 text-2xl font-black text-white">Paste this everywhere</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use this in WhatsApp greeting, WhatsApp away message, Instagram instant reply, Facebook Messenger instant reply, and saved replies.</p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-200">
            {autoReplyMessage || "Booking link will appear after workspace loads."}
          </div>
          <button disabled={!autoReplyMessage} onClick={() => copy(autoReplyMessage, "reply")} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-400 disabled:opacity-40">
            <Copy className="h-4 w-4" /> {copied === "reply" ? "Copied" : "Copy auto-reply"}
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        <form onSubmit={addSlot} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Manual slots first</p>
          <h2 className="mt-2 text-2xl font-black text-white">Add booking slots</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Use manual slots now. Google Calendar can be connected later after the funnel works.</p>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-bold text-slate-300">
              Slot title
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" />
            </label>
            <label className="block text-sm font-bold text-slate-300">
              Start time
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" />
            </label>
            <label className="block text-sm font-bold text-slate-300">
              Duration minutes
              <input value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" />
            </label>
            <label className="block text-sm font-bold text-slate-300">
              Timezone
              <input value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none" />
            </label>
          </div>

          <button disabled={saving} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-200 disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Adding..." : "Add slot"}
          </button>
        </form>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Shown publicly</p>
              <h2 className="mt-2 text-2xl font-black text-white">Available booking slots</h2>
            </div>
            <MessageCircle className="h-7 w-7 text-indigo-300" />
          </div>

          <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            {loading ? (
              <div className="p-5 text-sm text-slate-400">Loading slots...</div>
            ) : slots.filter((slot) => slot.isActive).length === 0 ? (
              <div className="p-6 text-sm leading-6 text-slate-400">
                No slots yet. Add at least one real available slot before sharing the AI booking link.
              </div>
            ) : (
              slots.filter((slot) => slot.isActive).map((slot) => (
                <div key={slot.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-black text-white">{formatSlot(slot)}</p>
                    <p className="mt-1 text-xs text-slate-500">{slot.timezone}</p>
                  </div>
                  <button onClick={() => removeSlot(slot.id)} className="rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-300 hover:bg-red-500/20">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
            <CheckCircle2 className="mr-2 inline h-4 w-4" /> When a prospect selects a slot, the app saves the lead, creates an appointment, emails the owner/lead if Resend is configured, and shows the AI qualification result.
          </div>
        </div>
      </section>
    </div>
  );
}
