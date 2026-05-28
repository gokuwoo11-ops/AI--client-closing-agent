"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, MessageSquare } from "lucide-react";

const channels = ["whatsapp", "instagram", "facebook", "email", "website", "manual"];
type Workspace = { id: string; name: string };

export default function IntakePage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const res = await fetch("/api/workspace/current", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.workspace?.id) throw new Error(data.error || "Please sign in to load your workspace.");
        setWorkspace(data.workspace);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workspace.");
      } finally { setLoadingWorkspace(false); }
    }
    loadWorkspace();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!workspace?.id) { setError("Workspace is not loaded yet."); return; }
    const formElement = e.currentTarget;
    setLoading(true);
    setError("");
    setResult(null);
    const form = new FormData(formElement);
    const payload = {
      workspaceId: workspace.id,
      channel: form.get("channel"),
      senderName: form.get("senderName"),
      senderEmail: form.get("senderEmail"),
      senderPhone: form.get("senderPhone"),
      serviceNeeded: form.get("serviceNeeded"),
      budget: form.get("budget"),
      timeline: form.get("timeline"),
      messageText: form.get("messageText"),
    };
    try {
      const res = await fetch("/api/inbound/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to ingest message");
      setResult(data);
      formElement.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ingest message");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><MessageSquare className="h-7 w-7 text-indigo-400" /> Message Intake Console</h1><p className="text-xs text-gray-400 mt-1">Capture a real inbound message from any channel and route it into your CRM/inbox.</p></div>
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-xs text-indigo-100">Workspace: {loadingWorkspace ? "Loading..." : workspace?.name || "Not connected"}</div>
      <div className="glassmorphism rounded-2xl border border-white/5 p-6">
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-gray-400 uppercase">Channel</label><select name="channel" className="mt-1 w-full px-4 py-3 rounded-xl bg-[#090d16] border border-white/10 text-white">{channels.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <input name="senderName" required placeholder="Sender name" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
          <input name="senderEmail" type="email" placeholder="Sender email" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
          <input name="senderPhone" placeholder="Sender phone / WhatsApp" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
          <input name="serviceNeeded" placeholder="Service needed" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
          <input name="budget" placeholder="Budget" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
          <input name="timeline" placeholder="Timeline" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
          <textarea name="messageText" required placeholder="Incoming message text" rows={5} className="sm:col-span-2 px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white" />
          <button disabled={loading || loadingWorkspace || !workspace} className="sm:col-span-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Capture message <ArrowRight className="h-4 w-4" /></>}</button>
        </form>
        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        {result && <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200"><p className="font-bold flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Inbound message captured</p><p className="text-xs mt-2">Lead ID: {result.leadId}</p>{result.mode === "setup_required" && <p className="text-xs mt-2 text-yellow-200">Gemini setup is required before AI replies are generated.</p>}<Link href={`/leads/${result.leadId}`} className="inline-block mt-3 text-sm text-indigo-300 hover:underline">Open lead →</Link></div>}
      </div>
    </div>
  );
}
