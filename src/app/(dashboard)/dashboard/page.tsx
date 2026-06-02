"use client";

import { motion } from "framer-motion";
import {
  CalendarCheck,
  Clock,
  Inbox,
  Search,
  TrendingUp,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  GlassPanel,
  PremiumMotionBackground,
  StatusBadge,
} from "@/components/premium/PremiumMotionBackground";
import { EnablePushButton } from "@/components/push/EnablePushButton";

type AnyRecord = Record<string, unknown>;

type Lead = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  stage?: string;
  createdAt?: string;
  serviceNeeded?: string;
  selectedOption?: string;
  requirements?: string;
  summary?: string;
  notes?: string;
  timeline?: string;
};

type Appointment = {
  id: string;
  title?: string;
  name?: string;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  startsAt?: string;
  scheduledStart?: string;
  endsAt?: string;
  scheduledEnd?: string;
  status?: string;
  selectedOption?: string;
  serviceNeeded?: string;
  notes?: string;
  requestedTime?: string;
};

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === "object" ? (value as AnyRecord) : null;
}

function arrayFromPayload<T>(payload: unknown, keys: string[]): T[] {
  const record = asRecord(payload);

  if (!record) {
    return Array.isArray(payload) ? (payload as T[]) : [];
  }

  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }

  return [];
}

async function fetchJSON(path: string): Promise<unknown> {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) return null;

  return response.json() as Promise<unknown>;
}

