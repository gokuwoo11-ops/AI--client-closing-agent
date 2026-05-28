"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export default function PublicLeadFormPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();

  const formElement = e.currentTarget;

  setLoading(true);
  setError("");
  setResult(null);

  const form = new FormData(formElement);
  

  const payload = {
    workspaceId,
    name: form.get("name"),
    email: form.get("email"),
    phone: form.get("phone"),
    serviceNeeded: form.get("serviceNeeded"),
    budget: form.get("budget"),
    timeline: form.get("timeline"),
    requirements: form.get("message"),
    source: "website",
  };

  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to submit inquiry");
    }

    setResult(data.result || data);
    formElement.reset();
  } catch (err: any) {
    setError(err.message || "Failed to submit inquiry");
  } finally {
    setLoading(false);
  }
}

  return <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-6"><div className="w-full max-w-2xl bg-[#0c101d] border border-white/10 rounded-2xl p-6 shadow-2xl"><div className="mb-6"><div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-3"><Sparkles className="h-3.5 w-3.5" /> AI Client Closing Agent</div><h1 className="text-2xl font-extrabold">Tell us what you need</h1><p className="text-sm text-gray-400 mt-1">Submit your inquiry and it will route directly into the business CRM/inbox.</p></div><form onSubmit={submit} className="grid sm:grid-cols-2 gap-4"><input name="name" required placeholder="Your name" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500" /><input name="email" type="email" placeholder="Email" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500" /><input name="phone" placeholder="WhatsApp / phone" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500" /><input name="serviceNeeded" placeholder="Service needed" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500" /><input name="budget" placeholder="Budget" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500" /><input name="timeline" placeholder="Timeline" className="px-4 py-3 rounded-xl bg-black/20 border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500" /><textarea name="message" required placeholder="What are you looking for?" rows={5} className="sm:col-span-2 px-4 py-3 rounded-xl bg-black/20 border border-white/10 outline-none focus:ring-1 focus:ring-indigo-500" /><button disabled={loading} className="sm:col-span-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold flex items-center justify-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Submit inquiry <ArrowRight className="h-4 w-4" /></>}</button></form>{error && <p className="mt-4 text-sm text-red-400">{error}</p>}{result && <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200"><p className="font-bold flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Inquiry captured</p>{result.reply ? <p className="text-sm mt-2 whitespace-pre-wrap">{result.reply}</p> : <p className="text-sm mt-2">Your inquiry was saved. The team will follow up.</p>}{result.mode === "setup_required" && <p className="text-xs mt-2 text-yellow-200">AI reply generation is not configured yet.</p>}</div>}</div></main>;
}
