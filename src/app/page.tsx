"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  GitBranch,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { PremiumMotionBackground, StatusBadge } from "@/components/premium/PremiumMotionBackground";

/* ─── Static data — visual copy only, no real app state ─── */
const PROOF_ITEMS = [
  { label: "Instant lead capture", green: true },
  { label: "Smart AI receptionist", green: true },
  { label: "Professional booking flow", green: false },
  { label: "Owner notified instantly", green: false },
];

const WORKFLOW_STEPS = [
  {
    num: "01",
    icon: MessageSquare,
    iconColor: "rgba(124,58,237,0.15)",
    iconText: "#a78bfa",
    title: "Enquiry received",
    desc: "A prospect messages via WhatsApp, Instagram, Facebook, email, or your website widget. The AI picks it up the moment it arrives.",
    tag: "Any channel",
    tagStyle: "border border-purple-500/20 bg-purple-500/10 text-purple-300",
  },
  {
    num: "02",
    icon: Bot,
    iconColor: "rgba(6,182,212,0.15)",
    iconText: "#67e8f9",
    title: "AI replies instantly",
    desc: "Gemini AI responds with your configured persona, guides prospects through your custom funnel options, and qualifies the lead in real time.",
    tag: "< 2 sec response",
    tagStyle: "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  },
  {
    num: "03",
    icon: Calendar,
    iconColor: "rgba(236,72,153,0.15)",
    iconText: "#f9a8d4",
    title: "Appointment booked",
    desc: "The prospect picks from your real configured time slots. The appointment is created in your system and their details are captured immediately.",
    tag: "Real slots only",
    tagStyle: "border border-pink-500/20 bg-pink-500/10 text-pink-300",
  },
  {
    num: "04",
    icon: CheckCircle2,
    iconColor: "rgba(16,185,129,0.15)",
    iconText: "#6ee7b7",
    title: "Owner notified",
    desc: "You receive a notification with full lead details — name, contact, service requested, requirements, and the confirmed booking time.",
    tag: "Instant alert",
    tagStyle: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
];

const FEATURE_CARDS = [
  {
    icon: Bot,
    iconBg: "rgba(124,58,237,0.15)",
    iconColor: "#a78bfa",
    name: "Configurable AI Agent",
    text: "Set your AI's name, persona, tone, and system prompt. Define your funnel options and let the AI guide prospects through your exact service menu — exactly as you'd do it yourself.",
  },
  {
    icon: Inbox,
    iconBg: "rgba(6,182,212,0.15)",
    iconColor: "#67e8f9",
    name: "Unified Inbox",
    text: "Every conversation from every channel in one place. See the full AI conversation history, step in manually when needed, and track lead status without switching apps.",
  },
  {
    icon: Users,
    iconBg: "rgba(236,72,153,0.15)",
    iconColor: "#f9a8d4",
    name: "Lead Qualification",
    text: "Every lead gets scored and categorised. The AI captures service need, budget, timeline, requirements, and contact info — creating a full lead profile automatically.",
  },
  {
    icon: GitBranch,
    iconBg: "rgba(245,158,11,0.15)",
    iconColor: "#fcd34d",
    name: "Option-Based Booking Funnel",
    text: "Build multi-page funnel flows with service options, sub-options, and final actions. Prospects pick their path and land exactly where they should.",
  },
];

const CHANNELS = [
  { label: "WhatsApp", dot: "#25D366" },
  { label: "Instagram DM", dot: "#E1306C" },
  { label: "Facebook Messenger", dot: "#1877F2" },
  { label: "Email", dot: "#ea4335" },
  { label: "Website Widget", dot: "#7c3aed" },
  { label: "Booking Funnel", dot: "#06b6d4" },
  { label: "Lead Form", dot: "#f59e0b" },
];

/* ─── Dashboard Showcase ─── */
function DashboardShowcase() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || reduceMotion) return;
    const parent = wrap.parentElement;
    if (!parent) return;
    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / rect.height) * 9;
      const ry = ((e.clientX - cx) / rect.width) * -7;
      wrap.style.transform = `perspective(1200px) rotateX(${6 + rx}deg) rotateY(${-2 + ry}deg)`;
    };
    const onLeave = () => {
      wrap.style.transform = "perspective(1200px) rotateX(12deg) rotateY(-2deg)";
    };
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [reduceMotion]);

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-24">
      {/* outer tilt wrapper */}
      <div
        ref={wrapRef}
        style={{
          transform: "perspective(1200px) rotateX(12deg) rotateY(-2deg)",
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        {/* main card */}
        <div
          className="overflow-hidden rounded-3xl border border-white/10"
          style={{
            background: "linear-gradient(160deg, rgba(20,22,36,0.96) 0%, rgba(13,16,24,0.99) 100%)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.05), 0 40px 90px rgba(0,0,0,0.72), 0 0 120px rgba(124,58,237,0.14), 0 0 220px rgba(236,72,153,0.07)",
          }}
        >
          {/* browser topbar */}
          <div className="flex items-center gap-3 border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffc32d]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#29c940]" />
            </div>
            <div className="flex-1 rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 font-mono text-[11px] text-white/30">
              app.ai-client-closing.com/dashboard
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                style={{ animation: "draftly-pulse-dot 1.5s ease-in-out infinite" }}
              />
              AI live
            </div>
          </div>

          {/* body grid */}
          <div className="grid" style={{ gridTemplateColumns: "220px 1fr", minHeight: 480 }}>
            {/* sidebar */}
            <div className="border-r border-white/[0.06] bg-black/20 p-5">
              {/* logo */}
              <div className="mb-6 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-600 to-pink-500">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-display text-sm font-bold text-white">AI Client Closing</span>
              </div>
              {/* nav items */}
              <div className="space-y-0.5">
                {[
                  { icon: LayoutDashboard, label: "Dashboard", active: true },
                  { icon: Inbox, label: "Inbox", badge: "4" },
                  { icon: Users, label: "Leads" },
                  { icon: Bot, label: "AI Receptionist" },
                  { icon: Calendar, label: "Appointments" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] font-medium ${
                      item.active
                        ? "bg-violet-500/20 text-violet-300"
                        : "text-white/40 hover:text-white/60"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto rounded-full border border-pink-400/30 bg-pink-500/15 px-1.5 py-0.5 text-[9px] font-bold text-pink-300">
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* main content */}
            <div className="overflow-hidden p-5">
              <div className="mb-4">
                <p className="font-display text-[15px] font-bold text-white">Command Center</p>
                <p className="text-[11px] text-white/35">Live workspace data — leads, bookings, and pipeline</p>
              </div>

              {/* stat row */}
              <div className="mb-4 grid grid-cols-4 gap-2.5">
                {[
                  { label: "Today's bookings", value: "—", trend: "Live" },
                  { label: "New enquiries",    value: "—", trend: "Active" },
                  { label: "Upcoming appts",   value: "—", trend: "Confirmed" },
                  { label: "Closed / Won",     value: "—", trend: "This month" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3"
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30">
                      {s.label}
                    </p>
                    <p className="mt-1.5 font-display text-2xl font-black text-white">{s.value}</p>
                    <p className="mt-1 text-[9px] font-semibold text-emerald-400/80">{s.trend}</p>
                  </div>
                ))}
              </div>

              {/* lead rows — visual illustration only */}
              <div className="space-y-2">
                {[
                  { initials: "SJ", grad: "from-violet-600 to-purple-500", source: "WhatsApp · Wedding enquiry",      status: "Booked",    badgeCls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
                  { initials: "MT", grad: "from-cyan-600 to-sky-500",      source: "Instagram · Photography DM",       status: "Qualified", badgeCls: "bg-amber-500/15  text-amber-300  border-amber-400/30"  },
                  { initials: "RP", grad: "from-pink-600 to-rose-500",     source: "Website widget · Coaching enquiry", status: "New",       badgeCls: "bg-violet-500/15 text-violet-300 border-violet-400/30" },
                  { initials: "DK", grad: "from-emerald-600 to-teal-500",  source: "Facebook · Salon booking",         status: "Booked",    badgeCls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
                ].map((lead) => (
                  <div
                    key={lead.initials}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 transition hover:border-violet-400/20 hover:bg-violet-500/[0.06]"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br text-[11px] font-bold text-white ${lead.grad}`}
                    >
                      {lead.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-white/80">{lead.source}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${lead.badgeCls}`}
                    >
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Floating AI chat card ── */}
        <motion.div
          className="absolute -right-16 top-16 w-60 rounded-2xl border border-white/10 p-3.5 backdrop-blur-2xl"
          style={{
            background: "rgba(13,16,24,0.95)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.65), 0 0 40px rgba(124,58,237,0.2)",
            transformStyle: "preserve-3d",
            transform: "translateZ(40px)",
          }}
          animate={reduceMotion ? {} : { y: [0, -14, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-pink-500 shrink-0">
              <Bot className="h-3 w-3 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white">AI Receptionist</p>
              <p className="text-[10px] text-white/35">Responding instantly</p>
            </div>
          </div>
          <div className="mb-1.5 ml-4 rounded-xl bg-white/[0.06] px-2.5 py-2 text-[11px] leading-relaxed text-white/60">
            Hi, I need help with pricing and availability
          </div>
          <div
            className="rounded-xl border border-violet-400/25 bg-violet-500/15 px-2.5 py-2 text-[11px] leading-relaxed text-slate-200"
          >
            Hi! I&apos;d love to help. Which package are you interested in — full-day, half-day, or a custom option?
          </div>
          <TypingIndicator />
        </motion.div>

        {/* ── Floating owner notification card ── */}
        <motion.div
          className="absolute -left-20 bottom-16 w-56 rounded-2xl border border-emerald-400/20 p-3 backdrop-blur-2xl"
          style={{
            background: "rgba(13,16,24,0.95)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(16,185,129,0.12)",
            transformStyle: "preserve-3d",
            transform: "translateZ(30px)",
          }}
          animate={reduceMotion ? {} : { y: [0, 12, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/15">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            </div>
            <p className="text-[11px] font-bold text-emerald-300">New booking confirmed</p>
          </div>
          <p className="text-[11px] leading-relaxed text-white/50">
            A new appointment has been created and saved to your workspace.
          </p>
          <p className="mt-1.5 text-[10px] text-white/25">Just now · via AI closing flow</p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Typing indicator ─── */
function TypingIndicator() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 3000);
    return () => clearInterval(id);
  }, []);
  if (!visible) return null;
  return (
    <div className="mt-1.5 flex items-center gap-1 px-1 py-1">
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-violet-400/60"
          style={{ animation: `draftly-typing 1.2s ${delay}s ease-in-out infinite` }}
        />
      ))}
    </div>
  );
}

/* ─── Inbox Preview ─── */
function InboxPreview() {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-white/[0.08]"
      style={{
        background: "rgba(10,12,20,0.96)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 80px rgba(124,58,237,0.07)",
      }}
    >
      <div className="grid" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* conversation list */}
        <div className="border-r border-white/[0.06] py-4">
          <div className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-[11px] text-white/25">
            <Inbox className="h-3 w-3 shrink-0" />
            Search conversations
          </div>
          <div className="mb-2 flex gap-1 px-3">
            {["All", "Enquiries", "Booked"].map((tab, i) => (
              <button
                key={tab}
                className={`rounded-lg px-3 py-1 text-[11px] font-semibold ${
                  i === 0 ? "bg-violet-500/20 text-violet-300" : "text-white/35"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {[
            { initials: "SJ", grad: "from-violet-600 to-purple-500", name: "Sarah Johnson",  preview: "AI: Would you like the full-day package?",  time: "2m",  unread: 2,  active: true },
            { initials: "MT", grad: "from-cyan-600   to-sky-500",    name: "Marcus Thompson", preview: "Booking confirmed for Wednesday ✓",           time: "18m", unread: 0,  active: false },
            { initials: "RP", grad: "from-pink-600   to-rose-500",   name: "Rachel Patel",    preview: "AI: What's your timeline for this project?", time: "42m", unread: 1,  active: false },
            { initials: "DK", grad: "from-emerald-600 to-teal-500", name: "David Kim",       preview: "Thanks for confirming my slot!",              time: "1hr", unread: 0,  active: false },
          ].map((c) => (
            <div
              key={c.initials}
              className={`flex cursor-pointer items-start gap-2.5 border-l-2 px-3 py-2.5 transition ${
                c.active
                  ? "border-violet-500/60 bg-violet-500/[0.08]"
                  : "border-transparent hover:bg-white/[0.03]"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-bold text-white ${c.grad}`}
              >
                {c.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-white/80">{c.name}</p>
                <p className="truncate text-[10px] text-white/35">{c.preview}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="text-[10px] text-white/25">{c.time}</p>
                {c.unread > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500/80 text-[9px] font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* chat panel */}
        <div className="flex min-h-[460px] flex-col">
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-black/20 px-5 py-3.5">
            <div>
              <p className="text-[13px] font-bold text-white">Sarah Johnson</p>
              <p className="text-[11px] text-white/35">WhatsApp · Service enquiry</p>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/50 hover:text-white/80">
                View lead
              </button>
              <button className="rounded-lg border border-violet-400/35 bg-violet-500/15 px-3 py-1.5 text-[11px] font-semibold text-violet-300">
                Book appointment
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5">
            {/* user message */}
            <div className="flex max-w-[72%] flex-col">
              <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-3.5 py-2.5 text-[12px] leading-relaxed text-white/70">
                Hi, I need help with pricing and availability for my project
              </div>
              <p className="mt-1 text-[10px] text-white/25">via WhatsApp</p>
            </div>
            {/* AI reply */}
            <div className="flex max-w-[72%] flex-col self-end">
              <div
                className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[12px] leading-relaxed text-white"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.55), rgba(236,72,153,0.35))",
                  border: "1px solid rgba(124,58,237,0.3)",
                }}
              >
                Hi! I&apos;d love to help. We have a few packages — are you looking for our full-service, standard, or budget option? Each covers different scopes and timelines.
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="rounded border border-violet-400/25 bg-violet-500/15 px-1.5 text-[9px] font-bold text-violet-300">
                  AI
                </span>
                <p className="text-[10px] text-white/25">AI Client Closing Assistant</p>
              </div>
            </div>
            {/* follow-up user */}
            <div className="flex max-w-[72%] flex-col">
              <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] px-3.5 py-2.5 text-[12px] leading-relaxed text-white/70">
                Full-service please! What&apos;s the process?
              </div>
              <p className="mt-1 text-[10px] text-white/25">via WhatsApp</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 border-t border-white/[0.06] px-4 py-3.5">
            <div className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[12px] text-white/25">
              Reply manually or let AI continue…
            </div>
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-[0_4px_16px_rgba(124,58,237,0.4)]"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}
            >
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Scroll reveal hook ─── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".draftly-reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.1 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ─── Main page ─── */
export default function LandingPage() {
  useReveal();

  return (
    <PremiumMotionBackground>
      <main className="min-h-screen text-white">

        {/* ── Nav ── */}
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6"
        >
          <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-[1.4rem] border border-white/10 bg-[rgba(13,16,24,0.65)] px-5 py-3 shadow-[0_8px_48px_rgba(0,0,0,0.45)] backdrop-blur-[28px]">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-gradient-to-br from-violet-600 via-pink-500 to-fuchsia-500 shadow-[0_0_28px_rgba(124,58,237,0.5)]">
                <Sparkles className="h-4.5 w-4.5 text-white" />
                <span
                  className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400"
                  style={{
                    boxShadow: "0 0 10px rgba(52,211,153,0.9)",
                    animation: "draftly-pulse-dot 2s ease-in-out infinite",
                  }}
                />
              </div>
              <div>
                <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  AI Receptionist
                </p>
                <span className="font-display text-[17px] font-extrabold text-white leading-none">
                  AI Client Closing
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/65 transition hover:bg-white/[0.09] hover:text-white sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2 text-sm font-bold text-white shadow-[0_8px_28px_rgba(124,58,237,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(124,58,237,0.55)]"
              >
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </nav>
        </motion.header>

        {/* ── Hero ── */}
        <section className="flex min-h-screen flex-col items-center justify-center px-4 pb-12 pt-32 text-center sm:px-6">
          {/* eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-violet-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.09em] text-violet-300 backdrop-blur-sm"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
              style={{
                boxShadow: "0 0 8px rgba(52,211,153,0.9)",
                animation: "draftly-pulse-dot 1.5s ease-in-out infinite",
              }}
            />
            Built for real lead capture and appointments
          </motion.div>

          {/* headline */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <p
              className="mb-3 text-3xl text-pink-200/75 sm:text-4xl"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontStyle: "italic" }}
            >
              Capture. Qualify. Book.
            </p>
            <h1
              className="max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.03em] text-white sm:text-7xl lg:text-8xl"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Your AI closes clients{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#a78bfa 0%,#f472b6 40%,#38bdf8 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                while you sleep.
              </span>
            </h1>
          </motion.div>

          {/* description */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-300/65"
          >
            An intelligent AI receptionist that handles every enquiry from WhatsApp, Instagram,
            Facebook, email, and your website — instantly replying, qualifying leads, and booking
            appointments into your calendar.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 px-8 py-4 text-[15px] font-bold text-white shadow-[0_12px_40px_rgba(124,58,237,0.42)] transition hover:-translate-y-1 hover:shadow-[0_20px_56px_rgba(124,58,237,0.58)]"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Create your workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-7 py-4 text-[15px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.1]"
            >
              <Inbox className="h-4 w-4" /> Owner login
            </Link>
          </motion.div>

          {/* proof badges */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="mt-8 flex flex-wrap justify-center gap-2"
          >
            {PROOF_ITEMS.map((item) => (
              <StatusBadge key={item.label} tone={item.green ? "emerald" : "violet"}>
                {item.label}
              </StatusBadge>
            ))}
          </motion.div>
        </section>

        {/* ── 3D Dashboard ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
        >
          <DashboardShowcase />
        </motion.div>

        {/* ── Workflow ── */}
        <section id="workflow" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="draftly-reveal mb-3 flex items-center gap-3">
              <span className="h-px w-6 bg-violet-500/60" />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-400">
                The flow
              </p>
            </div>
            <h2
              className="draftly-reveal mb-5 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              From first message to booked appointment.
            </h2>
            <p className="draftly-reveal draftly-reveal-d1 mb-14 max-w-xl text-lg leading-relaxed text-white/50">
              Your AI agent handles every step so you never miss a lead, no matter the channel or
              time of day.
            </p>

            <div className="draftly-reveal draftly-reveal-d2 grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] sm:grid-cols-2 xl:grid-cols-4" style={{ background: "rgba(255,255,255,0.04)" }}>
              {WORKFLOW_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="group relative overflow-hidden bg-[#06070f] p-7 transition hover:bg-violet-950/30"
                  >
                    <span
                      className="absolute right-4 top-3 font-display text-5xl font-black leading-none tracking-[-0.04em] text-white/[0.03]"
                      style={{ fontFamily: "'Syne',sans-serif" }}
                    >
                      {step.num}
                    </span>
                    <div
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-[13px]"
                      style={{ background: step.iconColor, color: step.iconText }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3
                      className="mb-2 text-[17px] font-bold text-white"
                      style={{ fontFamily: "'Syne',sans-serif" }}
                    >
                      {step.title}
                    </h3>
                    <p className="mb-4 text-[13px] leading-relaxed text-white/45">{step.desc}</p>
                    <span className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-semibold ${step.tagStyle}`}>
                      {step.tag}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="draftly-reveal mb-3 flex items-center gap-3">
              <span className="h-px w-6 bg-violet-500/60" />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-400">
                Built for service businesses
              </p>
            </div>
            <h2
              className="draftly-reveal mb-14 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Everything your business needs to close clients.
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              {FEATURE_CARDS.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.name}
                    className={`draftly-reveal group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-7 transition hover:-translate-y-1 hover:border-violet-400/25 ${
                      i === 0 ? "draftly-reveal" : `draftly-reveal draftly-reveal-d${Math.min(i, 3) as 1 | 2 | 3}`
                    }`}
                  >
                    {/* hover glow */}
                    <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-500/[0.06] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                    <div
                      className="mb-5 flex h-12 w-12 items-center justify-center rounded-[14px]"
                      style={{ background: card.iconBg, color: card.iconColor }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3
                      className="mb-3 text-xl font-bold text-white"
                      style={{ fontFamily: "'Syne',sans-serif" }}
                    >
                      {card.name}
                    </h3>
                    <p className="text-[14px] leading-relaxed text-white/45">{card.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Channels ── */}
        <section
          className="px-4 py-24 sm:px-6"
          style={{
            background: "linear-gradient(180deg,transparent 0%,rgba(124,58,237,0.04) 45%,transparent 100%)",
          }}
        >
          <div className="mx-auto max-w-6xl text-center">
            <div className="draftly-reveal mb-3 flex items-center justify-center gap-3">
              <span className="h-px w-6 bg-violet-500/60" />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-400">
                Channels
              </p>
              <span className="h-px w-6 bg-violet-500/60" />
            </div>
            <h2
              className="draftly-reveal mx-auto mb-5 max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Every channel your customers already use.
            </h2>
            <p className="draftly-reveal draftly-reveal-d1 mx-auto mb-12 max-w-lg text-lg leading-relaxed text-white/50">
              Your AI receptionist meets prospects where they are — no new apps required on their end.
            </p>
            <div className="draftly-reveal draftly-reveal-d2 flex flex-wrap justify-center gap-3">
              {CHANNELS.map((ch) => (
                <div
                  key={ch.label}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/65 backdrop-blur-sm transition hover:-translate-y-1 hover:border-white/[0.15] hover:text-white"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: ch.dot, boxShadow: `0 0 8px ${ch.dot}80` }}
                  />
                  {ch.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Inbox preview ── */}
        <section id="inbox" className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="draftly-reveal mb-3 flex items-center gap-3">
              <span className="h-px w-6 bg-violet-500/60" />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-400">
                Unified inbox
              </p>
            </div>
            <h2
              className="draftly-reveal mb-4 max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Every conversation. One command centre.
            </h2>
            <p className="draftly-reveal draftly-reveal-d1 mb-12 max-w-lg text-lg leading-relaxed text-white/50">
              Watch your AI handle the full conversation — then step in manually whenever you want.
              Full message history, lead context, and actions in one panel.
            </p>
            <div className="draftly-reveal draftly-reveal-d2">
              <InboxPreview />
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative px-4 py-28 text-center sm:px-6">
          {/* ambient glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 600,
              height: 600,
              background: "radial-gradient(circle,rgba(124,58,237,0.14) 0%,transparent 68%)",
            }}
          />
          <div className="relative">
            <div className="draftly-reveal mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-violet-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.09em] text-violet-300">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  style={{ animation: "draftly-pulse-dot 1.5s ease-in-out infinite", boxShadow: "0 0 8px rgba(52,211,153,0.9)" }}
                />
                Ready for real business enquiries
              </span>
            </div>
            <h2
              className="draftly-reveal mx-auto mb-4 max-w-3xl text-5xl font-black leading-[0.96] tracking-tight text-white sm:text-7xl"
              style={{ fontFamily: "'Syne',sans-serif" }}
            >
              Stop missing leads.{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#a78bfa,#f472b6,#38bdf8)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Start closing them.
              </span>
            </h2>
            <p
              className="draftly-reveal draftly-reveal-d1 mx-auto mb-10 text-2xl text-white/35"
              style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontStyle: "italic" }}
            >
              Your AI receptionist is ready to go live.
            </p>
            <div className="draftly-reveal draftly-reveal-d2 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 px-10 py-5 text-base font-bold text-white shadow-[0_16px_48px_rgba(124,58,237,0.42)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(124,58,237,0.58)]"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                Create your workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-8 py-5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.1]"
              >
                <Inbox className="h-4 w-4" /> Owner login
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.06] px-4 py-10 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-600 to-pink-500">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span
                className="text-[15px] font-bold text-white/50"
                style={{ fontFamily: "'Syne',sans-serif" }}
              >
                AI Client Closing Agent
              </span>
            </div>
            <nav className="flex gap-6">
              {[
                { label: "Sign in", href: "/sign-in" },
                { label: "Get started", href: "/sign-up" },
                { label: "How it works", href: "#workflow" },
                { label: "Inbox", href: "#inbox" },
              ].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13px] text-white/30 transition hover:text-white/65"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="text-[12px] text-white/20">
              AI client closing system · AI client closing and booking system
            </p>
          </div>
        </footer>
      </main>
    </PremiumMotionBackground>
  );
}