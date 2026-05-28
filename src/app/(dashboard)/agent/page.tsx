"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  Save,
  Plus,
  Trash2,
  BookOpen,
  DollarSign,
  HelpCircle,
  Link as LinkIcon,
  CheckCircle,
} from "lucide-react";
import {
  saveAgentConfig,
  saveService,
  deleteService,
  saveFAQ,
  deleteFAQ,
  getAgentData,
  saveFunnelOptionPage,
  deleteFunnelOptionPage,
  saveFunnelOption,
  deleteFunnelOption,
} from "@/actions/agent";

type FunnelOptionIntent = "ENQUIRY" | "BOOKING" | "BOTH";
type FunnelOption = { id: string; title: string; answer: string; serviceName?: string };
type FunnelOptionPage = { id: string; title: string; subtitle?: string; intent: FunnelOptionIntent; options: FunnelOption[] };

export default function AgentSetupPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [agentName, setAgentName] = useState("Booking Assistant");
  const [tone, setTone] = useState("professional");
  const [bookingLink, setBookingLink] = useState("");
  const [instructions, setInstructions] = useState(
    "Answer using the saved business services and FAQs. Ask qualification questions one at a time. Only show booking slots after the prospect is qualified.",
  );
  const [fallbackMessage, setFallbackMessage] = useState(
    "I apologize, but I'm not certain on that. Let me get one of our team members to contact you directly.",
  );

  const [faqs, setFaqs] = useState<{ id: string; q: string; a: string }[]>([]);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");

  const [services, setServices] = useState<
    { id: string; name: string; price: string; desc: string }[]
  >([]);
  const [newSName, setNewSName] = useState("");
  const [newSPrice, setNewSPrice] = useState("");
  const [newSDesc, setNewSDesc] = useState("");

  const [optionPages, setOptionPages] = useState<FunnelOptionPage[]>([]);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSubtitle, setNewPageSubtitle] = useState("");
  const [newPageIntent, setNewPageIntent] = useState<FunnelOptionIntent>("BOTH");
  const [newOptionByPage, setNewOptionByPage] = useState<Record<string, { title: string; answer: string; serviceName: string }>>({});

  useEffect(() => {
    async function loadAgentData() {
      try {
        const data = await getAgentData();
        if (data.agentConfig) {
          setAgentName(data.agentConfig.name || "Booking Assistant");
          setTone(data.agentConfig.tone || "professional");
          setBookingLink(data.agentConfig.bookingLink || "");
          setInstructions(
            data.agentConfig.customInstructions ||
              "Answer using the saved business services and FAQs. Ask qualification questions one at a time. Only show booking slots after the prospect is qualified.",
          );
          setFallbackMessage(
            data.agentConfig.fallbackMessage ||
              "I am not certain on that. The team can confirm this for you.",
          );
        }
        if (data.businessProfile?.faqs) {
          setFaqs(
            data.businessProfile.faqs.map((faq: any) => ({
              id: faq.id,
              q: faq.question,
              a: faq.answer,
            })),
          );
        }
        if (data.businessProfile?.services) {
          setServices(
            data.businessProfile.services.map((service: any) => ({
              id: service.id,
              name: service.name,
              price: service.price || "",
              desc: service.description || "",
            })),
          );
        }
        if (data.funnelOptionPages) {
          setOptionPages(
            data.funnelOptionPages.map((page: any) => ({
              id: page.id,
              title: page.title,
              subtitle: page.subtitle || "",
              intent: page.intent || "BOTH",
              options: (page.options || []).map((option: any) => ({
                id: option.id,
                title: option.title,
                answer: option.answer,
                serviceName: option.serviceName || "",
              })),
            })),
          );
        }
      } catch (err) {
        console.error("Could not load agent data:", err);
      }
    }

    loadAgentData();
  }, []);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ || !newA) return;
    setError("");
    try {
      const result = await saveFAQ({ question: newQ, answer: newA });
      const saved = (result as any).faq;
      setFaqs([
        ...faqs,
        { id: saved?.id || crypto.randomUUID(), q: newQ, a: newA },
      ]);
      setNewQ("");
      setNewA("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save FAQ.";
      setError(message);
      console.error("FAQ save failed:", err);
    }
  };

  const handleRemoveFaq = async (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
    await deleteFAQ(id);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSName) return;
    setError("");
    try {
      const result = await saveService({
        name: newSName,
        price: newSPrice || "Custom",
        description: newSDesc,
      });
      const saved = (result as any).service;
      const svc = {
        id: saved?.id || crypto.randomUUID(),
        name: newSName,
        price: newSPrice || "Custom",
        desc: newSDesc,
      };
      setServices([...services, svc]);
      setNewSName("");
      setNewSPrice("");
      setNewSDesc("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save service.";
      setError(message);
      console.error("Service save failed:", err);
    }
  };

  const handleRemoveService = async (id: string) => {
    setServices(services.filter((s) => s.id !== id));
    await deleteService(id);
  };

  const handleAddOptionPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    setError("");
    try {
      const result = await saveFunnelOptionPage({ title: newPageTitle, subtitle: newPageSubtitle, intent: newPageIntent });
      const saved = (result as any).page;
      setOptionPages([...optionPages, { id: saved.id, title: saved.title, subtitle: saved.subtitle || "", intent: saved.intent || "BOTH", options: [] }]);
      setNewPageTitle("");
      setNewPageSubtitle("");
      setNewPageIntent("BOTH");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save option page.";
      setError(message);
    }
  };

  const handleRemoveOptionPage = async (id: string) => {
    setOptionPages(optionPages.filter((page) => page.id !== id));
    await deleteFunnelOptionPage(id);
  };

  const updateDraftOption = (pageId: string, key: "title" | "answer" | "serviceName", value: string) => {
    setNewOptionByPage((prev) => {
      const current = prev[pageId] || { title: "", answer: "", serviceName: "" };
      return {
        ...prev,
        [pageId]: { ...current, [key]: value },
      };
    });
  };

  const handleAddOption = async (pageId: string) => {
    const draft = newOptionByPage[pageId] || { title: "", answer: "", serviceName: "" };
    if (!draft.title.trim() || !draft.answer.trim()) return;
    setError("");
    try {
      const result = await saveFunnelOption({ pageId, title: draft.title, answer: draft.answer, serviceName: draft.serviceName });
      const saved = (result as any).option;
      setOptionPages(optionPages.map((page) => page.id === pageId
        ? { ...page, options: [...page.options, { id: saved.id, title: saved.title, answer: saved.answer, serviceName: saved.serviceName || "" }] }
        : page,
      ));
      setNewOptionByPage((prev) => ({ ...prev, [pageId]: { title: "", answer: "", serviceName: "" } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save option.";
      setError(message);
    }
  };

  const handleRemoveOption = async (pageId: string, optionId: string) => {
    setOptionPages(optionPages.map((page) => page.id === pageId
      ? { ...page, options: page.options.filter((option) => option.id !== optionId) }
      : page,
    ));
    await deleteFunnelOption(optionId);
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setError("");
    try {
      await saveAgentConfig({
        name: agentName,
        tone,
        bookingLink,
        customInstructions: instructions,
        fallbackMessage,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Save failed.";
      setError(message);
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Bot className="h-7 w-7 text-indigo-400" />
            AI Agent Configuration
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Add the real services, prices, FAQs, and rules the public booking
            assistant should use.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shadow-indigo-500/10 active:translate-y-0.5 disabled:opacity-70"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : success ? (
            <>
              <CheckCircle className="h-4 w-4 text-white" /> Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4 text-white" /> Save Configuration
            </>
          )}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* CORE PARAMS */}
          <div className="glassmorphism rounded-xl border border-white/5 p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Bot className="h-4 w-4 text-indigo-400" /> Agent Profile &
              Instructions
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Agent Display Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Agent Dialogue Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#090d16] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="professional">Professional & Technical</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="luxury">Luxury & Direct</option>
                  <option value="direct">Direct & Persuasive</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Calendly / Booking Link
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="url"
                  value={bookingLink}
                  onChange={(e) => setBookingLink(e.target.value)}
                  placeholder="Real booking link"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                System Prompt Guidelines
              </label>
              <textarea
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Fallback / Handoff Message
              </label>
              <input
                type="text"
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
              />
            </div>
          </div>


          {/* OWNER-CONFIGURABLE FUNNEL OPTIONS */}
          <div className="glassmorphism rounded-xl border border-white/5 p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" /> Booking Page Options
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Control the option page shown to prospects. Add a page, add options, and write the brief saved answer. When a prospect selects an option, AI rewrites that saved answer into a helpful business response before moving them toward booking.
            </p>

            <form onSubmit={handleAddOptionPage} className="grid sm:grid-cols-[1fr_1fr_140px_auto] gap-3 border border-white/5 rounded-xl bg-white/[0.02] p-4">
              <input
                type="text"
                placeholder="Option page title, e.g. What do you need help with?"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              />
              <input
                type="text"
                placeholder="Short subtitle / helper text"
                value={newPageSubtitle}
                onChange={(e) => setNewPageSubtitle(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              />
              <select
                value={newPageIntent}
                onChange={(e) => setNewPageIntent(e.target.value as FunnelOptionIntent)}
                className="px-3 py-2 rounded-lg bg-[#090d16] border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              >
                <option value="BOTH">Both</option>
                <option value="BOOKING">Booking</option>
                <option value="ENQUIRY">Enquiry</option>
              </select>
              <button type="submit" className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold">
                <Plus className="h-3.5 w-3.5" /> Add Page
              </button>
            </form>

            <div className="space-y-4">
              {optionPages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-xs text-gray-500">
                  No custom option page yet. If you leave this empty, the public page will use Services and FAQs as fallback options.
                </div>
              ) : null}
              {optionPages.map((page) => {
                const draft = newOptionByPage[page.id] || { title: "", answer: "", serviceName: "" };
                return (
                  <div key={page.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white">{page.title}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{page.subtitle || "No subtitle"} • {page.intent}</p>
                      </div>
                      <button onClick={() => handleRemoveOptionPage(page.id)} className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {page.options.map((option) => (
                        <div key={option.id} className="rounded-lg border border-white/5 bg-black/10 p-3 flex items-start justify-between gap-3">
                          <div className="text-xs">
                            <p className="font-bold text-white">{option.title}</p>
                            <p className="text-gray-400 mt-1 leading-relaxed">{option.answer}</p>
                            {option.serviceName ? <p className="text-indigo-300 mt-1">Service: {option.serviceName}</p> : null}
                          </div>
                          <button onClick={() => handleRemoveOption(page.id, option.id)} className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 border-t border-white/5 pt-4">
                      <input
                        type="text"
                        placeholder="Option label shown to prospect"
                        value={draft.title}
                        onChange={(e) => updateDraftOption(page.id, "title", e.target.value)}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Related service name (optional)"
                        value={draft.serviceName}
                        onChange={(e) => updateDraftOption(page.id, "serviceName", e.target.value)}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                      <textarea
                        rows={2}
                        placeholder="Brief saved answer. AI will use this to reply better when selected."
                        value={draft.answer}
                        onChange={(e) => updateDraftOption(page.id, "answer", e.target.value)}
                        className="sm:col-span-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs resize-none"
                      />
                      <button type="button" onClick={() => handleAddOption(page.id)} className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold">
                        <Plus className="h-3.5 w-3.5" /> Add Option
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQs */}
          <div className="glassmorphism rounded-xl border border-white/5 p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" /> Knowledge Base
              FAQs
            </h2>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="p-3 bg-white/[0.01] border border-white/5 rounded-lg flex items-start justify-between gap-4"
                >
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-indigo-400 shrink-0" />{" "}
                      Q: {faq.q}
                    </p>
                    <p className="text-gray-400 leading-relaxed pl-5">
                      A: {faq.a}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFaq(faq.id)}
                    className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={handleAddFaq}
              className="border-t border-white/5 pt-4 space-y-3"
            >
              <p className="text-xs font-semibold text-white">
                + Add FAQ Question
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Question customers often ask"
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
                <input
                  type="text"
                  placeholder="Real answer customers should receive."
                  value={newA}
                  onChange={(e) => setNewA(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add to Knowledge Base
              </button>
            </form>
          </div>
        </div>

        {/* Services Catalog */}
        <div className="glassmorphism rounded-xl border border-white/5 p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-indigo-400" /> Service Offer
            Catalogue
          </h2>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            The public booking assistant uses this list to answer prospect
            questions before showing booking slots.
          </p>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="p-3 bg-white/[0.01] border border-white/5 rounded-lg flex items-start justify-between gap-4"
              >
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white">{svc.name}</p>
                    <span className="font-mono text-indigo-400 font-semibold text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded">
                      {svc.price}
                    </span>
                  </div>
                  <p className="text-gray-500 leading-relaxed text-[10px] mt-1">
                    {svc.desc}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveService(svc.id)}
                  className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <form
            onSubmit={handleAddService}
            className="border-t border-white/5 pt-4 space-y-3"
          >
            <p className="text-xs font-semibold text-white">
              + Add Custom Service
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Service Title"
                value={newSName}
                onChange={(e) => setNewSName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-bold">
                  $
                </span>
                <input
                  type="text"
                  placeholder="Price or range"
                  value={newSPrice}
                  onChange={(e) => setNewSPrice(e.target.value)}
                  className="w-full pl-6 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
              <input
                type="text"
                placeholder="Brief description"
                value={newSDesc}
                onChange={(e) => setNewSDesc(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Service Offer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
