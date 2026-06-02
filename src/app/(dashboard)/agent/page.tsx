"use client";

import {
  Bot,
  CheckCircle,
  GitBranch,
  Layers3,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  deleteFunnelOption,
  deleteFunnelOptionPage,
  getAgentData,
  saveAgentConfig,
  saveFunnelOption,
  saveFunnelOptionPage,
} from "@/actions/agent";
import { GlassPanel, PremiumMotionBackground, StatusBadge } from "@/components/premium/PremiumMotionBackground";

type FunnelOptionIntent = "ENQUIRY" | "BOOKING" | "BOTH";
type FinalAction = "GO_TO_NEXT_PAGE" | "ASK_REQUIREMENT" | "SHOW_SLOTS";
type FunnelOption = {
  id: string;
  pageId: string;
  title: string;
  answer: string;
  serviceName?: string | null;
  parentOptionId?: string | null;
  nextPageId?: string | null;
  finalAction?: FinalAction | string | null;
};
type FunnelOptionPage = {
  id: string;
  title: string;
  subtitle?: string | null;
  intent: FunnelOptionIntent;
  options: FunnelOption[];
};
type DraftOption = {
  title: string;
  answer: string;
  serviceName: string;
  parentOptionId: string;
  nextPageId: string;
  finalAction: FinalAction;
};

const emptyDraft: DraftOption = {
  title: "",
  answer: "",
  serviceName: "",
  parentOptionId: "",
  nextPageId: "",
  finalAction: "ASK_REQUIREMENT",
};

function niceAction(action?: string | null) {
  if (action === "GO_TO_NEXT_PAGE") return "Opens next page";
  if (action === "SHOW_SLOTS") return "Shows slots";
  return "Asks requirement";
}

