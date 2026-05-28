"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { GlassPanel, PremiumMotionBackground } from "@/components/premium/PremiumMotionBackground";

type Service = { id: string; name: string; description?: string | null; price?: string | null; duration?: string | null };
type FAQ = { id: string; question: string; answer: string };
type FunnelOption = { id: string; title: string; answer?: string | null; serviceName?: string | null };
type FunnelOptionPage = { id: string; title: string; subtitle?: string | null; intent: "ENQUIRY" | "BOOKING" | "BOTH"; options: FunnelOption[] };
type Slot = { id: string; title?: string | null; startsAt: string; endsAt: string; timezone?: string | null };
type PublicWorkspace = {
  id: string;
  name: string;
  businessProfile?: {
    name?: string | null;
    niche?: string | null;
    location?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    workingHours?: string | null;
    services?: Service[];
    faqs?: FAQ[];
  } | null;
  agentConfig?: { fallbackMessage?: string | null } | null;
  funnelOptionPages?: FunnelOptionPage[];
  bookingSlots?: Slot[];
};

type Intent = "" | "enquiry" | "booking";
type FlowStep = "details" | "intent" | "selection" | "requirement" | "slot" | "success";
type SelectedOption = { type: string; id: string; title: string; answer: string; serviceName?: string | null };
type FormState = { name: string; email: string; phone: string; message: string; slotId: string; website: string };

const steps: { id: FlowStep; label: string }[] = [
  { id: "details", label: "Your Info" },
  { id: "intent", label: "Intent" },
  { id: "selection", label: "Selection" },
  { id: "slot", label: "Time Slot" },
  { id: "success", label: "Done" },
];

function asWorkspace(payload: unknown): PublicWorkspace | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const maybeWorkspace = record.workspace && typeof record.workspace === "object" ? (record.workspace as Record<string, unknown>) : record;
  if (typeof maybeWorkspace.id !== "string") return null;
  return maybeWorkspace as unknown as PublicWorkspace;
}

function emailLooksValid(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

function cleanAnswer(value?: string | null) {
  return (value || "The team will confirm the best details for this option.").replace(/\s+/g, " ").trim();
}

function slotLabel(slot: Slot) {
  const start = new Date(slot.startsAt);
  const end = new Date(slot.endsAt);
  const date = start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const time = `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  return { date, time };
}

function optionFromService(service: Service): SelectedOption {
  const parts = [service.description, service.price ? `Price: ${service.price}` : null, service.duration ? `Duration: ${service.duration}` : null].filter(Boolean);
  return {
    type: "service",
    id: service.id,
    title: service.name,
    answer: parts.length ? parts.join(". ") : "The team will confirm the best details for this service.",
    serviceName: service.name,
  };
}

function optionFromFAQ(faq: FAQ): SelectedOption {
  return { type: "faq", id: faq.id, title: faq.question, answer: faq.answer, serviceName: faq.question };
}

function isOtherOption(option: SelectedOption | null) {
  if (!option) return false;
  const title = option.title.toLowerCase();
  return option.type === "other" || title === "other" || title.includes("other enquiry") || title.includes("custom");
}

function StepProgress({ step }: { step: FlowStep }) {
  const activeIndex = Math.max(steps.findIndex((item) => item.id === step), 0);
  return (
    <div className="mb-8">
      <div className="relative h-1 rounded-full bg-white/10">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400"
          initial={false}
          animate={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>
      <div className="mt-3 grid grid-cols-5 text-[10px] font-black uppercase tracking-[.18em]">
        {steps.map((item, index) => (
          <span key={item.id} className={index <= activeIndex ? "text-indigo-200" : "text-white/24"}>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function InputField({ icon, label, value, onChange, placeholder, type = "text" }: { icon: ReactNode; label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[.18em] text-white/40">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3.5 transition hover:border-indigo-300/30 hover:bg-white/[.07] focus-within:border-indigo-300/60 focus-within:bg-white/[.08]">
        <span className="text-white/32">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/22"
        />
      </div>
    </label>
  );
}

function PrimaryButton({ children, onClick, disabled = false, tone = "indigo" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; tone?: "indigo" | "emerald" | "ghost" }) {
  const classes = tone === "emerald"
    ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_16px_42px_rgba(16,185,129,.24)] hover:shadow-[0_18px_52px_rgba(16,185,129,.34)]"
    : tone === "ghost"
      ? "border border-white/10 bg-white/[.05] hover:bg-white/[.08]"
      : "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_16px_42px_rgba(99,102,241,.28)] hover:shadow-[0_18px_52px_rgba(99,102,241,.4)]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black text-white transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45 ${classes}`}
    >
      {children}
    </button>
  );
}

