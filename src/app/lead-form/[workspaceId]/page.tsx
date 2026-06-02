"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Bot, CalendarCheck, CheckCircle2, Loader2, Mail, Phone, Sparkles, UserRound } from "lucide-react";
import { GlassPanel, PremiumMotionBackground, StatusBadge } from "@/components/premium/PremiumMotionBackground";

type PublicWorkspace = {
  id: string;
  name: string;
  businessProfile?: {
    name?: string | null;
    niche?: string | null;
    location?: string | null;
    services?: Array<{ id: string; name: string; price?: string | null }>;
  } | null;
};

type Result = { reply?: string; mode?: string } | null;

export default function PublicLeadFormPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const [workspace, setWorkspace] = useState<PublicWorkspace | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`/api/public/workspaces/${workspaceId}`, { cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!alive) return;
        setWorkspace(payload?.workspace || null);
      })
      .finally(() => alive && setLoadingWorkspace(false));
    return () => { alive = false; };
  }, [workspaceId]);

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
      website: form.get("website"),
      source: "public_lead_form",
    };

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit enquiry.");
      setResult(data?.result?.ai || data || { reply: "Your enquiry was saved. The team will follow up." });
      formElement.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit enquiry.");
    } finally {
      setLoading(false);
    }
  }

  const businessName = workspace?.businessProfile?.name || workspace?.name || "this business";
  const services = workspace?.businessProfile?.services || [];

  return (
    <PremiumMotionBackground>
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link href={`/book/${workspaceId}`} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.055] px-4 py-2 text-xs font-black text-white/70 hover:bg-white/[.09]">
              <CalendarCheck className="h-4 w-4" /> Book instead
            </Link>
            <StatusBadge tone="emerald">Real CRM capture</StatusBadge>
          </div>

          <section className="grid gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-stretch">
            <GlassPanel className="p-6 sm:p-8">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-indigo-100">
                  <Sparkles className="h-3.5 w-3.5" /> AI Client Closing Agent
                </div>
                <p className="signature-font text-4xl text-amber-200/90">Quick enquiry</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-6xl">Tell {loadingWorkspace ? "the team" : businessName} what you need.</h1>
                <p className="mt-5 text-sm font-medium leading-7 text-white/48">
                  Your enquiry goes directly into the owner dashboard, creates a lead record, stores the message in the inbox, and can notify the team when email is configured.
                </p>
              </motion.div>

              <div className="mt-8 grid gap-3">
                <div className="rounded-3xl border border-white/10 bg-white/[.04] p-4">
                  <div className="flex items-center gap-3"><Bot className="h-5 w-5 text-indigo-200" /><p className="font-black text-white">AI-ready context</p></div>
                  <p className="mt-2 text-xs leading-6 text-white/42">The CRM stores requirement, budget, timeline, and contact details for follow-up.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[.04] p-4">
                  <div className="flex items-center gap-3"><CalendarCheck className="h-5 w-5 text-emerald-200" /><p className="font-black text-white">Want a slot?</p></div>
                  <p className="mt-2 text-xs leading-6 text-white/42">Use the booking funnel link to choose configured real availability.</p>
                </div>
              </div>

              {services.length > 0 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-black uppercase tracking-[.18em] text-white/35">Available services</p>
                  <div className="flex flex-wrap gap-2">
                    {services.slice(0, 6).map((service) => <StatusBadge key={service.id} tone="slate">{service.name}</StatusBadge>)}
                  </div>
                </div>
              )}
            </GlassPanel>

            <GlassPanel className="p-5 sm:p-6">
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                <Field icon={<UserRound className="h-4 w-4" />} label="Name" name="name" required placeholder="Your name" />
                <Field icon={<Mail className="h-4 w-4" />} label="Email" name="email" type="email" placeholder="you@email.com" />
                <Field icon={<Phone className="h-4 w-4" />} label="Phone / WhatsApp" name="phone" placeholder="Your phone number" />
                <Field label="Service needed" name="serviceNeeded" placeholder="What service do you need?" />
                <Field label="Budget" name="budget" placeholder="Your budget range" />
                <Field label="Timeline" name="timeline" placeholder="When do you want to start?" />
                <label className="sm:col-span-2 block text-sm font-black text-white/72">
                  Requirement
                  <textarea name="message" required rows={6} maxLength={1200} placeholder="Share your exact requirement..." className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-medium leading-7 text-white outline-none placeholder:text-white/22 focus:border-indigo-300/50" />
                </label>
                <button disabled={loading} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-4 text-sm font-black text-white shadow-[0_18px_50px_rgba(99,102,241,.28)] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Submit enquiry <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>

              {error && <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-semibold text-red-200">{error}</p>}
              {result && (
                <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100">
                  <p className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5" /> Enquiry captured</p>
                  {result.reply ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-emerald-50/82">{result.reply}</p> : <p className="mt-3 text-sm text-emerald-50/82">Your enquiry was saved. The team will follow up.</p>}
                  {result.mode === "setup_required" && <p className="mt-2 text-xs text-amber-100">AI reply generation is not configured yet.</p>}
                </div>
              )}
            </GlassPanel>
          </section>
        </div>
      </main>
    </PremiumMotionBackground>
  );
}

function Field({ label, icon, name, required, placeholder, type = "text" }: { label: string; icon?: React.ReactNode; name: string; required?: boolean; placeholder: string; type?: string }) {
  return (
    <label className="block text-sm font-black text-white/72">
      {label}
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-3 focus-within:border-indigo-300/50">
        {icon && <span className="text-white/35">{icon}</span>}
        <input name={name} required={required} type={type} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/22" />
      </div>
    </label>
  );
}
