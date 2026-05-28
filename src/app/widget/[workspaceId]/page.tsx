"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, CalendarCheck, Loader2, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "agent" | "lead";
  content: string;
};

type LeadInfo = {
  name?: string;
  email?: string;
  phone?: string;
  requirements?: string;
};

function extractLeadInfo(text: string, previous: LeadInfo): LeadInfo {
  const updates: LeadInfo = {};
  const email = text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0];
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0];
  const name = text.match(/(?:my name is|i am|i'm|this is|call me)\s+([a-zA-Z][a-zA-Z\s]{1,40})/i)?.[1]?.trim();

  if (email && !previous.email) updates.email = email;
  if (phone && !previous.phone) updates.phone = phone;
  if (name && !previous.name) updates.name = name;
  if (!previous.requirements) updates.requirements = text.slice(0, 500);
  return updates;
}

export default function PublicWebsiteWidgetPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = String(params.workspaceId || "");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "agent",
      content: "Hi! I can help you choose the right service and get you booked. What are you looking for today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({});
  const [leadSaved, setLeadSaved] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const conversationForAI = useMemo(
    () => messages.map((m) => ({ role: m.role === "agent" ? "assistant" : "user", content: m.content })),
    [messages]
  );

  async function saveLeadSnapshot(info: LeadInfo, latestMessage: string) {
    if (leadSaved || (!info.email && !info.phone)) return;
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        name: info.name || "Website Chat Lead",
        email: info.email || null,
        phone: info.phone || null,
        requirements: info.requirements || latestMessage,
        source: "website_chat",
      }),
    });
    if (res.ok) setLeadSaved(true);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading || !workspaceId) return;

    const userMessage: ChatMessage = { id: `${Date.now()}`, role: "lead", content: text };
    const newInfo = { ...leadInfo, ...extractLeadInfo(text, leadInfo) };
    setLeadInfo(newInfo);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          messages: [...conversationForAI, { role: "user", content: text }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI chat is not configured yet.");
      setMessages((prev) => [...prev, { id: `${Date.now()}-ai`, role: "agent", content: data.reply || "Thanks — can you share your phone number or email so our team can confirm this?" }]);
      await saveLeadSnapshot(newInfo, text);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-setup`,
          role: "agent",
          content: error instanceof Error ? error.message : "AI is not configured. Please contact the business directly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#07111f] text-white">
      <div className="flex h-full flex-col rounded-[28px] border border-white/10 bg-gradient-to-br from-[#10182c] via-[#08111f] to-[#111827] shadow-2xl">
        <header className="border-b border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">AI Receptionist</p>
              <p className="flex items-center gap-1.5 text-[11px] text-emerald-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Instant reply system
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-violet-300" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-300">
            <span className="rounded-full bg-white/5 px-3 py-1.5"><ShieldCheck className="mr-1 inline h-3 w-3 text-emerald-300" /> Captures lead</span>
            <span className="rounded-full bg-white/5 px-3 py-1.5"><CalendarCheck className="mr-1 inline h-3 w-3 text-indigo-300" /> Pushes booking</span>
          </div>
        </header>

        <section className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.role === "lead" ? "justify-end" : "justify-start"}`}>
              {message.role === "agent" && <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10"><Bot className="h-3.5 w-3.5" /></div>}
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === "lead" ? "bg-indigo-500 text-white" : "bg-white/8 text-slate-100 ring-1 ring-white/10"}`}>
                {message.content}
              </div>
              {message.role === "lead" && <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-400/20"><UserRound className="h-3.5 w-3.5" /></div>}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-300" /> AI is replying...
            </div>
          )}
          <div ref={endRef} />
        </section>

        <form onSubmit={submit} className="border-t border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pricing, availability, booking..."
              className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-500"
              disabled={loading}
            />
            <button disabled={!input.trim() || loading} className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-500">Real messages only. Configure Gemini to enable AI replies.</p>
        </form>
      </div>
    </main>
  );
}