function dateTime(value?: string) {
  if (!value) return "Time not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Time not set";

  return date.toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function getLeadName(lead: Lead) {
  return lead.name || "Unknown lead";
}

function stageOf(lead: Lead) {
  return (lead.stage || lead.status || "New").replace(/_/g, " ");
}

function toneFor(
  stage: string,
): "indigo" | "emerald" | "amber" | "slate" | "red" {
  const low = stage.toLowerCase();

  if (low.includes("closed") || low.includes("won") || low.includes("book")) {
    return "emerald";
  }

  if (low.includes("follow") || low.includes("qualified")) {
    return "amber";
  }

  if (low.includes("lost")) {
    return "red";
  }

  return "indigo";
}

function leadText(lead: Lead) {
  return [
    lead.name,
    lead.email,
    lead.phone,
    lead.source,
    lead.status,
    lead.stage,
    lead.serviceNeeded,
    lead.selectedOption,
    lead.requirements,
    lead.summary,
    lead.notes,
    lead.timeline,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function apptText(appt: Appointment) {
  return [
    appt.title,
    appt.name,
    appt.leadName,
    appt.leadEmail,
    appt.leadPhone,
    appt.status,
    appt.selectedOption,
    appt.serviceNeeded,
    appt.notes,
    appt.requestedTime,
    appt.startsAt,
    appt.scheduledStart,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;

    Promise.allSettled([
      fetchJSON("/api/leads"),
      fetchJSON("/api/appointments"),
    ])
      .then((results) => {
        if (!alive) return;

        const leadPayload =
          results[0].status === "fulfilled" ? results[0].value : null;

        const appointmentPayload =
          results[1].status === "fulfilled" ? results[1].value : null;

        setLeads(
          arrayFromPayload<Lead>(leadPayload, [
            "leads",
            "items",
            "data",
            "results",
          ]),
        );

        setAppointments(
          arrayFromPayload<Appointment>(appointmentPayload, [
            "appointments",
            "bookings",
            "items",
            "data",
            "results",
          ]),
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredLeads = useMemo(
    () =>
      normalizedQuery
        ? leads.filter((lead) => leadText(lead).includes(normalizedQuery))
        : leads,
    [leads, normalizedQuery],
  );

  const filteredAppointments = useMemo(
    () =>
      normalizedQuery
        ? appointments.filter((appt) =>
            apptText(appt).includes(normalizedQuery),
          )
        : appointments,
    [appointments, normalizedQuery],
  );

  const now = Date.now();
  const today = new Date().toDateString();

  const sortedLeads = useMemo(
    () =>
      [...filteredLeads].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      ),
    [filteredLeads],
  );

  const upcomingAppointments = useMemo(
    () =>
      [...filteredAppointments]
        .filter((item) => {
          const start = item.startsAt || item.scheduledStart;
          return !start || new Date(start).getTime() >= now;
        })
        .sort(
          (a, b) =>
            new Date(a.startsAt || a.scheduledStart || 0).getTime() -
            new Date(b.startsAt || b.scheduledStart || 0).getTime(),
        ),
    [filteredAppointments, now],
  );

  const todayAppointments = filteredAppointments.filter((item) => {
    const start = item.startsAt || item.scheduledStart;
    return start && new Date(start).toDateString() === today;
  });

  const followUp = filteredLeads.filter((lead) =>
    stageOf(lead).toLowerCase().includes("follow"),
  );

  const closedWon = filteredLeads.filter((lead) => {
    const stage = stageOf(lead).toLowerCase();
    return stage.includes("closed") || stage.includes("won");
  });

  const newEnquiries = filteredLeads.filter((lead) =>
    ["new", "enquiry"].some((tag) =>
      stageOf(lead).toLowerCase().includes(tag),
    ),
  );

  const noSearchResults =
    Boolean(normalizedQuery) &&
    filteredLeads.length === 0 &&
    filteredAppointments.length === 0;

  const cards = [
    {
      label: "Today's bookings",
      value: todayAppointments.length,
      icon: CalendarCheck,
    },
    {
      label: "New enquiries",
      value: newEnquiries.length,
      icon: Inbox,
    },
    {
      label: "Booked appointments",
      value: upcomingAppointments.length,
      icon: Clock,
    },
    {
      label: "Follow-up needed",
      value: followUp.length,
      icon: TrendingUp,
    },
    {
      label: "Closed / Won",
      value: closedWon.length,
      icon: Trophy,
    },
  ];

  return (
    <PremiumMotionBackground variant="owner">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="signature-font text-3xl text-amber-200/90">
              Owner Console
            </p>

            <h1 className="mt-1 text-4xl font-black tracking-tight text-white">
              Today&apos;s command center
            </h1>

            <p className="mt-2 text-sm font-medium text-white/45">
              Search live leads, bookings, requirements, sources, and statuses.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-[420px]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.055] px-4 py-3 text-sm text-white/70 backdrop-blur-xl">
              <Search className="h-4 w-4 text-white/40" />

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search leads, bookings, notes..."
                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/32"
              />

              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-lg p-1 text-white/35 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <EnablePushButton />
          </div>
        </div>

        {noSearchResults ? (
          <GlassPanel className="mb-6 p-8 text-center">
            <p className="text-lg font-black text-white">
              No matching leads or bookings found.
            </p>

            <p className="mt-2 text-sm text-white/42">
              Try another name, phone, service, option, source, or status.
            </p>
          </GlassPanel>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <GlassPanel className="p-5 transition hover:-translate-y-1 hover:border-indigo-300/25">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-white/38">
                      {card.label}
                    </p>

                    <Icon className="h-5 w-5 text-indigo-300" />
                  </div>

                  <p className="mt-4 text-4xl font-black text-white">
                    {loading ? "—" : card.value}
                  </p>

                  <p className="mt-2 text-xs font-bold text-emerald-200/70">
                    {normalizedQuery ? "Filtered results" : "Active workspace data"}
                  </p>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.9fr_.9fr]">
          <GlassPanel className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Inbox priority</h2>
              <StatusBadge tone="indigo">Enquiries first</StatusBadge>
            </div>

            <div className="space-y-3">
              {sortedLeads.slice(0, 6).map((lead) => {
                const stage = stageOf(lead);

                return (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-white/10 bg-white/[.04] p-4 transition hover:border-white/20 hover:bg-white/[.065]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-white">
                          {getLeadName(lead)}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-white/45">
                          {lead.serviceNeeded ||
                            lead.selectedOption ||
                            lead.source ||
                            "New request"}
                        </p>

                        {(lead.requirements || lead.summary) && (
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/35">
                            {lead.requirements || lead.summary}
                          </p>
                        )}
                      </div>

                      <StatusBadge tone={toneFor(stage)}>{stage}</StatusBadge>
                    </div>
                  </div>
                );
              })}

              {!loading && sortedLeads.length === 0 && !noSearchResults ? (
                <Empty
                  icon={<UsersRound className="h-5 w-5" />}
                  title="No leads yet"
                  text="Send your public booking link to test real capture."
                />
              ) : null}
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">
                Today&apos;s schedule
              </h2>

              <StatusBadge tone="emerald">Sorted by time</StatusBadge>
            </div>

            <div className="space-y-3">
              {upcomingAppointments.slice(0, 6).map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-2xl border border-white/10 bg-white/[.04] p-4"
                >
                  <p className="text-xs font-black uppercase tracking-[.16em] text-indigo-200">
                    {dateTime(appointment.startsAt || appointment.scheduledStart)}
                  </p>

                  <p className="mt-2 font-black text-white">
                    {appointment.title ||
                      appointment.serviceNeeded ||
                      appointment.selectedOption ||
                      "Appointment"}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-white/40">
                    {appointment.leadName || appointment.name || "Lead"}
                  </p>
                </div>
              ))}

              {!loading &&
              upcomingAppointments.length === 0 &&
              !noSearchResults ? (
                <Empty
                  icon={<CalendarCheck className="h-5 w-5" />}
                  title="No upcoming bookings"
                  text="Confirmed bookings will appear here by time."
                />
              ) : null}
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Recent leads</h2>
              <StatusBadge tone="slate">Latest first</StatusBadge>
            </div>

            <div className="space-y-3">
              {sortedLeads.slice(0, 7).map((lead) => {
                const stage = stageOf(lead);

                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {getLeadName(lead)}
                      </p>

                      <p className="truncate text-xs font-semibold text-white/35">
                        {lead.source || lead.email || lead.phone || "Public page"}
                      </p>
                    </div>

                    <StatusBadge tone={toneFor(stage)}>{stage}</StatusBadge>
                  </div>
                );
              })}

              {!loading && sortedLeads.length === 0 && !noSearchResults ? (
                <Empty
                  icon={<Inbox className="h-5 w-5" />}
                  title="No recent leads"
                  text="New enquiries will appear here."
                />
              ) : null}
            </div>
          </GlassPanel>
        </div>
      </main>
    </PremiumMotionBackground>
  );
}

function Empty({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[.025] p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/[.06] text-white/35">
        {icon}
      </div>

      <p className="mt-3 font-black text-white/70">{title}</p>

      <p className="mt-1 text-xs leading-5 text-white/35">{text}</p>
    </div>
  );
}