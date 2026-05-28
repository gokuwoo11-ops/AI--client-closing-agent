"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  UserRound,
  Brain,
  Zap,
  Star,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  description?: string;
  price?: string;
  duration?: string;
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

type Slot = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
};

type PublicWorkspace = {
  id: string;
  name: string;
  businessProfile?: {
    name: string;
    niche: string;
    location?: string;
    contactEmail?: string;
    contactPhone?: string;
    workingHours?: string;
    services?: Service[];
    faqs?: FAQ[];
  } | null;
  agentConfig?: {
    fallbackMessage?: string | null;
  } | null;
  bookingSlots?: Slot[];
};

type BookingResponse = {
  success: boolean;
  appointment?: { status?: string };
  ai?: {
    reply?: string;
    summary?: string;
    nextAction?: string;
    score?: number;
  };
};

type Intent = "" | "enquiry" | "booking";
type FlowStep =
  | "details"
  | "intent"
  | "enquiry"
  | "booking"
  | "slots"
  | "success";

type SelectedEnquiry =
  | { type: "faq"; id: string; title: string; answer: string }
  | { type: "service"; id: string; title: string; answer: string }
  | { type: "other"; id: "other"; title: string; answer: string };

function formatSlot(slot: Slot) {
  const start = new Date(slot.startsAt);
  const end = new Date(slot.endsAt);
  return `${start.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function serviceLine(service: Service) {
  const parts = [
    service.description,
    service.price ? `Price: ${service.price}` : null,
    service.duration ? `Duration: ${service.duration}` : null,
  ].filter(Boolean);
  return parts.length
    ? parts.join(" • ")
    : "The team will confirm the details for this service.";
}

function emailLooksValid(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

// Step indicator labels
const STEPS: FlowStep[] = ["details", "intent", "booking", "slots", "success"];
const STEP_LABELS: Record<string, string> = {
  details: "Your Info",
  intent: "Intent",
  enquiry: "Enquiry",
  booking: "Service",
  slots: "Pick Time",
  success: "Done",
};

// AI-themed animated background component
function AIBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base deep dark gradient */}
      <div className="absolute inset-0 bg-[#030712]" />

      {/* Animated neural network nodes */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Moving connection lines */}
        <line x1="10%" y1="20%" x2="30%" y2="45%" stroke="rgba(99,102,241,0.3)" strokeWidth="1" className="animate-[dash_8s_linear_infinite]" strokeDasharray="6 6" />
        <line x1="30%" y1="45%" x2="60%" y2="25%" stroke="rgba(139,92,246,0.3)" strokeWidth="1" strokeDasharray="6 6" className="animate-[dash_10s_linear_infinite_reverse]" />
        <line x1="60%" y1="25%" x2="85%" y2="55%" stroke="rgba(99,102,241,0.25)" strokeWidth="1" strokeDasharray="6 6" className="animate-[dash_12s_linear_infinite]" />
        <line x1="85%" y1="55%" x2="70%" y2="80%" stroke="rgba(168,85,247,0.3)" strokeWidth="1" strokeDasharray="4 8" className="animate-[dash_9s_linear_infinite_reverse]" />
        <line x1="20%" y1="70%" x2="45%" y2="60%" stroke="rgba(99,102,241,0.2)" strokeWidth="1" strokeDasharray="6 6" className="animate-[dash_11s_linear_infinite]" />
        <line x1="45%" y1="60%" x2="65%" y2="75%" stroke="rgba(139,92,246,0.25)" strokeWidth="1" strokeDasharray="8 4" className="animate-[dash_7s_linear_infinite_reverse]" />
        <line x1="5%" y1="50%" x2="25%" y2="30%" stroke="rgba(99,102,241,0.2)" strokeWidth="1" strokeDasharray="5 7" className="animate-[dash_13s_linear_infinite]" />
        <line x1="75%" y1="15%" x2="90%" y2="35%" stroke="rgba(168,85,247,0.2)" strokeWidth="1" strokeDasharray="6 6" className="animate-[dash_8s_linear_infinite]" />

        {/* Node dots */}
        {[
          { cx: "10%", cy: "20%", r: 4, delay: "0s" },
          { cx: "30%", cy: "45%", r: 3, delay: "1s" },
          { cx: "60%", cy: "25%", r: 5, delay: "2s" },
          { cx: "85%", cy: "55%", r: 3, delay: "0.5s" },
          { cx: "70%", cy: "80%", r: 4, delay: "1.5s" },
          { cx: "20%", cy: "70%", r: 3, delay: "3s" },
          { cx: "45%", cy: "60%", r: 4, delay: "2.5s" },
          { cx: "65%", cy: "75%", r: 3, delay: "0.8s" },
          { cx: "5%", cy: "50%", r: 3, delay: "1.2s" },
          { cx: "75%", cy: "15%", r: 4, delay: "3.5s" },
          { cx: "90%", cy: "35%", r: 3, delay: "0.3s" },
          { cx: "25%", cy: "30%", r: 4, delay: "2.2s" },
          { cx: "50%", cy: "88%", r: 3, delay: "1.8s" },
          { cx: "15%", cy: "88%", r: 3, delay: "0.6s" },
          { cx: "92%", cy: "78%", r: 4, delay: "2.8s" },
        ].map((n, i) => (
          <circle
            key={i}
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill="rgba(99,102,241,0.7)"
            style={{ animation: `pulse-node 3s ease-in-out ${n.delay} infinite` }}
          />
        ))}
      </svg>

      {/* Large ambient glows */}
      <div
        className="absolute rounded-full opacity-30"
        style={{
          width: "50vw", height: "50vw",
          left: "-15vw", top: "-10vw",
          background: "radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)",
          animation: "float-slow 20s ease-in-out infinite alternate",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute rounded-full opacity-20"
        style={{
          width: "40vw", height: "40vw",
          right: "-10vw", bottom: "-5vw",
          background: "radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)",
          animation: "float-slow 25s ease-in-out infinite alternate-reverse",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute rounded-full opacity-15"
        style={{
          width: "30vw", height: "30vw",
          left: "40vw", top: "30vh",
          background: "radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)",
          animation: "float-slow 18s ease-in-out 5s infinite alternate",
          filter: "blur(50px)",
        }}
      />

      {/* Floating AI particles */}
      {[
        { top: "8%", left: "12%", size: 8, delay: "0s", dur: "6s" },
        { top: "15%", left: "75%", size: 6, delay: "1s", dur: "7s" },
        { top: "35%", left: "88%", size: 5, delay: "2s", dur: "8s" },
        { top: "55%", left: "5%", size: 7, delay: "1.5s", dur: "6.5s" },
        { top: "72%", left: "60%", size: 6, delay: "3s", dur: "7.5s" },
        { top: "82%", left: "25%", size: 5, delay: "0.5s", dur: "9s" },
        { top: "90%", left: "80%", size: 8, delay: "2.5s", dur: "6s" },
        { top: "48%", left: "48%", size: 4, delay: "4s", dur: "8s" },
        { top: "25%", left: "38%", size: 5, delay: "1.2s", dur: "7s" },
        { top: "65%", left: "92%", size: 6, delay: "3.5s", dur: "6.5s" },
        { top: "42%", left: "18%", size: 4, delay: "0.8s", dur: "9s" },
        { top: "78%", left: "44%", size: 5, delay: "2.8s", dur: "7.5s" },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: p.top, left: p.left,
            width: p.size, height: p.size,
            background: i % 3 === 0
              ? "rgba(99,102,241,0.8)"
              : i % 3 === 1
              ? "rgba(168,85,247,0.8)"
              : "rgba(16,185,129,0.7)",
            boxShadow: `0 0 ${p.size * 3}px ${i % 3 === 0 ? "rgba(99,102,241,0.6)" : i % 3 === 1 ? "rgba(168,85,247,0.6)" : "rgba(16,185,129,0.5)"}`,
            animation: `float-particle ${p.dur} ${p.delay} ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* Moving gradient scan line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px] opacity-40"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.8) 40%, rgba(168,85,247,0.8) 60%, transparent 100%)",
          animation: "scan-vertical 12s linear infinite",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <style>{`
        @keyframes float-slow {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -20px) scale(1.05); }
        }
        @keyframes float-particle {
          0% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          50% { opacity: 1; }
          100% { transform: translate(15px, -25px) scale(1.2); opacity: 0.6; }
        }
        @keyframes pulse-node {
          0%, 100% { opacity: 0.4; r: attr(r); }
          50% { opacity: 1; }
        }
        @keyframes scan-vertical {
          0% { transform: translateY(-2px); }
          100% { transform: translateY(100vh); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rotate-ring {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes counter-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3), 0 0 40px rgba(99,102,241,0.1); }
          50% { box-shadow: 0 0 30px rgba(99,102,241,0.5), 0 0 60px rgba(99,102,241,0.2); }
        }
        .step-animate { animation: slideUp 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .card-glow { animation: glow-pulse 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// Progress bar
function ProgressBar({ step }: { step: FlowStep }) {
  const flowOrder: FlowStep[] = ["details", "intent", "enquiry", "booking", "slots", "success"];
  const idx = flowOrder.indexOf(step);
  const totalSteps = 5;
  const progress = Math.min(((idx) / (totalSteps - 1)) * 100, 100);

  return (
    <div className="w-full mb-6">
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #6366f1, #a855f7, #10b981)",
          }}
        />
      </div>
      <div className="flex justify-between mt-2">
        {["Your Info", "Intent", "Selection", "Time Slot", "Done"].map((label, i) => (
          <span
            key={label}
            className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${i <= idx - 1 ? "text-indigo-400" : i === idx ? "text-white" : "text-white/20"}`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Input field component
function Field({
  icon, label, value, onChange, placeholder, type = "text"
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2 block">{label}</span>
      <div
        className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
          focused
            ? "bg-white/10 ring-1 ring-indigo-500/60 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            : "bg-white/5 ring-1 ring-white/10 hover:bg-white/8"
        }`}
      >
        <span className={`transition-colors ${focused ? "text-indigo-400" : "text-white/30"}`}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none font-medium"
        />
      </div>
    </label>
  );
}

// Primary button
function PrimaryButton({
  children, onClick, type = "button", disabled = false, variant = "indigo"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "indigo" | "emerald" | "ghost";
}) {
  const bg = variant === "indigo"
    ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-[0_4px_24px_rgba(99,102,241,0.4)]"
    : variant === "emerald"
    ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_4px_24px_rgba(16,185,129,0.4)]"
    : "bg-white/8 hover:bg-white/12 ring-1 ring-white/15";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${bg}`}
    >
      {children}
    </button>
  );
}

