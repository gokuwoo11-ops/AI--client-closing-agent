"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "agent" | "user";
  content: string;
  time: string;
}

interface LeadInfo {
  name?: string;
  email?: string;
  phone?: string;
  budget?: string;
  requirements?: string;
}

export default function ChatWidget({
  workspaceId,
  agentName = "Sales Assistant",
  agentConfig,
  businessProfile,
}: {
  workspaceId: string;
  agentName?: string;
  agentConfig?: Record<string, unknown>;
  businessProfile?: Record<string, unknown>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "agent",
      content: `Hi there! 👋 I'm ${agentName}. How can I help you today? I'd love to learn about your project.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({});
  const [leadSaved, setLeadSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Try to extract lead info from message content
  const extractLeadInfo = (text: string) => {
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/(\+?\d[\d\s\-()]{7,}\d)/);
    const budgetMatch = text.match(/[$₹£€]?\s*[\d,]+k?(\s*(usd|inr|per month|\/mo|monthly))?/i);

    const updates: LeadInfo = {};
    if (emailMatch && !leadInfo.email) updates.email = emailMatch[0];
    if (phoneMatch && !leadInfo.phone) updates.phone = phoneMatch[0];
    if (budgetMatch && !leadInfo.budget) updates.budget = budgetMatch[0];
    if (!leadInfo.requirements) updates.requirements = text.slice(0, 200);

    if (Object.keys(updates).length > 0) {
      setLeadInfo((prev) => ({ ...prev, ...updates }));
    }
  };

  // Save lead when we have enough info
  const saveLead = async (info: LeadInfo) => {
    if (leadSaved || (!info.email && !info.phone)) return;
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          name: info.name,
          email: info.email,
          phone: info.phone,
          requirements: info.requirements,
          budget: info.budget,
          source: "chat_widget",
        }),
      });
      setLeadSaved(true);
    } catch (err) {
      console.warn("Lead save failed:", err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Extract lead info from user message
    extractLeadInfo(text);

    // Check if this is user sharing name
    const nameMatch = text.match(/(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+)/i);
    if (nameMatch && !leadInfo.name) {
      setLeadInfo((prev) => ({ ...prev, name: nameMatch[1] }));
    }

    try {
      const conversationHistory = messages
        .concat(userMsg)
        .map((m) => ({ role: m.role === "agent" ? "assistant" : "user", content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory,
          agentConfig: agentConfig || { name: agentName },
          businessProfile: businessProfile || {},
          workspaceId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI chat is not configured.");
      const reply = data.reply || "";

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Try to save lead after a few messages
      if (messages.length >= 2) {
        const updatedInfo = { ...leadInfo };
        if (nameMatch) updatedInfo.name = nameMatch[1];
        await saveLead(updatedInfo);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content: err instanceof Error ? err.message : "AI chat is unavailable. Please try again later.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 z-50 active:scale-95"
        aria-label="Open chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-[#0c101d] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-200">

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">{agentName}</h3>
              <p className="text-indigo-100 text-xs flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <Sparkles className="h-3 w-3" /> AI is online
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-indigo-500/20 border border-indigo-500/30"
                      : "bg-white/10 border border-white/10"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-indigo-300" />
                  ) : (
                    <Bot className="h-4 w-4 text-gray-300" />
                  )}
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[75%] text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-white/5 text-gray-200 rounded-tl-sm border border-white/5"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <span className="block mt-1 text-[10px] opacity-50">{msg.time}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white/10 border border-white/10 shrink-0">
                  <Bot className="h-4 w-4 text-gray-300" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/5 border border-white/5 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 text-indigo-400 animate-spin" />
                  <span className="text-xs text-gray-400">Typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-black/20 border-t border-white/5 shrink-0">
            <form onSubmit={handleSend} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="text-center mt-2 text-[10px] text-gray-500">
              Powered by <span className="text-indigo-400">AI Client Closing Agent</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
