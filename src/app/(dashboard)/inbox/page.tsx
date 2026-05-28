"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, MessageCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const colors: Record<string, string> = { whatsapp: "text-green-300 bg-green-500/10 border-green-500/20", instagram: "text-pink-300 bg-pink-500/10 border-pink-500/20", facebook: "text-sky-300 bg-sky-500/10 border-sky-500/20", email: "text-blue-300 bg-blue-500/10 border-blue-500/20", website: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20", website_widget: "text-purple-300 bg-purple-500/10 border-purple-500/20", manual: "text-gray-300 bg-gray-500/10 border-gray-500/20" };

type Workspace = { id: string; name: string };

export default function InboxPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const workspaceRes = await fetch("/api/workspace/current", { cache: "no-store" });
      const workspaceData = await workspaceRes.json();
      if (!workspaceRes.ok || !workspaceData.workspace?.id) throw new Error(workspaceData.error || "Please sign in to load your inbox.");
      setWorkspace(workspaceData.workspace);
      const leadsRes = await fetch(`/api/leads?workspaceId=${encodeURIComponent(workspaceData.workspace.id)}`, { cache: "no-store" });
      const leadsData = await leadsRes.json();
      if (!leadsRes.ok) throw new Error(leadsData.error || "Failed to load inbox.");
      setLeads(leadsData.leads || []);
    } catch (err) {
      setLeads([]);
      setError(err instanceof Error ? err.message : "Failed to load inbox.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const conversations = useMemo(() => leads.flatMap((lead) => (lead.conversations || []).map((conv: any) => ({ ...conv, lead }))).sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime()), [leads]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap"><div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Inbox className="h-7 w-7 text-indigo-400" /> Unified Inbox</h1><p className="text-xs text-gray-400 mt-1">{workspace ? `${workspace.name} conversations across channels` : "Loading workspace inbox"}</p></div><button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>
      <div className="glassmorphism rounded-xl border border-white/5 overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Loading inbox...</div> : error ? <div className="p-8 text-red-300 text-sm">{error}</div> : conversations.length === 0 ? <div className="p-16 text-center space-y-2"><MessageCircle className="h-12 w-12 mx-auto text-gray-600" /><p className="font-bold text-white">No conversations yet</p><p className="text-xs text-gray-500">Submit a workspace lead form or use Message Intake to capture the first conversation.</p></div> : conversations.map((conv) => { const last = conv.messages?.[conv.messages.length - 1]; return <Link key={conv.id} href={`/leads/${conv.lead.id}`} className="block border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><p className="font-bold text-white">{conv.lead.name || "Unknown Lead"}</p><span className={cn("px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase", colors[conv.channel] || colors.manual)}>{conv.channel}</span><span className="px-2 py-0.5 rounded-md border border-white/10 text-[10px] text-gray-400 uppercase">{conv.lead.status}</span></div><p className="text-sm text-gray-400 mt-2 truncate max-w-2xl">{last?.senderType}: {last?.content || "No messages"}</p></div><span className="text-[11px] text-gray-500 whitespace-nowrap">{last?.createdAt ? new Date(last.createdAt).toLocaleString() : ""}</span></div></Link>; })}
      </div>
    </div>
  );
}
