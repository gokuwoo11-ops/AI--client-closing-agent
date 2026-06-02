"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  Calendar,
  BadgeCheck,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";


/* ─── domain types (unchanged) ─── */

type Service = {
  id: string;
  name: string;
  description?: string | null;
  price?: string | null;
  duration?: string | null;
};

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

type FunnelOption = {
  id: string;
  pageId?: string;
  title: string;
  answer?: string | null;
  serviceName?: string | null;
  parentOptionId?: string | null;
  nextPageId?: string | null;
  finalAction?:
    | "GO_TO_NEXT_PAGE"
    | "ASK_REQUIREMENT"
    | "SHOW_SLOTS"
    | string
    | null;
  isActive?: boolean;
};

type FunnelOptionPage = {
  id: string;
  title: string;
  subtitle?: string | null;
  intent: "ENQUIRY" | "BOOKING" | "BOTH";
  options: FunnelOption[];
};

type Slot = {
  id: string;
  title?: string | null;
  startsAt: string;
  endsAt: string;
  timezone?: string | null;
};

type PublicWorkspace = {
  id: string;
  name: string;
  businessProfile?: {
    name?: string | null;
    services?: Service[];
    faqs?: FAQ[];
  } | null;
  funnelOptionPages?: FunnelOptionPage[];
  bookingSlots?: Slot[];
};

type Intent = "" | "enquiry" | "booking";

type FlowStep =
  | "details"
  | "intent"
  | "selection"
  | "requirement"
  | "slot"
  | "success";

type SelectedOption = {
  type: string;
  id: string;
  pageId?: string;
  title: string;
  answer: string;
  serviceName?: string | null;
  parentOptionId?: string | null;
  nextPageId?: string | null;
  finalAction?: string | null;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
  slotId: string;
  website: string;
  customOther: string;
};

/* ─── step metadata ─── */

const steps: { id: FlowStep; label: string }[] = [
  { id: "details", label: "Your Info" },
  { id: "intent", label: "Intent" },
  { id: "selection", label: "Options" },
  { id: "slot", label: "Time Slot" },
  { id: "success", label: "Done" },
];

/* ─── helpers (all logic unchanged) ─── */

function asWorkspace(payload: unknown): PublicWorkspace | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const maybeWorkspace =
    record.workspace && typeof record.workspace === "object"
      ? (record.workspace as Record<string, unknown>)
      : record;
  if (typeof maybeWorkspace.id !== "string") return null;
  return maybeWorkspace as unknown as PublicWorkspace;
}