export default function AgentSetupPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [agentName, setAgentName] = useState("Booking Assistant");
  const [tone, setTone] = useState("professional");
  const [instructions, setInstructions] = useState(
    "Help prospects choose the right option, explain the selected service clearly, collect their requirement, and move them toward a booked appointment.",
  );
  const [fallbackMessage, setFallbackMessage] = useState(
    "The team will confirm the best details for you.",
  );

  const [pages, setPages] = useState<FunnelOptionPage[]>([]);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSubtitle, setNewPageSubtitle] = useState("");
  const [newPageIntent, setNewPageIntent] = useState<FunnelOptionIntent>("BOTH");
  const [draftByPage, setDraftByPage] = useState<Record<string, DraftOption>>({});
  const [editingOptionByPage, setEditingOptionByPage] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getAgentData()
      .then((data: any) => {
        if (!alive) return;
        if (data?.agentConfig) {
          setAgentName(data.agentConfig.name || "Booking Assistant");
          setTone(data.agentConfig.tone || "professional");
          setInstructions(data.agentConfig.customInstructions || instructions);
          setFallbackMessage(data.agentConfig.fallbackMessage || fallbackMessage);
        }
        setPages(
          (data?.funnelOptionPages || []).map((page: any) => ({
            id: page.id,
            title: page.title,
            subtitle: page.subtitle || "",
            intent: page.intent || "BOTH",
            options: (page.options || []).map((option: any) => ({
              id: option.id,
              pageId: option.pageId || page.id,
              title: option.title,
              answer: option.answer || "",
              serviceName: option.serviceName || "",
              parentOptionId: option.parentOptionId || "",
              nextPageId: option.nextPageId || "",
              finalAction: option.finalAction || (option.nextPageId ? "GO_TO_NEXT_PAGE" : "ASK_REQUIREMENT"),
            })),
          })),
        );
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Could not load AI receptionist."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allOptions = useMemo(
    () => pages.flatMap((page) => page.options.map((option) => ({ ...option, pageTitle: page.title }))),
    [pages],
  );

  const rootPages = pages.filter((page) => page.options.some((option) => !option.parentOptionId));

  function draft(pageId: string) {
    return draftByPage[pageId] || emptyDraft;
  }

  function updateDraft(pageId: string, key: keyof DraftOption, value: string) {
    setDraftByPage((prev) => {
      const current: DraftOption = prev[pageId] || emptyDraft;
      return {
        ...prev,
        [pageId]: { ...current, [key]: value } as DraftOption,
      };
    });
  }

  async function addPage(event: React.FormEvent) {
    event.preventDefault();
    if (!newPageTitle.trim()) return;
    setError("");
    try {
      const result = await saveFunnelOptionPage({ title: newPageTitle.trim(), subtitle: newPageSubtitle.trim(), intent: newPageIntent });
      const page = (result as any).page;
      setPages((prev) => [...prev, { id: page.id, title: page.title, subtitle: page.subtitle || "", intent: page.intent || "BOTH", options: [] }]);
      setNewPageTitle("");
      setNewPageSubtitle("");
      setNewPageIntent("BOTH");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add option page.");
    }
  }

  async function removePage(pageId: string) {
    setPages((prev) => prev.filter((page) => page.id !== pageId));
    await deleteFunnelOptionPage(pageId).catch(() => null);
  }

  function startEditOption(pageId: string, option: FunnelOption) {
    setEditingOptionByPage((prev) => ({ ...prev, [pageId]: option.id }));
    setDraftByPage((prev) => ({
      ...prev,
      [pageId]: {
        title: option.title || "",
        answer: option.answer || "",
        serviceName: option.serviceName || "",
        parentOptionId: option.parentOptionId || "",
        nextPageId: option.nextPageId || "",
        finalAction:
          (option.finalAction as FinalAction) ||
          (option.nextPageId ? "GO_TO_NEXT_PAGE" : "ASK_REQUIREMENT"),
      },
    }));
  }

  function cancelEditOption(pageId: string) {
    setEditingOptionByPage((prev) => {
      const next = { ...prev };
      delete next[pageId];
      return next;
    });
    setDraftByPage((prev) => ({ ...prev, [pageId]: emptyDraft }));
  }

  async function saveOption(pageId: string) {
    const item = draft(pageId);
    const editingOptionId = editingOptionByPage[pageId] || "";
    if (!item.title.trim() || !item.answer.trim()) return;

    setError("");
    try {
      const result = await saveFunnelOption({
        id: editingOptionId || undefined,
        pageId,
        title: item.title.trim(),
        answer: item.answer.trim(),
        serviceName: item.serviceName.trim(),
        parentOptionId: item.parentOptionId || null,
        nextPageId: item.nextPageId || null,
        finalAction: item.nextPageId
          ? "GO_TO_NEXT_PAGE"
          : item.finalAction === "GO_TO_NEXT_PAGE"
            ? "ASK_REQUIREMENT"
            : item.finalAction,
      });
      const option = (result as any).option;
      const savedOption = {
        id: option.id,
        pageId,
        title: option.title,
        answer: option.answer,
        serviceName: option.serviceName || "",
        parentOptionId: option.parentOptionId || "",
        nextPageId: option.nextPageId || "",
        finalAction: option.finalAction || item.finalAction,
      };

      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== pageId) return page;

          return {
            ...page,
            options: editingOptionId
              ? page.options.map((existing) =>
                  existing.id === editingOptionId ? savedOption : existing,
                )
              : [...page.options, savedOption],
          };
        }),
      );
      cancelEditOption(pageId);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : editingOptionId
            ? "Could not update option."
            : "Could not add option.",
      );
    }
  }

  async function removeOption(pageId: string, optionId: string) {
    if (editingOptionByPage[pageId] === optionId) {
      cancelEditOption(pageId);
    }
    setPages((prev) => prev.map((page) => page.id === pageId ? { ...page, options: page.options.filter((option) => option.id !== optionId) } : page));
    await deleteFunnelOption(optionId).catch(() => null);
  }

  async function saveProfile() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await saveAgentConfig({ name: agentName, tone, customInstructions: instructions, fallbackMessage });
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save receptionist settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PremiumMotionBackground variant="owner">
      <main className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-4 py-7 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="signature-font text-3xl text-amber-200/90">Receptionist Flow</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight text-white">AI Receptionist</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-7 text-white/48">
              Build the exact path your prospects follow: main option, related sub-options, requirement capture, then booking.
            </p>
          </div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_50px_rgba(99,102,241,.28)] transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save receptionist"}
          </button>
        </div>

        {error ? <div className="mb-5 rounded-2xl border border-red-400/25 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-100">{error}</div> : null}

        <GlassPanel className="mb-6 min-w-0 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-cyan-100">
                <GitBranch className="h-3.5 w-3.5" /> Flow options are live
              </div>
              <h2 className="text-2xl font-black text-white">Create option chains like: Website → New website → Book slot</h2>
              <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-white/48">
                Add a main option with <span className="text-white">No parent</span>. Then add the next option and choose <span className="text-white">After: main option</span>. The public booking page will show that next option only after the previous one is selected.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/16 px-4 py-3 text-xs font-bold leading-6 text-white/52">
              Main option → Child option → Requirement → Slot → Saved lead
            </div>
          </div>
        </GlassPanel>

        <div className="grid w-full min-w-0 grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <section className="min-w-0 space-y-6">
            <GlassPanel className="min-w-0 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/14 text-indigo-200"><Bot className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-black text-white">Assistant style</h2>
                  <p className="text-xs font-semibold text-white/38">Owner-facing controls only</p>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[.18em] text-white/35">Display name</span>
                  <input value={agentName} onChange={(event) => setAgentName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-300/50" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[.18em] text-white/35">Tone</span>
                  <select value={tone} onChange={(event) => setTone(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#090d16] px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-300/50">
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="premium">Premium and concise</option>
                    <option value="direct">Direct and confident</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[.18em] text-white/35">Response rules</span>
                  <textarea rows={5} value={instructions} onChange={(event) => setInstructions(event.target.value)} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm font-semibold leading-7 text-white outline-none focus:border-indigo-300/50" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[.18em] text-white/35">Handoff message</span>
                  <input value={fallbackMessage} onChange={(event) => setFallbackMessage(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-300/50" />
                </label>
              </div>
            </GlassPanel>

            <GlassPanel className="min-w-0 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-200"><GitBranch className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-black text-white">Flow preview</h2>
                  <p className="text-xs font-semibold text-white/38">Main choices and child pages</p>
                </div>
              </div>
              <div className="space-y-3">
                {loading ? <p className="text-sm font-bold text-white/45">Please wait...</p> : null}
                {rootPages.length === 0 && !loading ? <p className="rounded-2xl border border-dashed border-white/12 bg-white/[.025] p-4 text-sm font-semibold leading-7 text-white/42">Create one option page, then add at least one option with No parent. Add child options by choosing After: previous option.</p> : null}
                {pages.map((page) => (
                  <div key={page.id} className="min-w-0 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{page.title}</p>
                        <p className="mt-1 text-xs font-semibold text-white/35">{page.intent} · {page.options.length} options</p>
                      </div>
                      <StatusBadge tone="slate">Page</StatusBadge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {page.options.slice(0, 4).map((option) => (
                        <div key={option.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/16 px-3 py-2 text-xs">
                          <span className="truncate font-bold text-white/66">{option.title}</span>
                          <span className="shrink-0 text-white/32">{option.parentOptionId ? "after option" : option.nextPageId ? "→ page" : niceAction(option.finalAction)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </section>

          <section className="min-w-0 space-y-6">
            <GlassPanel className="min-w-0 p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/14 text-violet-200"><Layers3 className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-black text-white">Option pages</h2>
                  <p className="text-xs font-semibold text-white/38">Main page, then related sub-option pages</p>
                </div>
              </div>
              <form onSubmit={addPage} className="grid min-w-0 grid-cols-1 gap-3 rounded-3xl border border-white/10 bg-white/[.035] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_auto]">
                <input value={newPageTitle} onChange={(event) => setNewPageTitle(event.target.value)} placeholder="Page title" className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/22 focus:border-indigo-300/50" />
                <input value={newPageSubtitle} onChange={(event) => setNewPageSubtitle(event.target.value)} placeholder="Short helper text" className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/22 focus:border-indigo-300/50" />
                <select value={newPageIntent} onChange={(event) => setNewPageIntent(event.target.value as FunnelOptionIntent)} className="rounded-2xl border border-white/10 bg-[#090d16] px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-300/50">
                  <option value="BOTH">Both</option>
                  <option value="BOOKING">Booking</option>
                  <option value="ENQUIRY">Enquiry</option>
                </select>
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-black text-white transition hover:bg-indigo-400"><Plus className="h-4 w-4" /> Add page</button>
              </form>
            </GlassPanel>

            {pages.map((page) => {
              const item = draft(page.id);
              const editingOptionId = editingOptionByPage[page.id] || "";
              const editingOption = page.options.find((option) => option.id === editingOptionId);
              const selectableParentOptions = allOptions.filter((option) => option.id !== editingOptionId);

              return (
                <GlassPanel key={page.id} className="p-6">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-white">{page.title}</h3>
                        <StatusBadge tone="indigo">{page.intent}</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white/42">{page.subtitle || "No helper text"}</p>
                    </div>
                    <button type="button" onClick={() => removePage(page.id)} className="rounded-xl border border-red-400/15 bg-red-500/8 p-2 text-red-200 hover:bg-red-500/14"><Trash2 className="h-4 w-4" /></button>
                  </div>

                  <div className="space-y-3">
                    {page.options.map((option) => {
                      const parent = allOptions.find((candidate) => candidate.id === option.parentOptionId);
                      const next = pages.find((candidate) => candidate.id === option.nextPageId);
                      return (
                        <div key={option.id} className="min-w-0 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-black text-white">{option.title}</p>
                              <p className="mt-2 text-sm font-medium leading-7 text-white/52">{option.answer}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {parent ? <StatusBadge tone="amber">After: {parent.title}</StatusBadge> : <StatusBadge tone="slate">Main option</StatusBadge>}
                                {next ? <StatusBadge tone="emerald">Next: {next.title}</StatusBadge> : <StatusBadge tone="indigo">{niceAction(option.finalAction)}</StatusBadge>}
                                {option.serviceName ? <StatusBadge tone="slate">{option.serviceName}</StatusBadge> : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button type="button" onClick={() => startEditOption(page.id, option)} className="rounded-xl p-2 text-white/38 hover:bg-indigo-500/10 hover:text-indigo-200" title="Edit option"><Pencil className="h-4 w-4" /></button>
                              <button type="button" onClick={() => removeOption(page.id, option.id)} className="rounded-xl p-2 text-white/28 hover:bg-red-500/10 hover:text-red-200" title="Delete option"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-3xl border border-white/10 bg-black/14 p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm font-black text-white">
                        <Sparkles className="h-4 w-4 text-indigo-300" />
                        {editingOption ? `Editing: ${editingOption.title}` : "Add option to this page"}
                      </div>
                      {editingOption ? (
                        <button type="button" onClick={() => cancelEditOption(page.id)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/55 hover:bg-white/5">
                          <X className="h-3.5 w-3.5" /> Cancel edit
                        </button>
                      ) : null}
                    </div>
                    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
                      <input value={item.title} onChange={(event) => updateDraft(page.id, "title", event.target.value)} placeholder="Option title shown to prospect" className="rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/22 focus:border-indigo-300/50" />
                      <input value={item.serviceName} onChange={(event) => updateDraft(page.id, "serviceName", event.target.value)} placeholder="Related service name" className="rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/22 focus:border-indigo-300/50" />
                      <select value={item.parentOptionId} onChange={(event) => updateDraft(page.id, "parentOptionId", event.target.value)} className="rounded-2xl border border-white/10 bg-[#090d16] px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-300/50">
                        <option value="">No parent — show as main option</option>
                        {selectableParentOptions.map((option) => <option key={option.id} value={option.id}>After: {option.title} ({option.pageTitle})</option>)}
                      </select>
                      <select value={item.nextPageId} onChange={(event) => updateDraft(page.id, "nextPageId", event.target.value)} className="rounded-2xl border border-white/10 bg-[#090d16] px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-300/50">
                        <option value="">No next page</option>
                        {pages.filter((candidate) => candidate.id !== page.id).map((candidate) => <option key={candidate.id} value={candidate.id}>Open page: {candidate.title}</option>)}
                      </select>
                      <select value={item.finalAction} onChange={(event) => updateDraft(page.id, "finalAction", event.target.value as FinalAction)} className="rounded-2xl border border-white/10 bg-[#090d16] px-4 py-3 text-sm font-bold text-white outline-none focus:border-indigo-300/50">
                        <option value="ASK_REQUIREMENT">Ask requirement, then slots</option>
                        <option value="SHOW_SLOTS">Show slots after response</option>
                        <option value="GO_TO_NEXT_PAGE">Go to selected next page</option>
                      </select>
                      <div className="md:col-span-2 rounded-2xl border border-white/10 bg-cyan-300/[.055] px-4 py-3 text-xs font-semibold leading-6 text-cyan-50/70">
                        Flow rule: choose <span className="font-black text-white">No parent</span> for first options. Choose <span className="font-black text-white">After: another option</span> when this option should appear only after that earlier option. Choose a next page only when you want to jump to a totally different option page.
                      </div>
                      <textarea rows={4} value={item.answer} onChange={(event) => updateDraft(page.id, "answer", event.target.value)} placeholder="Saved answer AI will rewrite for the prospect" className="md:col-span-2 resize-none rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm font-semibold leading-7 text-white outline-none placeholder:text-white/22 focus:border-indigo-300/50" />
                      <button type="button" onClick={() => saveOption(page.id)} className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.065] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[.1]">
                        {editingOption ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingOption ? "Save option changes" : "Add option"}
                      </button>
                    </div>
                  </div>
                </GlassPanel>
              );
            })}
          </section>
        </div>
      </main>
    </PremiumMotionBackground>
  );
}
