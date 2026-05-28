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
} from "@/actions/agent";

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
