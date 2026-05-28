"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Inbox, MessageSquareText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GlassPanel, PremiumMotionBackground, StatusBadge } from "@/components/premium/PremiumMotionBackground";

type Lead = { id: string; name?: string; email?: string; phone?: string; source?: string; status?: string; stage?: string; createdAt?: string; serviceNeeded?: string; selectedOption?: string; message?: string; requirements?: string; slotId?: string | null; appointmentId?: string | null };
type Tab = "enquiries" | "bookingRequests" | "confirmedBookings";

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function arrayFromPayload<T>(payload: unknown, keys: string[]): T[] {
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

function stageOf(lead: Lead) {
  return (lead.stage || lead.status || "New").replace(/_/g, " ");
}

function categoryOf(lead: Lead): Tab {
  const stage = stageOf(lead).toLowerCase();
  if (stage.includes("book") || stage.includes("confirm") || lead.slotId || lead.appointmentId) return "confirmedBookings";
  if (stage.includes("qualified") || stage.includes("request")) return "bookingRequests";
  return "enquiries";
}

function toneFor(stage: string): "indigo" | "emerald" | "amber" | "slate" | "red" {
  const low = stage.toLowerCase();
  if (low.includes("book") || low.includes("confirm") || low.includes("closed")) return "emerald";
  if (low.includes("qualified") || low.includes("follow") || low.includes("request")) return "amber";
  if (low.includes("lost")) return "red";
  return "indigo";
}

function displayDate(value?: string) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function InboxPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("enquiries");

  useEffect(() => {
    let alive = true;
    fetch("/api/leads", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (!alive) return;
        setLeads(arrayFromPayload<Lead>(payload, ["leads", "items", "data", "results"]));
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const sorted = useMemo(() => [...leads].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()), [leads]);
  const groups = {
    enquiries: sorted.filter((lead) => categoryOf(lead) === "enquiries"),
    bookingRequests: sorted.filter((lead) => categoryOf(lead) === "bookingRequests"),
    confirmedBookings: sorted.filter((lead) => categoryOf(lead) === "confirmedBookings"),
  };

  const tabs = [
    { id: "enquiries" as const, label: "Enquiries", icon: Inbox, count: groups.enquiries.length },
    { id: "bookingRequests" as const, label: "Booking Requests", icon: MessageSquareText, count: groups.bookingRequests.length },
    { id: "confirmedBookings" as const, label: "Confirmed Bookings", icon: CalendarCheck, count: groups.confirmedBookings.length },
  ];

  return (
    <PremiumMotionBackground variant="owner">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="signature-font text-3xl text-amber-200/90">Lead Inbox</p>
          <h1 className="mt-1 text-4xl font-black tracking-tight text-white">Enquiries and bookings split clearly</h1>
          <p className="mt-2 text-sm font-medium text-white/45">Owners can handle enquiries, booking requests, and confirmed bookings without mixing everything together.</p>
        </div>

        <GlassPanel className="p-4 sm:p-6">
          <div className="grid gap-3 md:grid-cols-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-3xl border p-4 text-left transition hover:-translate-y-1 ${active ? "border-indigo-300/45 bg-indigo-400/10" : "border-white/10 bg-white/[.04] hover:border-white/20"}`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={active ? "h-5 w-5 text-indigo-200" : "h-5 w-5 text-white/35"} />
                    <StatusBadge tone={active ? "indigo" : "slate"}>{tab.count}</StatusBadge>
                  </div>
                  <p className="mt-4 text-base font-black text-white">{tab.label}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-3">
            {groups[activeTab].map((lead, index) => {
              const stage = stageOf(lead);
              const message = lead.message || lead.requirements || "No message added yet.";
              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.025 }}
                  className="rounded-3xl border border-white/10 bg-white/[.04] p-5 transition hover:border-white/20 hover:bg-white/[.065]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-black text-white">{lead.name || "Unknown lead"}</h2>
                        <StatusBadge tone={toneFor(stage)}>{stage}</StatusBadge>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-white/40">{lead.email || lead.phone || "No contact shown"} · {lead.source || "Public page"} · {displayDate(lead.createdAt)}</p>
                      <p className="mt-3 text-sm font-bold text-white/70">{lead.serviceNeeded || lead.selectedOption || "General enquiry"}</p>
                      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/45">{message}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {!loading && groups[activeTab].length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/12 bg-white/[.025] p-10 text-center">
                <Inbox className="mx-auto h-8 w-8 text-white/28" />
                <p className="mt-4 text-lg font-black text-white/75">Nothing here yet</p>
                <p className="mt-2 text-sm text-white/38">New real leads will appear in this section when prospects use your booking page.</p>
              </div>
            )}
          </div>
        </GlassPanel>
      </main>
    </PremiumMotionBackground>
  );
}
