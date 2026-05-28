"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Clipboard, Code, ExternalLink, Globe, KeyRound, Mail, Phone, RefreshCw, ShieldAlert } from "lucide-react";

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" /></svg>; }
function FacebookIcon({ className = "h-5 w-5" }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.2 8.4V6.9c0-.7.5-.9.9-.9h2V3h-2.8C11.5 3 10 4.7 10 6.6v1.8H7.8v3.2H10V21h3.4v-9.4h2.8l.4-3.2h-3.2z" /></svg>; }

type Workspace = { id: string; name: string };
const cards = [
  { id: "website_widget", name: "Website Widget", status: "active", icon: Code, description: "Embed the website lead widget for your current workspace." },
  { id: "email", name: "Email", status: "setup", icon: Mail, description: "Requires RESEND_API_KEY and a verified sender email/domain." },
  { id: "whatsapp", name: "WhatsApp Business", status: "setup", icon: Phone, description: "Requires Meta app, phone number ID, access token, and webhook URL." },
  { id: "instagram", name: "Instagram DM", status: "setup", icon: InstagramIcon, description: "Requires Meta permissions, connected Instagram professional account, and webhook URL." },
  { id: "facebook", name: "Facebook Messenger", status: "setup", icon: FacebookIcon, description: "Requires Meta app, page permissions, access token, and webhook URL." },
  { id: "calendar", name: "Google Calendar", status: "setup", icon: Calendar, description: "Use a booking link now; OAuth calendar scheduling can be connected next." },
];

export default function IntegrationsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  async function loadWorkspace() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workspace/current", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.workspace?.id) throw new Error(data.error || "Please sign in to load integrations.");
      setWorkspace(data.workspace);
    } catch (err) {
      setWorkspace(null);
      setError(err instanceof Error ? err.message : "Failed to load workspace.");
    } finally { setLoading(false); }
  }

  useEffect(() => { setOrigin(window.location.origin); loadWorkspace(); }, []);

  const embedCode = useMemo(() => workspace && origin ? `<script src="${origin}/api/widget.js?workspaceId=${workspace.id}" defer></script>` : "Sign in and create a workspace to generate your widget code.", [workspace, origin]);
  const leadFormUrl = workspace && origin ? `${origin}/lead-form/${workspace.id}` : "";

  async function copy(text: string) {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap"><div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2"><Globe className="h-7 w-7 text-indigo-400" /> Integrations</h1><p className="text-xs text-gray-400 mt-1">{workspace ? `${workspace.name} integration setup` : "Loading workspace integrations"}</p></div><button onClick={loadWorkspace} className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button></div>
      {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((card) => <div key={card.id} className="glassmorphism rounded-xl border border-white/5 p-5 space-y-4"><div className="flex items-start justify-between gap-4"><div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><card.icon className="h-5 w-5 text-indigo-300" /></div><span className={card.status === "active" ? "text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full" : "text-[10px] font-bold text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-full"}>{card.status === "active" ? "ACTIVE" : "SETUP REQUIRED"}</span></div><div><h2 className="font-bold text-white">{card.name}</h2><p className="text-xs text-gray-400 mt-1 leading-relaxed">{card.description}</p></div></div>)}
      </div>
      <div className="glassmorphism rounded-xl border border-white/5 p-5 space-y-3"><h2 className="text-sm font-bold text-white flex items-center gap-2"><Code className="h-4 w-4 text-indigo-400" /> Website Widget Embed Code</h2><pre className="bg-black/30 border border-white/10 rounded-lg p-4 text-xs text-indigo-100 overflow-x-auto">{loading ? "Loading..." : embedCode}</pre><div className="flex flex-wrap gap-2"><button onClick={() => copy(embedCode)} disabled={!workspace} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white text-xs font-bold"><Clipboard className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy embed"}</button>{leadFormUrl && <Link href={leadFormUrl} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">Open lead form <ExternalLink className="h-3.5 w-3.5" /></Link>}</div><p className="text-xs text-gray-500">This widget posts leads into the signed-in workspace only.</p></div>
      <div className="glassmorphism rounded-xl border border-white/5 p-5 space-y-3"><h2 className="text-sm font-bold text-white flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-yellow-400" /> Required Environment Setup</h2><div className="grid md:grid-cols-2 gap-3 text-xs text-gray-300"><p><KeyRound className="h-3.5 w-3.5 inline mr-1 text-indigo-400" /> GEMINI_API_KEY for AI replies.</p><p><KeyRound className="h-3.5 w-3.5 inline mr-1 text-indigo-400" /> RESEND_API_KEY for email notifications.</p><p><KeyRound className="h-3.5 w-3.5 inline mr-1 text-indigo-400" /> WHATSAPP_VERIFY_TOKEN / access token for webhooks.</p><p><CheckCircle2 className="h-3.5 w-3.5 inline mr-1 text-emerald-400" /> DATABASE_URL + DIRECT_URL are required for live CRM data.</p></div></div>
    </div>
  );
}