function OptionCard({ option, selected, onClick, color = "indigo" }: { option: SelectedOption; selected: boolean; onClick: () => void; color?: "indigo" | "emerald" }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3, rotateX: 1.5, rotateY: -1.5 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`w-full rounded-3xl border p-5 text-left transition ${
        selected
          ? color === "emerald"
            ? "border-emerald-300/45 bg-emerald-400/10 shadow-[0_18px_70px_rgba(16,185,129,.14)]"
            : "border-indigo-300/45 bg-indigo-400/10 shadow-[0_18px_70px_rgba(99,102,241,.16)]"
          : "border-white/10 bg-white/[.045] hover:border-white/20 hover:bg-white/[.07]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-white">{option.title}</h3>
          <p className="mt-2 line-clamp-3 text-xs leading-6 text-white/48">{option.answer}</p>
        </div>
        {selected ? <CheckCircle2 className={color === "emerald" ? "h-5 w-5 text-emerald-300" : "h-5 w-5 text-indigo-300"} /> : <Sparkles className="h-5 w-5 text-white/18" />}
      </div>
    </motion.button>
  );
}

function ReplyBox({ loading, reply }: { loading: boolean; reply: string }) {
  return (
    <div className="rounded-3xl border border-cyan-300/18 bg-cyan-300/[.055] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em] text-cyan-200">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Please wait..." : "Helpful details"}
      </div>
      <div className="rounded-2xl bg-black/18 px-4 py-4 text-sm font-medium leading-7 text-white/78">
        {loading ? "Please wait..." : reply}
      </div>
    </div>
  );
}

export default function PublicBookingPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = String(params.workspaceId || "");

  const [workspace, setWorkspace] = useState<PublicWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<FlowStep>("details");
  const [intent, setIntent] = useState<Intent>("");
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(null);
  const [reply, setReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", message: "", slotId: "", website: "" });

  useEffect(() => {
    if (!workspaceId) return;
    let alive = true;
    setLoading(true);
    fetch(`/api/public/workspaces/${workspaceId}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as unknown;
        if (!response.ok) throw new Error("Booking page is not available right now.");
        const data = asWorkspace(payload);
        if (!data) throw new Error("Booking page is not available right now.");
        if (alive) setWorkspace(data);
      })
      .catch((caught: unknown) => {
        if (alive) setError(caught instanceof Error ? caught.message : "Booking page is not available right now.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [workspaceId]);

  const business = workspace?.businessProfile;
  const businessName = business?.name || workspace?.name || "this business";
  const services = business?.services || [];
  const faqs = business?.faqs || [];
  const slots = useMemo(() => [...(workspace?.bookingSlots || [])].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()), [workspace?.bookingSlots]);
  const selectedSlot = slots.find((slot) => slot.id === form.slotId);

  const enquiryPage = workspace?.funnelOptionPages?.find((page) => ["ENQUIRY", "BOTH"].includes(page.intent) && page.options?.length);
  const bookingPage = workspace?.funnelOptionPages?.find((page) => ["BOOKING", "BOTH"].includes(page.intent) && page.options?.length);

  const enquiryOptions = useMemo<SelectedOption[]>(() => {
    const custom = enquiryPage?.options?.map((option) => ({ type: "custom", id: option.id, title: option.title, answer: cleanAnswer(option.answer), serviceName: option.serviceName || option.title })) || [];
    const fallback = [...faqs.slice(0, 5).map(optionFromFAQ), ...services.slice(0, 5).map(optionFromService)];
    return [...(custom.length ? custom : fallback), { type: "other", id: "other-enquiry", title: "Other / Custom request", answer: "Tell us what you need help with and the team will check the best solution.", serviceName: "Other / Custom request" }];
  }, [enquiryPage?.options, faqs, services]);

  const bookingOptions = useMemo<SelectedOption[]>(() => {
    const custom = bookingPage?.options?.map((option) => ({ type: "custom", id: option.id, title: option.title, answer: cleanAnswer(option.answer), serviceName: option.serviceName || option.title })) || [];
    const fallback = services.slice(0, 8).map(optionFromService);
    return [...(custom.length ? custom : fallback), { type: "other", id: "other-booking", title: "Other / Custom booking", answer: "Tell us what you need help with and choose a slot so the team can understand your requirement.", serviceName: "Other / Custom booking" }];
  }, [bookingPage?.options, services]);

  const currentOptions = intent === "booking" ? bookingOptions : enquiryOptions;

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function loadReply(option: SelectedOption, nextIntent: Intent) {
    setReplyLoading(true);
    setReply("");
    try {
      const response = await fetch("/api/public/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          businessName,
          intent: nextIntent,
          selectedOption: option.title,
          optionTitle: option.title,
          savedAnswer: option.answer,
          answer: option.answer,
          serviceName: option.serviceName || option.title,
          question: isOtherOption(option) ? "The prospect selected Other / Custom request." : "The prospect selected this option.",
        }),
      });
      const payload = (await response.json()) as Record<string, unknown>;
      const cleanReply = typeof payload.reply === "string" ? payload.reply : typeof payload.answer === "string" ? payload.answer : typeof payload.message === "string" ? payload.message : "";
      setReply(cleanReply || fallbackReply(option));
    } catch {
      setReply(fallbackReply(option));
    } finally {
      setReplyLoading(false);
    }
  }

  function fallbackReply(option: SelectedOption) {
    if (isOtherOption(option)) {
      return "Thanks, we can check this with the team. Tell us what you need help with, then choose a suitable time so we can understand your requirement and confirm the best solution.";
    }
    return `${option.title} helps with ${option.answer} Tell us a little more about what you need so we can recommend the best available time.`;
  }

  function chooseIntent(nextIntent: Intent) {
    setIntent(nextIntent);
    setSelectedOption(null);
    setReply("");
    setForm((prev) => ({ ...prev, message: "", slotId: "" }));
    setStep("selection");
  }

  function chooseOption(option: SelectedOption) {
    setSelectedOption(option);
    setForm((prev) => ({ ...prev, message: isOtherOption(option) ? "" : prev.message }));
    setStep("requirement");
    void loadReply(option, intent || "booking");
  }

  function detailsValid() {
    return form.name.trim().length >= 2 && form.phone.trim().length >= 6 && emailLooksValid(form.email);
  }

  async function submitBooking() {
    if (!selectedOption) return;
    if (!form.message.trim()) {
      setError("Please share a few details about what you need.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: form.name,
          email: form.email,
          phone: form.phone,
          website: form.website,
          intent,
          source: "public_booking_page",
          selectedOptionId: selectedOption.id,
          selectedOptionTitle: selectedOption.title,
          selectedOption: selectedOption.title,
          optionTitle: selectedOption.title,
          selectedOptionAnswer: selectedOption.answer,
          serviceNeeded: selectedOption.serviceName || selectedOption.title,
          requirements: form.message,
          requirement: form.message,
          message: form.message,
          slotId: form.slotId,
          preferredTime: selectedSlot ? `${slotLabel(selectedSlot).date} ${slotLabel(selectedSlot).time}` : "Team will confirm",
          startsAt: selectedSlot?.startsAt,
          endsAt: selectedSlot?.endsAt,
          customRequest: isOtherOption(selectedOption) ? form.message : undefined,
        }),
      });
      const payload = (await response.json()) as Record<string, unknown>;
      if (!response.ok || payload.error) throw new Error(typeof payload.error === "string" ? payload.error : "Could not submit your request.");
      setStep("success");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PremiumMotionBackground>
        <main className="flex min-h-screen items-center justify-center px-6">
          <GlassPanel className="p-8 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-indigo-300" />
            <p className="mt-4 text-sm font-bold text-white/60">Please wait...</p>
          </GlassPanel>
        </main>
      </PremiumMotionBackground>
    );
  }

  if (error && !workspace) {
    return (
      <PremiumMotionBackground>
        <main className="flex min-h-screen items-center justify-center px-6">
          <GlassPanel className="max-w-md p-8 text-center">
            <h1 className="text-2xl font-black">Booking page unavailable</h1>
            <p className="mt-3 text-sm leading-7 text-white/55">{error}</p>
          </GlassPanel>
        </main>
      </PremiumMotionBackground>
    );
  }

  return (
    <PremiumMotionBackground>
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 text-center">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="signature-font text-3xl text-amber-200/90 sm:text-4xl">
            Let&apos;s Connect
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Book with <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">{businessName}</span>
          </motion.h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-white/48">
            Share your details, choose enquiry or booking, and confirm the best available slot.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.05] px-4 py-2 text-xs font-bold text-white/58">
            <ShieldCheck className="h-4 w-4 text-emerald-300" /> Secure and confidential
          </div>
        </header>

        <GlassPanel className="mx-auto max-w-5xl p-5 sm:p-8">
          <StepProgress step={step} />

          {error && <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</div>}

          {step === "details" && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 md:grid-cols-3">
              <InputField icon={<UserRound className="h-4 w-4" />} label="Full name" value={form.name} onChange={(value) => updateForm("name", value)} placeholder="Your name" />
              <InputField icon={<Phone className="h-4 w-4" />} label="Phone" value={form.phone} onChange={(value) => updateForm("phone", value)} placeholder="Your phone number" />
              <InputField icon={<Mail className="h-4 w-4" />} label="Email" value={form.email} onChange={(value) => updateForm("email", value)} placeholder="you@email.com" type="email" />
              <input
                type="text"
                value={form.website}
                onChange={(event) => updateForm("website", event.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              <div className="md:col-span-3 md:ml-auto md:w-56">
                <PrimaryButton disabled={!detailsValid()} onClick={() => setStep("intent")}>
                  Continue <ArrowRight className="h-4 w-4" />
                </PrimaryButton>
              </div>
            </motion.section>
          )}

          {step === "intent" && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-2">
              <OptionCard option={{ type: "intent", id: "enquiry", title: "I have an enquiry", answer: "Ask about services, pricing, setup, or your requirement." }} selected={intent === "enquiry"} onClick={() => chooseIntent("enquiry")} />
              <OptionCard option={{ type: "intent", id: "booking", title: "I want to book", answer: "Choose a service and confirm a suitable time slot." }} selected={intent === "booking"} onClick={() => chooseIntent("booking")} />
            </motion.section>
          )}

          {step === "selection" && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">{intent === "booking" ? bookingPage?.title || "Choose a service" : enquiryPage?.title || "What do you need help with?"}</h2>
                  <p className="mt-2 text-sm text-white/45">{intent === "booking" ? bookingPage?.subtitle || "Select what you want to book." : enquiryPage?.subtitle || "Select the closest option. You can choose Other for custom requests."}</p>
                </div>
                <button type="button" onClick={() => setStep("intent")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/58 hover:bg-white/5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {currentOptions.map((option) => (
                  <OptionCard key={option.id} option={option} selected={selectedOption?.id === option.id} onClick={() => chooseOption(option)} />
                ))}
              </div>
            </motion.section>
          )}

          {step === "requirement" && selectedOption && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
              <div className="space-y-4">
                <OptionCard option={selectedOption} selected onClick={() => setStep("selection")} color="emerald" />
                <ReplyBox loading={replyLoading} reply={reply || fallbackReply(selectedOption)} />
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[.045] p-5">
                <label className="block text-[11px] font-black uppercase tracking-[.18em] text-white/40">What do you need help with?</label>
                <textarea
                  value={form.message}
                  onChange={(event) => updateForm("message", event.target.value)}
                  rows={8}
                  maxLength={900}
                  placeholder={isOtherOption(selectedOption) ? "Tell us your custom request..." : "Example: I want to set this up for my salon / clinic / agency..."}
                  className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-black/18 p-4 text-sm font-medium leading-7 text-white outline-none placeholder:text-white/20 focus:border-indigo-300/50"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <PrimaryButton tone="ghost" onClick={() => setStep("selection")}>
                    <ArrowLeft className="h-4 w-4" /> Change option
                  </PrimaryButton>
                  <PrimaryButton disabled={!form.message.trim()} onClick={() => setStep("slot")}>
                    Continue <ArrowRight className="h-4 w-4" />
                  </PrimaryButton>
                </div>
              </div>
            </motion.section>
          )}

          {step === "slot" && selectedOption && (
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white">Pick a suitable time</h2>
                  <p className="mt-2 text-sm text-white/45">{slots.length ? "Choose one of the available slots below." : "Slots will be confirmed by the team."}</p>
                </div>
                <button type="button" onClick={() => setStep("requirement")} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/58 hover:bg-white/5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>

              {slots.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {slots.map((slot) => {
                    const label = slotLabel(slot);
                    const selected = form.slotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => updateForm("slotId", slot.id)}
                        className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 ${selected ? "border-emerald-300/45 bg-emerald-400/10" : "border-white/10 bg-white/[.045] hover:border-white/20"}`}
                      >
                        <div className="flex items-center justify-between">
                          <CalendarCheck className={selected ? "h-5 w-5 text-emerald-300" : "h-5 w-5 text-white/30"} />
                          {selected && <CheckCircle2 className="h-5 w-5 text-emerald-300" />}
                        </div>
                        <p className="mt-4 text-base font-black text-white">{label.date}</p>
                        <p className="mt-2 flex items-center gap-2 text-sm font-bold text-white/55"><Clock className="h-4 w-4" /> {label.time}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-amber-300/18 bg-amber-300/[.07] p-6 text-sm font-semibold leading-7 text-amber-50/80">
                  No public slots are open right now. Submit your request and the team will confirm the best time.
                </div>
              )}

              <div className="mt-6 ml-auto max-w-sm">
                <PrimaryButton tone="emerald" disabled={submitting || (slots.length > 0 && !form.slotId)} onClick={submitBooking}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                  Confirm booking
                </PrimaryButton>
              </div>
            </motion.section>
          )}

          {step === "success" && selectedOption && (
            <motion.section initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-2xl text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10 shadow-[0_0_90px_rgba(16,185,129,.22)]">
                <CheckCircle2 className="h-11 w-11 text-emerald-300" />
              </div>
              <h2 className="mt-8 text-4xl font-black text-white">You&apos;re all set!</h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-white/55">
                Thanks, {form.name}. {businessName} has your details. {selectedSlot ? "Your booking is confirmed for the selected time." : "The team will confirm a suitable time with you."}
              </p>
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[.045] p-6 text-left">
                <p className="text-[11px] font-black uppercase tracking-[.18em] text-white/35">Booking summary</p>
                <div className="mt-4 space-y-3 text-sm font-semibold text-white/65">
                  <p>Selected option: <span className="text-white">{selectedOption.title}</span></p>
                  <p>Contact: <span className="text-white">{form.phone}</span> · <span className="text-white">{form.email}</span></p>
                  <p>Time: <span className="text-white">{selectedSlot ? `${slotLabel(selectedSlot).date}, ${slotLabel(selectedSlot).time}` : "Team will confirm"}</span></p>
                </div>
              </div>
            </motion.section>
          )}
        </GlassPanel>
      </main>
    </PremiumMotionBackground>
  );
}
