"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Bot, Loader2, MessageCircle, Send, User } from "lucide-react";

type Message = {
  id: string;
  senderType: "LEAD" | "AGENT" | "HUMAN";
  content: string;
  createdAt: string;
};

type ConversationData = {
  id: string;
  channel: string;
  lead: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  messages: Message[];
};

export default function CustomerConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();

  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function loadConversation() {
    try {
      setError("");

      const res = await fetch(`/api/conversation/${conversationId}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load conversation");
      }

      setConversation(data.conversation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  async function sendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const text = message.trim();

    if (!text) return;

    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/conversation/${conversationId}/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setMessage("");
      setConversation(data.conversation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070e] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.14),transparent_35%)]" />
      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8">
        <div className="mb-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
              <MessageCircle className="h-5 w-5 text-indigo-300" />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                AI Client Closing Agent
              </p>
              <h1 className="text-xl font-extrabold">
                Continue your conversation
              </h1>
            </div>
          </div>

          <p className="mt-3 text-sm text-gray-400">
            Reply here with more details. The business team will receive the full conversation.
          </p>
        </div>

        <div className="flex-1 rounded-3xl border border-white/10 bg-[#0c101d]/90 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-300" />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-300">{error}</div>
          ) : !conversation ? (
            <div className="p-6 text-sm text-gray-400">Conversation not found.</div>
          ) : (
            <>
              <div className="border-b border-white/10 px-5 py-4">
                <p className="text-sm font-bold text-white">
                  {conversation.lead.name || "Customer"}
                </p>
                <p className="text-xs text-gray-500">
                  Channel: {conversation.channel}
                </p>
              </div>

              <div className="max-h-[55vh] space-y-4 overflow-y-auto p-5">
                {conversation.messages.map((msg) => {
                  const isLead = msg.senderType === "LEAD";

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isLead ? "justify-end" : "justify-start"}`}
                    >
                      {!isLead && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10">
                          <Bot className="h-4 w-4 text-indigo-300" />
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                          isLead
                            ? "rounded-tr-sm border-emerald-500/20 bg-emerald-500/10 text-emerald-50"
                            : "rounded-tl-sm border-indigo-500/20 bg-indigo-500/10 text-indigo-50"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {isLead && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                          <User className="h-4 w-4 text-emerald-300" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
                <div className="flex gap-3">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />

                  <button
                    disabled={sending || !message.trim()}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Send
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-2 text-[11px] text-gray-500">
                  Your response will be saved to the business CRM.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}