export default function PublicBookingPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = String(params.workspaceId || "");

  const [workspace, setWorkspace] = useState<PublicWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<BookingResponse | null>(null);
  const [step, setStep] = useState<FlowStep>("details");
  const [intent, setIntent] = useState<Intent>("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<SelectedEnquiry | null>(null);
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState<"" | "service" | "enquiry">("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    serviceNeeded: "",
    slotId: "",
    preferredTime: "",
    message: "",
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/public/workspaces/${workspaceId}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "This booking page is not available yet.");
        setWorkspace(data.workspace);
      } catch (err) {
        setError(err instanceof Error ? err.message : "This booking page is not available yet.");
      } finally {
        setLoading(false);
      }
    }
    if (workspaceId) load();
  }, [workspaceId]);

  const business = workspace?.businessProfile;
  const businessName = business?.name || workspace?.name || "this business";
  const services = business?.services || [];
  const faqs = business?.faqs || [];
  const slots = workspace?.bookingSlots || [];
  const selectedSlot = useMemo(() => slots.find((slot) => slot.id === form.slotId), [slots, form.slotId]);
  const selectedService = useMemo(() => services.find((service) => service.name === form.serviceNeeded), [form.serviceNeeded, services]);

  const enquiryOptions: SelectedEnquiry[] = useMemo(() => {
    const faqOptions = faqs.slice(0, 8).map((faq) => ({
      type: "faq" as const, id: faq.id, title: faq.question, answer: faq.answer,
    }));
    const serviceOptions = services.slice(0, 8).map((service) => ({
      type: "service" as const, id: service.id, title: service.name, answer: serviceLine(service),
    }));
    return [
      ...faqOptions, ...serviceOptions,
      { type: "other" as const, id: "other" as const, title: "Other enquiry", answer: "Share your question below and the team will review it." },
    ];
  }, [faqs, services]);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function generateOptionReply(args: {
    mode: "service" | "enquiry"; title: string; savedAnswer: string; serviceName?: string;
  }) {
    setAssistantMode(args.mode);
    setAssistantLoading(true);
    setAssistantReply("");
    try {
      const prompt = args.mode === "service"
        ? [
            `The prospect selected this booking service option: ${args.title}.`,
            `Saved service details: ${args.savedAnswer}`,
            "Reply as a helpful business receptionist. Explain this service clearly using only saved details. Mention price/duration only if saved. Then ask one short next question that helps qualify the prospect before showing booking slots.",
          ].join("\n")
        : [
            `The prospect selected this enquiry option: ${args.title}.`,
            `Saved answer: ${args.savedAnswer}`,
            "Reply as a helpful business receptionist. Answer clearly using the saved answer. Then ask whether they want to book an available slot for this.",
          ].join("\n");

      const res = await fetch("/api/public/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId, message: prompt,
          form: { name: form.name, email: form.email, phone: form.phone, serviceNeeded: args.serviceName || form.serviceNeeded || args.title, message: form.message, preferredTime: form.preferredTime },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI response failed.");
      setAssistantReply(data.reply || args.savedAnswer);
    } catch (err) {
      console.warn("Option AI response failed:", err);
      setAssistantReply(args.savedAnswer);
    } finally {
      setAssistantLoading(false);
    }
  }

  function validateDetails() {
    if (!form.name.trim()) return "Name is required.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!emailLooksValid(form.email)) return "Enter a valid email address.";
    return "";
  }

  function continueFromDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validation = validateDetails();
    if (validation) { setError(validation); return; }
    setError("");
    setStep("intent");
  }

  function chooseIntent(nextIntent: Intent) {
    setIntent(nextIntent);
    setError("");
    setAssistantReply("");
    setAssistantMode("");
    if (nextIntent === "enquiry") setStep("enquiry");
    if (nextIntent === "booking") setStep("booking");
  }

  function chooseService(service: Service) {
    update("serviceNeeded", service.name);
    setError("");
    generateOptionReply({ mode: "service", title: service.name, savedAnswer: serviceLine(service), serviceName: service.name });
  }

  function chooseEnquiry(option: SelectedEnquiry) {
    setSelectedEnquiry(option);
    setError("");
    if (option.type === "service") update("serviceNeeded", option.title);
    generateOptionReply({ mode: "enquiry", title: option.title, savedAnswer: option.answer, serviceName: option.type === "service" ? option.title : form.serviceNeeded });
  }

  function goToSlotsFromBooking(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (!form.serviceNeeded.trim()) { setError("Please choose a service first."); return; }
    if (!form.message.trim()) { setError("Please add a few details so the team knows what you need."); return; }
    setError("");
    setStep("slots");
  }

  function goToSlotsFromEnquiry() {
    if (!selectedEnquiry) { setError("Please choose an enquiry option first."); return; }
    const fallbackService = selectedEnquiry.type === "service" ? selectedEnquiry.title : selectedEnquiry.title;
    setForm((prev) => ({
      ...prev,
      serviceNeeded: prev.serviceNeeded || fallbackService,
      message: prev.message || `Enquiry selected: ${selectedEnquiry.title}\nAnswer shown: ${selectedEnquiry.answer}`,
    }));
    setError("");
    setStep("slots");
  }

  async function submitRequest(options?: { withoutSlot?: boolean }) {
    setSubmitting(true);
    setError("");
    setSuccess(null);
    try {
      if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) throw new Error("Name, phone, and email are required.");
      const wantsSlot = !options?.withoutSlot;
      if (wantsSlot && !form.slotId) throw new Error("Please choose an available time.");

      const enquiryText = selectedEnquiry
        ? [`Enquiry option: ${selectedEnquiry.title}`, `Answer shown: ${selectedEnquiry.answer}`].join("\n")
        : null;

      const message = [
        intent ? `Prospect selected: ${intent === "booking" ? "I want to book" : "I have an enquiry"}` : null,
        enquiryText,
        selectedService ? `Selected service details: ${serviceLine(selectedService)}` : null,
        form.message ? `Prospect message: ${form.message}` : null,
      ].filter(Boolean).join("\n\n");

      const res = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId, name: form.name, email: form.email, phone: form.phone,
          serviceNeeded: form.serviceNeeded || selectedEnquiry?.title || "General enquiry",
          preferredTime: selectedSlot ? formatSlot(selectedSlot) : form.preferredTime,
          message: message || "New guided funnel request",
          slotId: wantsSlot ? form.slotId : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit your request.");
      setSuccess(data);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <AIBackground />
        <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4">
            {/* Spinning AI ring loader */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500"
                style={{ animation: "rotate-ring 1s linear infinite" }}
              />
              <div className="absolute inset-3 flex items-center justify-center">
                <Brain className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <p className="text-sm font-bold text-white/50 tracking-wide">Loading booking page...</p>
          </div>
        </main>
      </>
    );
  }

  if (error && !workspace) {
    return (
      <>
        <AIBackground />
        <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md rounded-3xl bg-white/5 ring-1 ring-white/10 p-8 text-center backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 ring-1 ring-red-500/30">
              <Zap className="h-6 w-6 text-red-400" />
            </div>
            <h1 className="text-xl font-black text-white">Booking page unavailable</h1>
            <p className="mt-3 text-sm text-white/50 leading-6">{error}</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AIBackground />
      <main className="relative z-10 min-h-screen px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <header className="mb-6 step-animate">
            {/* AI badge */}
            <div className="flex justify-center mb-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/15 px-4 py-2 ring-1 ring-indigo-500/30 backdrop-blur-sm">
                <div className="relative">
                  <Brain className="h-4 w-4 text-indigo-400" />
                  <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400/30" style={{ animationDuration: "2s" }} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">AI Booking Assistant</span>
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              </div>
            </div>

            {/* Business name */}
            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Book with{" "}
                <span
                  className="inline-block"
                  style={{
                    background: "linear-gradient(135deg, #a5b4fc, #8b5cf6, #ec4899)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {businessName}
                </span>
              </h1>
              <p className="mt-2 text-sm text-white/40 leading-6 max-w-md mx-auto">
                Share your details, choose enquiry or booking, and our AI will guide you to the perfect slot.
              </p>
            </div>

            {/* Business meta pills */}
            {(business?.location || business?.workingHours || business?.contactPhone) && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {business?.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 ring-1 ring-white/10">
                    <MapPin className="h-3 w-3" /> {business.location}
                  </span>
                )}
                {business?.workingHours && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 ring-1 ring-white/10">
                    <Clock className="h-3 w-3" /> {business.workingHours}
                  </span>
                )}
                {business?.contactPhone && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 ring-1 ring-white/10">
                    <Phone className="h-3 w-3" /> {business.contactPhone}
                  </span>
                )}
              </div>
            )}

            {/* Progress bar */}
            <ProgressBar step={step} />
          </header>

          {/* Error banner */}
          {error && workspace && (
            <div className="mb-4 rounded-2xl bg-red-500/10 ring-1 ring-red-500/30 px-4 py-3 text-sm font-semibold text-red-300 step-animate">
              ⚠ {error}
            </div>
          )}

          {/* Main card */}
          <div
            className="rounded-3xl p-6 sm:p-8 backdrop-blur-xl card-glow step-animate"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >

            {/* Back button */}
            {step !== "details" && step !== "success" && (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  if (step === "intent") setStep("details");
                  else if (step === "enquiry" || step === "booking") setStep("intent");
                  else if (step === "slots") setStep(intent === "enquiry" ? "enquiry" : "booking");
                }}
                className="mb-5 inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-black text-white/50 hover:bg-white/10 hover:text-white/80 transition-all ring-1 ring-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}

            {/* STEP: Details */}
            {step === "details" && (
              <form onSubmit={continueFromDetails} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white">First, your details</h2>
                  <p className="mt-1.5 text-sm text-white/40 leading-6">
                    This helps the team identify your request instantly.
                  </p>
                </div>
                <div className="space-y-4">
                  <Field icon={<UserRound className="h-4 w-4" />} label="Full Name" value={form.name} onChange={(v) => update("name", v)} placeholder="Your name" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field icon={<Phone className="h-4 w-4" />} label="Phone" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+1 555 000 0000" type="tel" />
                    <Field icon={<Mail className="h-4 w-4" />} label="Email" value={form.email} onChange={(v) => update("email", v)} placeholder="you@email.com" type="email" />
                  </div>
                </div>
                <PrimaryButton type="submit">
                  Continue <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
              </form>
            )}

            {/* STEP: Intent */}
            {step === "intent" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white">How can we help?</h2>
                  <p className="mt-1.5 text-sm text-white/40 leading-6">
                    Choose an option — you can still book after an enquiry.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => chooseIntent("enquiry")}
                    className="group relative overflow-hidden rounded-3xl p-6 text-left ring-1 ring-white/10 bg-white/4 hover:ring-indigo-500/50 hover:bg-indigo-500/8 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="mb-4 w-12 h-12 rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-500/30 flex items-center justify-center group-hover:ring-indigo-500/60 transition-all">
                        <HelpCircle className="h-6 w-6 text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-black text-white mb-2">I have an enquiry</h3>
                      <p className="text-sm text-white/40 leading-5">
                        Get AI-powered answers from the business's knowledge base.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-400">
                        Choose this <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => chooseIntent("booking")}
                    className="group relative overflow-hidden rounded-3xl p-6 text-left ring-1 ring-white/10 bg-white/4 hover:ring-emerald-500/50 hover:bg-emerald-500/8 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="mb-4 w-12 h-12 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30 flex items-center justify-center group-hover:ring-emerald-500/60 transition-all">
                        <CalendarCheck className="h-6 w-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-black text-white mb-2">I want to book</h3>
                      <p className="text-sm text-white/40 leading-5">
                        Pick a service and select your preferred time slot.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                        Choose this <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* STEP: Enquiry */}
            {step === "enquiry" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-white">What's your enquiry?</h2>
                  <p className="mt-1.5 text-sm text-white/40 leading-6">
                    Select from the business's topics — AI will answer instantly.
                  </p>
                </div>
                <div className="space-y-2">
                  {enquiryOptions.map((option) => {
                    const isSelected = selectedEnquiry?.id === option.id && selectedEnquiry.type === option.type;
                    return (
                      <button
                        key={`${option.type}-${option.id}`}
                        type="button"
                        onClick={() => chooseEnquiry(option)}
                        className={`w-full rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-all duration-200 ${
                          isSelected
                            ? "bg-indigo-500/15 ring-1 ring-indigo-500/50 text-white"
                            : "bg-white/4 ring-1 ring-white/8 text-white/70 hover:bg-white/8 hover:text-white hover:ring-white/20"
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          {option.title}
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-400 flex-shrink-0" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedEnquiry && (
                  <div className="rounded-2xl bg-indigo-500/8 ring-1 ring-indigo-500/25 p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Brain className="h-4 w-4 text-indigo-400" />
                        {assistantLoading && (
                          <div className="absolute inset-0 rounded-full animate-ping bg-indigo-400/40" />
                        )}
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                        {assistantLoading ? "AI is thinking..." : "AI Answer"}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4 text-sm leading-6 text-white/80">
                      {assistantLoading && assistantMode === "enquiry" ? (
                        <div className="flex items-center gap-3 text-white/40">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Preparing the best answer using business knowledge...</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{assistantReply || selectedEnquiry.answer}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 block">Add details (optional)</span>
                      <textarea
                        value={form.message}
                        onChange={(e) => update("message", e.target.value)}
                        rows={3}
                        className="w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none resize-none focus:ring-indigo-500/40"
                        placeholder="Anything else the team should know..."
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <PrimaryButton onClick={goToSlotsFromEnquiry} disabled={assistantLoading}>
                        Book for this <ArrowRight className="h-4 w-4" />
                      </PrimaryButton>
                      <PrimaryButton variant="ghost" onClick={() => submitRequest({ withoutSlot: true })} disabled={submitting || assistantLoading}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Submit enquiry only
                      </PrimaryButton>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP: Booking (service selection) */}
            {step === "booking" && (
              <form onSubmit={goToSlotsFromBooking} className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-white">Choose a service</h2>
                  <p className="mt-1.5 text-sm text-white/40 leading-6">
                    Services are managed by the business owner.
                  </p>
                </div>
                <div className="space-y-2">
                  {services.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => update("serviceNeeded", "General consultation")}
                      className={`w-full rounded-2xl px-4 py-3.5 text-left text-sm font-bold ring-1 transition-all ${form.serviceNeeded === "General consultation" ? "bg-emerald-500/12 ring-emerald-500/40 text-white" : "bg-white/4 ring-white/8 text-white/70 hover:bg-white/8 hover:text-white"}`}
                    >
                      General consultation
                    </button>
                  ) : (
                    services.map((service) => {
                      const isSelected = form.serviceNeeded === service.name;
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => chooseService(service)}
                          className={`w-full rounded-2xl px-4 py-4 text-left ring-1 transition-all duration-200 ${
                            isSelected
                              ? "bg-emerald-500/12 ring-emerald-500/40"
                              : "bg-white/4 ring-white/8 hover:bg-white/8 hover:ring-white/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-sm font-black ${isSelected ? "text-white" : "text-white/80"}`}>{service.name}</p>
                              <p className="mt-1 text-xs text-white/40 leading-5">{serviceLine(service)}</p>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {form.serviceNeeded && (
                  <div className="rounded-2xl bg-emerald-500/8 ring-1 ring-emerald-500/25 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Brain className="h-4 w-4 text-emerald-400" />
                        {assistantLoading && (
                          <div className="absolute inset-0 rounded-full animate-ping bg-emerald-400/40" />
                        )}
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        {assistantLoading ? "AI is preparing..." : "AI Service Guide"}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/5 p-4 text-sm leading-6 text-white/80">
                      {assistantLoading && assistantMode === "service" ? (
                        <div className="flex items-center gap-3 text-white/40">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Preparing service details...
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">
                          {assistantReply || (selectedService ? serviceLine(selectedService) : "The team will confirm the details for this service.")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 block">What do you need help with?</span>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none resize-none focus:ring-indigo-500/40"
                    placeholder="Example: I want to set this up for my salon / clinic / business..."
                  />
                </div>
                <PrimaryButton type="submit" variant="emerald">
                  Show available times <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
              </form>
            )}

            {/* STEP: Slots */}
            {step === "slots" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-white">Choose a time slot</h2>
                  <p className="mt-1.5 text-sm text-white/40 leading-6">
                    These slots are live from the business owner's schedule.
                  </p>
                </div>
                {slots.length === 0 ? (
                  <div className="rounded-2xl bg-amber-500/8 ring-1 ring-amber-500/30 p-5">
                    <p className="text-sm text-amber-300 leading-6 mb-4">
                      No booking slots are available right now. You can still submit your request and the team will follow up.
                    </p>
                    <PrimaryButton onClick={() => submitRequest({ withoutSlot: true })} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                      Submit request
                    </PrimaryButton>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {slots.map((slot) => {
                        const isSelected = form.slotId === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => update("slotId", slot.id)}
                            className={`w-full rounded-2xl px-4 py-4 text-left ring-1 transition-all duration-200 ${
                              isSelected
                                ? "bg-emerald-500/12 ring-emerald-500/40"
                                : "bg-white/4 ring-white/8 hover:bg-white/8 hover:ring-white/20"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className={`text-sm font-black ${isSelected ? "text-white" : "text-white/80"}`}>{formatSlot(slot)}</p>
                                <p className="mt-0.5 text-xs text-white/40">{slot.title} · {slot.timezone}</p>
                              </div>
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <div className="h-5 w-5 rounded-full ring-1 ring-white/20 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <PrimaryButton variant="emerald" onClick={() => submitRequest()} disabled={submitting || !form.slotId}>
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CalendarCheck className="h-4 w-4" />
                      )}
                      Confirm booking request
                    </PrimaryButton>
                  </>
                )}
              </div>
            )}

            {/* STEP: Success */}
            {step === "success" && success && (
              <div className="text-center py-4 space-y-5">
                {/* Animated success ring */}
                <div className="mx-auto relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30" />
                  <div
                    className="absolute inset-0 rounded-full ring-2 ring-emerald-500/50"
                    style={{ animation: "rotate-ring 3s linear infinite" }}
                  />
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                </div>

                <div>
                  <h2 className="text-3xl font-black text-white">
                    {selectedSlot ? "Booking request received!" : "Enquiry received!"}
                  </h2>
                  <p className="mt-3 text-sm text-white/50 leading-6">
                    Thanks, <span className="text-white font-bold">{form.name}</span>. {businessName} has your details and will be in touch.
                  </p>
                </div>

                {selectedSlot && (
                  <div className="rounded-2xl bg-emerald-500/8 ring-1 ring-emerald-500/25 p-4">
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-2">Your selected time</p>
                    <p className="text-sm font-bold text-white">{formatSlot(selectedSlot)}</p>
                  </div>
                )}

                {/* What's next */}
                <div className="rounded-2xl bg-white/4 ring-1 ring-white/8 p-4 text-left space-y-3">
                  <p className="text-xs font-black uppercase tracking-wider text-white/40">What happens next</p>
                  {[
                    "A notification has been sent to the team.",
                    "You'll receive a confirmation email shortly.",
                    "The team will follow up if anything else is needed.",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-indigo-500/20 ring-1 ring-indigo-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-black text-indigo-400">{i + 1}</span>
                      </div>
                      <p className="text-sm text-white/60">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-white/25">
                  <Star className="h-3 w-3" />
                  <span>Powered by AI booking assistant</span>
                  <Star className="h-3 w-3" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-white/20">
            Your data is handled securely. By submitting, you agree to be contacted by {businessName}.
          </p>
        </div>
      </main>
    </>
  );
}
