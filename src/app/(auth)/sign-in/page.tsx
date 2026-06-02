"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, KeyRound, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      const syncRes = await fetch("/api/auth/sync-current-user", { method: "POST" });
      const syncData = await syncRes.json();
      if (!syncRes.ok) throw new Error(syncData.error || "Could not open your workspace.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("We could not sign you in. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#070b14]/88 p-7 shadow-2xl">
      <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-56 w-56 rounded-full bg-cyan-500/18 blur-3xl" />
      <div className="relative">
        <div className="mb-7 text-center">
          <p className="signature-font mb-2 text-3xl text-amber-200/90">Welcome back</p>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/25 bg-indigo-500/12 shadow-[0_0_50px_rgba(99,102,241,.15)]">
            <KeyRound className="h-7 w-7 text-indigo-200" />
          </div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" /> Owner workspace
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">Sign in to your workspace</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">Manage prospects, bookings, and your AI receptionist flow.</p>
        </div>
        <form onSubmit={handleSignIn} className="space-y-4">
          <label className="block space-y-2 text-left">
            <span className="text-xs font-black uppercase tracking-wider text-white/40">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" className="w-full rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-white/22 focus:border-indigo-300/50 focus:bg-white/[.08]" />
          </label>
          <label className="block space-y-2 text-left">
            <span className="text-xs font-black uppercase tracking-wider text-white/40">Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="Your password" className="w-full rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-white/22 focus:border-indigo-300/50 focus:bg-white/[.08]" />
          </label>
          {error && <div className="flex gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-left text-xs font-semibold text-red-100"><AlertCircle className="h-4 w-4 shrink-0" /><p>{error}</p></div>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3.5 text-sm font-black text-white shadow-[0_18px_45px_rgba(99,102,241,.25)] transition hover:-translate-y-0.5 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-white/40">New here? <Link href="/sign-up" className="font-black text-indigo-200 hover:text-indigo-100">Create an account</Link></p>
      </div>
    </div>
  );
}
