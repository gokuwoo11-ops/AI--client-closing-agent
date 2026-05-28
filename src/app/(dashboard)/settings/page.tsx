"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, Code, Copy, Settings } from "lucide-react";

type Workspace = { id: string; name: string };

export default function SettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    async function loadWorkspace() {
      try {
        const res = await fetch("/api/workspace/current", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.workspace?.id) throw new Error(data.error || "Please sign in to load settings.");
        setWorkspace(data.workspace);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings.");
      } finally { setLoading(false); }
    }
    loadWorkspace();
  }, []);

  const embedCode = useMemo(() => workspace && origin ? `<script src="${origin}/api/widget.js?workspaceId=${workspace.id}" defer></script>` : "Sign in to generate your website embed code.", [workspace, origin]);
  const handleCopyCode = () => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return <div className="space-y-8 max-w-5xl mx-auto"><div className="flex items-center justify-between pb-6 border-b border-white/5"><div><h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5"><Settings className="h-7 w-7 text-indigo-400" /> Workspace Settings</h1><p className="text-xs text-gray-400 mt-1">Settings for your signed-in workspace.</p></div></div>{error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}<div className="glassmorphism rounded-xl border border-white/5 p-6 space-y-3"><h2 className="text-sm font-bold text-white uppercase tracking-wider">Current Workspace</h2><p className="text-sm text-gray-300">{loading ? "Loading..." : workspace?.name || "No workspace found"}</p><p className="text-xs text-gray-500 break-all">{workspace?.id || ""}</p></div><div className="glassmorphism rounded-xl border border-white/5 p-6 shadow-xl space-y-5"><h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Code className="h-4.5 w-4.5 text-indigo-400" /> Website Embed Code</h2><p className="text-[11px] text-gray-500 leading-relaxed">Copy and paste this script before the closing body tag on a client website.</p><div className="relative"><pre className="bg-[#05070e] border border-white/5 rounded-lg p-3 text-[10px] text-indigo-300 font-mono overflow-x-auto whitespace-pre leading-relaxed select-all">{embedCode}</pre><button onClick={handleCopyCode} disabled={!workspace} className="absolute top-2 right-2 p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white cursor-pointer active:scale-95 transition-all flex items-center gap-1 text-[9px] font-bold disabled:opacity-50">{copied ? <><CheckCircle className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}</button></div></div><div className="glassmorphism rounded-xl border border-white/5 p-6 text-xs text-gray-300 space-y-2"><p className="font-bold text-white">Production setup checklist</p><p>DATABASE_URL and DIRECT_URL must be configured.</p><p>GEMINI_API_KEY enables real AI replies.</p><p>RESEND_API_KEY enables owner email notifications.</p><p>Meta keys enable live WhatsApp, Instagram, and Facebook webhooks after deployment.</p></div></div>;
}