function emailLooksValid(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

function cleanAnswer(value?: string | null) {
  return (value || "The team will confirm the best details for this option.")
    .replace(/\s+/g, " ")
    .trim();
}

function looksBrokenReply(value: string) {
  const text = value.trim();
  if (!text || text.length < 85) return true;
  if (/you['']?ve\s*$/i.test(text)) return true;
  if (/great choice!?\s*you['']?ve?\s*$/i.test(text)) return true;
  if (!/[.!?]$/.test(text)) return true;
  return false;
}

function isOtherTitle(title: string) {
  return /(^|\s)(other|custom)(\s|$|\/|-)/i.test(title);
}

function isOtherOption(option: SelectedOption | null) {
  return Boolean(option && (option.type === "other" || isOtherTitle(option.title)));
}

function slotLabel(slot: Slot) {
  const start = new Date(slot.startsAt);
  const end = new Date(slot.endsAt);
  return {
    date: start.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
    time: `${start.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })} – ${end.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`,
  };
}

function optionFromService(service: Service): SelectedOption {
  const parts = [
    service.description,
    service.price ? `Investment: ${service.price}` : null,
    service.duration ? `Duration: ${service.duration}` : null,
  ].filter(Boolean);
  return {
    type: "service",
    id: service.id,
    title: service.name,
    answer: parts.length
      ? parts.join(". ")
      : "The team will confirm the best details for this service.",
    serviceName: service.name,
  };
}

function optionFromRaw(option: FunnelOption, pageId: string): SelectedOption {
  return {
    type: isOtherTitle(option.title) ? "other" : "custom",
    id: option.id,
    pageId,
    title: option.title,
    answer: cleanAnswer(option.answer),
    serviceName: option.serviceName || option.title,
    parentOptionId: option.parentOptionId || "",
    nextPageId: option.nextPageId || "",
    finalAction:
      option.finalAction ||
      (option.nextPageId ? "GO_TO_NEXT_PAGE" : "ASK_REQUIREMENT"),
  };
}

function fallbackReply(option: SelectedOption, mainOption: SelectedOption | null) {
  const parentText =
    mainOption && mainOption.id !== option.id
      ? ` under ${mainOption.title}`
      : "";
  if (isOtherOption(option)) {
    return `Thanks. This custom request is still related to${
      parentText || " your selected service"
    }. Share the exact details below, then choose a suitable slot so the team can review it with you and confirm the best solution.`;
  }
  return `${option.title} is a good fit for this request. ${option.answer} Share a few details about what you need, then choose a suitable time so the team can guide you properly.`;
}

/* ─── UI primitives ─── */

/** Thin horizontal rule that subtly divides sections */
function Divider() {
  return <div className="my-6 border-t border-slate-700/40" />;
}

/** Step progress bar — refined pill style */
function StepProgress({ step }: { step: FlowStep }) {
  const activeIndex = Math.max(
    steps.findIndex((s) => s.id === step),
    0,
  );
  const pct = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="mb-8 select-none">
      {/* Labels row */}
      <div className="mb-3 flex items-center justify-between">
        {steps.map((s, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition-all duration-300 ${
                  done
                    ? "border-amber-400 bg-amber-400 text-slate-900"
                    : active
                    ? "border-amber-400 bg-slate-800 text-amber-400"
                    : "border-slate-600 bg-transparent text-slate-500"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`hidden text-[9px] font-bold uppercase tracking-widest sm:block ${
                  active ? "text-amber-400" : done ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Track */}
      <div className="relative h-[3px] rounded-full bg-slate-700/60">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-300"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 24 }}
        />
      </div>
    </div>
  );
}

/** Premium input field */
function InputField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
        {label}
      </span>
      <div className="group flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3 ring-0 transition-all duration-200 focus-within:border-amber-400/60 focus-within:ring-1 focus-within:ring-amber-400/20 hover:border-slate-600">
        <span className="text-slate-500 transition group-focus-within:text-amber-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600"
        />
      </div>
    </label>
  );
}

/** Primary CTA button */
function PrimaryButton({
  children,
  onClick,
  disabled = false,
  variant = "gold",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "gold" | "ghost" | "success";
}) {
  const cls =
    variant === "success"
      ? "bg-emerald-500 hover:bg-emerald-400 shadow-[0_8px_28px_rgba(16,185,129,.22)]"
      : variant === "ghost"
      ? "border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300"
      : "bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-[0_8px_28px_rgba(251,191,36,.2)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-150 hover:-translate-y-[1px] active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}
    >
      {children}
    </button>
  );
}

/** Option card — clean and professional */
function OptionCard({
  option,
  selected,
  onClick,
  accent = "gold",
}: {
  option: SelectedOption;
  selected: boolean;
  onClick: () => void;
  accent?: "gold" | "emerald";
}) {
  const ring =
    accent === "emerald"
      ? "border-emerald-400/50 bg-emerald-900/20 ring-1 ring-emerald-400/20"
      : "border-amber-400/50 bg-amber-900/10 ring-1 ring-amber-400/20";

  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`group w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
        selected
          ? ring
          : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold leading-5 text-slate-100">
            {option.title}
          </h3>
          <p
            className={`mt-2 text-[13px] leading-6 text-slate-400 ${
              selected ? "" : "line-clamp-3"
            }`}
          >
            {option.answer}
          </p>
        </div>
        <div className="mt-0.5 shrink-0">
          {selected ? (
            <CheckCircle2
              className={`h-5 w-5 ${
                accent === "emerald" ? "text-emerald-400" : "text-amber-400"
              }`}
            />
          ) : (
            <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:text-slate-400" />
          )}
        </div>
      </div>
    </motion.button>
  );
}

/** AI reply box */
function ReplyBox({ loading, reply }: { loading: boolean; reply: string }) {
  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
      <div className="mb-3 flex items-center gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
        ) : (
          <Sparkles className="h-4 w-4 text-amber-400" />
        )}
        <span className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
          {loading ? "Generating details…" : "Service overview"}
        </span>
      </div>
      <p className="text-[13.5px] font-medium leading-7 text-slate-300">
        {loading ? (
          <span className="text-slate-500">Please wait…</span>
        ) : (
          reply
        )}
      </p>
    </div>
  );
}

/** Decorative calendar visual in the header */
function CalendarIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="pointer-events-none absolute right-8 top-6 hidden xl:block"
      aria-hidden
    >
      <div className="relative h-36 w-32 rounded-2xl border border-slate-700/60 bg-slate-800/50 p-3 shadow-2xl backdrop-blur-sm">
        {/* Calendar top bar */}
        <div className="mb-2 flex items-center justify-between">
          <div className="h-2 w-10 rounded-full bg-amber-400/70" />
          <div className="h-2 w-2 rounded-full bg-amber-400/40" />
        </div>
        {/* Fake grid of days */}
        <div className="grid grid-cols-7 gap-[3px]">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className={`h-[7px] rounded-sm ${
                [3, 9, 17, 22].includes(i)
                  ? "bg-amber-400"
                  : i % 7 === 0 || i % 7 === 6
                  ? "bg-slate-700/40"
                  : "bg-slate-700"
              }`}
            />
          ))}
        </div>
        {/* Animated ping on highlighted day */}
        <div className="absolute right-6 top-9">
          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
        </div>
      </div>
      {/* Small notification bubble */}
      <motion.div
        initial={{ x: 8, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute -right-4 bottom-4 flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 shadow-xl"
      >
        <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-[10px] font-bold text-slate-300">Booking confirmed</span>
      </motion.div>
    </motion.div>
  );
}

/* ─── page ─── */

export default function PublicBookingPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = String(params.workspaceId || "");

  const [workspace, setWorkspace] = useState<PublicWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState<FlowStep>("details");
  const [intent, setIntent] = useState<Intent>("");
  const [currentPageId, setCurrentPageId] = useState("");

  const [mainOption, setMainOption] = useState<SelectedOption | null>(null);
  const [selectedOption, setSelectedOption] = useState<SelectedOption | null>(null);
  const [path, setPath] = useState<SelectedOption[]>([]);

  const [reply, setReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    message: "",
    slotId: "",
    website: "",
    customOther: "",
  });

  useEffect(() => {
    if (!workspaceId) return;
    let alive = true;
    setLoading(true);

    fetch(`/api/public/workspaces/${workspaceId}`, { cache: "no-store" })
      .then(async (res) => {
        const payload = (await res.json()) as unknown;
        if (!res.ok) throw new Error("Booking page is not available right now.");
        const data = asWorkspace(payload);
        if (!data) throw new Error("Booking page is not available right now.");
        if (alive) setWorkspace(data);
      })
      .catch((caught: unknown) => {
        if (!alive) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Booking page is not available right now.",
        );
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

  const services = useMemo(
    () => workspace?.businessProfile?.services ?? [],
    [workspace?.businessProfile?.services],
  );
  const pages = useMemo(
    () => workspace?.funnelOptionPages ?? [],
    [workspace?.funnelOptionPages],
  );
  const slots = useMemo(
    () =>
      [...(workspace?.bookingSlots || [])].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [workspace?.bookingSlots],
  );

  const selectedSlot = slots.find((s) => s.id === form.slotId);
  const currentPage = pages.find((p) => p.id === currentPageId);

  const rootPage = useMemo(() => {
    const relevant = pages.filter((p) =>
      [intent === "booking" ? "BOOKING" : "ENQUIRY", "BOTH"].includes(p.intent),
    );
    return (
      relevant.find((p) => p.options.some((o) => !o.parentOptionId)) ||
      relevant[0] ||
      pages[0]
    );
  }, [pages, intent]);

  const currentParentId = path[path.length - 1]?.id || "";

  const childPage = currentParentId
    ? pages.find((p) =>
        p.options.some(
          (o) => o.parentOptionId === currentParentId && o.isActive !== false,
        ),
      )
    : null;

  const activePage = childPage || currentPage;

  const currentOptions = useMemo<SelectedOption[]>(() => {
    if (!activePage) return services.slice(0, 8).map(optionFromService);
    const parentId = path[path.length - 1]?.id || "";
    let options = parentId
      ? activePage.options.filter(
          (o) => o.parentOptionId === parentId && o.isActive !== false,
        )
      : activePage.options.filter((o) => !o.parentOptionId && o.isActive !== false);

    if (options.length === 0 && parentId && currentPage?.id === activePage.id) {
      options = activePage.options.filter(
        (o) => !o.parentOptionId && o.isActive !== false,
      );
    }
    return options.map((o) => optionFromRaw(o, activePage.id));
  }, [activePage, currentPage?.id, path, services]);

  function optionHasChildOptions(option: SelectedOption) {
    return pages.some((p) =>
      p.options.some(
        (c) => c.parentOptionId === option.id && c.isActive !== false,
      ),
    );
  }

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function localFallback(option: SelectedOption) {
    return fallbackReply(option, mainOption);
  }

  async function loadReply(option: SelectedOption) {
    setReplyLoading(true);
    setReply("");
    try {
      const res = await fetch("/api/public/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          businessName,
          intent,
          mainOption: mainOption?.title || option.title,
          selectedOption: option.title,
          optionTitle: option.title,
          savedAnswer: option.answer,
          answer: option.answer,
          serviceName: option.serviceName || option.title,
          question: isOtherOption(option)
            ? `The prospect selected Other inside ${mainOption?.title || "this category"}.`
            : "The prospect selected this final option.",
        }),
      });
      const payload = (await res.json()) as Record<string, unknown>;
      const cleanReply = typeof payload.reply === "string" ? payload.reply : "";
      setReply(!looksBrokenReply(cleanReply) ? cleanReply : localFallback(option));
    } catch {
      setReply(localFallback(option));
    } finally {
      setReplyLoading(false);
    }
  }

  function chooseIntent(nextIntent: Intent) {
    setIntent(nextIntent);
    setPath([]);
    setMainOption(null);
    setSelectedOption(null);
    setReply("");
    setForm((prev) => ({ ...prev, message: "", slotId: "", customOther: "" }));
    const first =
      pages
        .filter((p) =>
          [nextIntent === "booking" ? "BOOKING" : "ENQUIRY", "BOTH"].includes(p.intent),
        )
        .find((p) => p.options.some((o) => !o.parentOptionId)) || pages[0];
    setCurrentPageId(first?.id || "");
    setStep("selection");
  }

  function chooseOption(option: SelectedOption) {
    const nextPath = [...path, option];
    if (!mainOption) setMainOption(option);

    if (option.nextPageId) {
      setPath(nextPath);
      setCurrentPageId(option.nextPageId);
      setSelectedOption(null);
      setReply("");
      return;
    }
    if (optionHasChildOptions(option)) {
      setPath(nextPath);
      setSelectedOption(null);
      setReply("");
      return;
    }

    setSelectedOption(option);
    setPath(nextPath);
    setForm((prev) => ({ ...prev, message: "", slotId: "", customOther: "" }));

    if (option.finalAction === "SHOW_SLOTS") {
      setReply(localFallback(option));
      setStep("slot");
      return;
    }
    setStep("requirement");
    void loadReply(option);
  }

  function goBackSelection() {
    if (path.length > 0) {
      const nextPath = path.slice(0, -1);
      const previous = nextPath[nextPath.length - 1];
      setPath(nextPath);
      setCurrentPageId(previous?.nextPageId || previous?.pageId || rootPage?.id || "");
      setSelectedOption(null);
      setReply("");
      return;
    }
    setStep("intent");
  }

  function detailsValid() {
    return (
      form.name.trim().length >= 2 &&
      form.phone.trim().length >= 6 &&
      emailLooksValid(form.email)
    );
  }

  async function submitBooking() {
    if (!selectedOption) return;
    if (!form.message.trim() && selectedOption.finalAction !== "SHOW_SLOTS") {
      setError("Please share a few details about what you need.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/public/bookings", {
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
          mainOptionId: mainOption?.id,
          mainOptionTitle: mainOption?.title || selectedOption.title,
          subOptionId: selectedOption.id,
          subOptionTitle: selectedOption.title,
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
          preferredTime: selectedSlot
            ? `${slotLabel(selectedSlot).date} ${slotLabel(selectedSlot).time}`
            : "Team will confirm",
          startsAt: selectedSlot?.startsAt,
          endsAt: selectedSlot?.endsAt,
          customRequest: isOtherOption(selectedOption) ? form.message : undefined,
          optionPath: path.map((p) => p.title),
        }),
      });
      const payload = (await res.json()) as Record<string, unknown>;
      if (!res.ok || payload.error) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Could not submit your request.",
        );
      }
      setStep("success");
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Could not submit your request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ─── render states ─── */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <p className="text-sm font-medium text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center">
          <Calendar className="mx-auto h-10 w-10 text-slate-600" />
          <h1 className="mt-4 text-lg font-bold text-slate-200">
            Booking unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please contact the business directly.
          </p>
        </div>
      </div>
    );
  }

  /* ─── main layout ─── */

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">

      {/* Subtle radial glow behind the page — decorative only */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-amber-400/[.04] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-14">

        {/* ── Header ── */}
        <header className="relative mb-10">
          <CalendarIllustration />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Wordmark / logo area */}
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/30">
                <Calendar className="h-4.5 w-4.5 text-amber-400" />
              </div>
              <span className="text-sm font-semibold text-slate-400">
                {businessName}
              </span>
            </div>

            <h1 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-4xl">
              Schedule a{" "}
              <span className="bg-gradient-to-br from-amber-300 to-amber-500 bg-clip-text text-transparent">
                conversation
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
              Fill in your details, pick the service that fits your needs, and
              confirm a time that works for you.
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Your information is kept private and confidential
            </div>
          </motion.div>
        </header>

        {/* ── Card ── */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900 shadow-[0_32px_80px_rgba(0,0,0,.5)]">
          <div className="px-5 pt-6 sm:px-8 sm:pt-8">
            <StepProgress step={step} />
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mx-5 mb-2 rounded-xl border border-red-500/20 bg-red-900/20 px-4 py-3 text-sm font-medium text-red-300 sm:mx-8"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="px-5 pb-8 sm:px-8">

            {/* ── STEP: details ── */}
            <AnimatePresence mode="wait">
              {step === "details" && (
                <motion.section
                  key="details"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-slate-200">Your details</h2>
                    <p className="mt-1 text-[13px] text-slate-500">
                      We use this to send you a booking confirmation.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <InputField
                      icon={<UserRound className="h-4 w-4" />}
                      label="Full name"
                      value={form.name}
                      onChange={(v) => updateForm("name", v)}
                      placeholder="Your name"
                    />
                    <InputField
                      icon={<Phone className="h-4 w-4" />}
                      label="Phone"
                      value={form.phone}
                      onChange={(v) => updateForm("phone", v)}
                      placeholder="+1 234 567 8900"
                    />
                    <InputField
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                      value={form.email}
                      onChange={(v) => updateForm("email", v)}
                      placeholder="you@email.com"
                      type="email"
                    />
                  </div>

                  {/* Honeypot */}
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => updateForm("website", e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                  />

                  <Divider />

                  <div className="flex justify-end">
                    <div className="w-full sm:w-48">
                      <PrimaryButton
                        disabled={!detailsValid()}
                        onClick={() => setStep("intent")}
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </PrimaryButton>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ── STEP: intent ── */}
              {step === "intent" && (
                <motion.section
                  key="intent"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-5">
                    <h2 className="text-base font-bold text-slate-200">
                      How can we help?
                    </h2>
                    <p className="mt-1 text-[13px] text-slate-500">
                      Choose what best describes your reason for reaching out.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <OptionCard
                      option={{
                        type: "intent",
                        id: "enquiry",
                        title: "I have an enquiry",
                        answer:
                          "Ask about the service and move toward a suitable appointment if needed.",
                      }}
                      selected={intent === "enquiry"}
                      onClick={() => chooseIntent("enquiry")}
                    />
                    <OptionCard
                      option={{
                        type: "intent",
                        id: "booking",
                        title: "I want to book",
                        answer:
                          "Choose your service and confirm the best available appointment slot.",
                      }}
                      selected={intent === "booking"}
                      onClick={() => chooseIntent("booking")}
                    />
                  </div>
                </motion.section>
              )}

              {/* ── STEP: selection ── */}
              {step === "selection" && (
                <motion.section
                  key="selection"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  {/* Breadcrumb trail */}
                  {path.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-1.5">
                      {path.map((item, i) => (
                        <span key={item.id} className="flex items-center gap-1.5">
                          {i > 0 && (
                            <ArrowRight className="h-3 w-3 text-slate-600" />
                          )}
                          <span className="rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/20">
                            {item.title}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-200">
                        {activePage?.title || rootPage?.title || "Choose what you need"}
                      </h2>
                      <p className="mt-1 text-[13px] text-slate-500">
                        {activePage?.subtitle ||
                          "Select the closest match. Related options will appear step by step."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={goBackSelection}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-700"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {currentOptions.map((opt) => (
                      <OptionCard
                        key={opt.id}
                        option={opt}
                        selected={selectedOption?.id === opt.id}
                        onClick={() => chooseOption(opt)}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ── STEP: requirement ── */}
              {step === "requirement" && selectedOption && (
                <motion.section
                  key="requirement"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="grid gap-6 lg:grid-cols-[1fr_1fr]"
                >
                  {/* Left column: selection summary + reply */}
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">
                        Selected service
                      </p>
                      <OptionCard
                        option={selectedOption}
                        selected
                        onClick={() => setStep("selection")}
                        accent="gold"
                      />
                    </div>

                    <ReplyBox
                      loading={replyLoading}
                      reply={reply || localFallback(selectedOption)}
                    />

                    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-[13px] leading-6 text-slate-400">
                      <p className="mb-1 font-semibold text-slate-300">What happens next</p>
                      {isOtherOption(selectedOption)
                        ? "Your custom request stays attached to the selected category, then the team receives it with your booking slot."
                        : "Your selected path, requirements, and chosen time will be sent to the team for confirmation."}
                    </div>
                  </div>

                  {/* Right column: message textarea */}
                  <div className="flex flex-col">
                    <label className="block flex-1">
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                        {isOtherOption(selectedOption)
                          ? `Custom request — ${mainOption?.title || "service"}`
                          : "What do you need help with?"}
                      </span>
                      <textarea
                        value={form.message}
                        onChange={(e) => updateForm("message", e.target.value)}
                        rows={9}
                        maxLength={1200}
                        placeholder={
                          isOtherOption(selectedOption)
                            ? "Describe your custom requirement in detail…"
                            : "E.g. I want to set this up for my salon / clinic / agency…"
                        }
                        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-[13.5px] font-medium leading-7 text-slate-200 outline-none placeholder:text-slate-600 transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20"
                      />
                    </label>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <PrimaryButton
                        variant="ghost"
                        onClick={() => setStep("selection")}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Change option
                      </PrimaryButton>
                      <PrimaryButton
                        disabled={!form.message.trim()}
                        onClick={() => setStep("slot")}
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </PrimaryButton>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ── STEP: slot ── */}
              {step === "slot" && selectedOption && (
                <motion.section
                  key="slot"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-200">
                        Pick a time
                      </h2>
                      <p className="mt-1 text-[13px] text-slate-500">
                        {slots.length
                          ? "Choose an available slot below."
                          : "The team will confirm a time with you after submission."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        selectedOption.finalAction === "SHOW_SLOTS"
                          ? setStep("selection")
                          : setStep("requirement")
                      }
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-700 transition"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                  </div>

                  {/* Info strip for SHOW_SLOTS flow */}
                  {selectedOption.finalAction === "SHOW_SLOTS" && (
                    <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-[13px] font-medium leading-6 text-slate-400">
                      {reply || localFallback(selectedOption)}
                    </div>
                  )}

                  {slots.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {slots.map((slot) => {
                        const label = slotLabel(slot);
                        const sel = form.slotId === slot.id;
                        return (
                          <motion.button
                            key={slot.id}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.975 }}
                            onClick={() => updateForm("slotId", slot.id)}
                            className={`rounded-2xl border p-5 text-left transition-all duration-150 ${
                              sel
                                ? "border-amber-400/50 bg-amber-900/15 ring-1 ring-amber-400/20"
                                : "border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <CalendarCheck
                                className={`h-5 w-5 ${
                                  sel ? "text-amber-400" : "text-slate-600"
                                }`}
                              />
                              {sel && (
                                <CheckCircle2 className="h-4.5 w-4.5 text-amber-400" />
                              )}
                            </div>
                            <p className="mt-3 text-sm font-bold text-slate-100">
                              {label.date}
                            </p>
                            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                              <Clock className="h-3.5 w-3.5" />
                              {label.time}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 text-[13px] font-medium leading-6 text-slate-400">
                      No public slots are listed right now. Submit your request
                      and the team will confirm the best available time.
                    </div>
                  )}

                  <Divider />

                  <div className="flex justify-end">
                    <div className="w-full sm:w-56">
                      <PrimaryButton
                        variant="success"
                        disabled={submitting || (slots.length > 0 && !form.slotId)}
                        onClick={submitBooking}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CalendarCheck className="h-4 w-4" />
                        )}
                        Confirm booking
                      </PrimaryButton>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* ── STEP: success ── */}
              {step === "success" && selectedOption && (
                <motion.section
                  key="success"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="mx-auto max-w-lg py-4 text-center"
                >
                  {/* Icon */}
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-900/20 shadow-[0_0_60px_rgba(16,185,129,.15)]">
                    <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                  </div>

                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-50 sm:text-3xl">
                    Booking received
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-6 text-slate-400">
                    Thank you, {form.name}. {businessName} has your details.{" "}
                    {selectedSlot
                      ? "Your booking is confirmed for the selected time."
                      : "The team will follow up to confirm a suitable time."}
                  </p>

                  {/* Summary card */}
                  <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/60 p-5 text-left">
                    <p className="mb-4 text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">
                      Booking summary
                    </p>
                    <dl className="space-y-3 text-[13px]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Service</dt>
                        <dd className="font-semibold text-slate-200 text-right">
                          {mainOption?.title || selectedOption.title}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Option</dt>
                        <dd className="font-semibold text-slate-200 text-right">
                          {selectedOption.title}
                        </dd>
                      </div>
                      <div className="border-t border-slate-700/60 pt-3 flex justify-between gap-3">
                        <dt className="text-slate-500">Email</dt>
                        <dd className="font-semibold text-slate-200">{form.email}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Phone</dt>
                        <dd className="font-semibold text-slate-200">{form.phone}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Time</dt>
                        <dd className="font-semibold text-slate-200 text-right">
                          {selectedSlot
                            ? `${slotLabel(selectedSlot).date}, ${slotLabel(selectedSlot).time}`
                            : "Team will confirm"}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Trust note */}
                  <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-600">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    Your information is secure and will only be used for this booking
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-700">
          {businessName} · Secure booking portal
        </p>
      </div>
    </div>
  );
}