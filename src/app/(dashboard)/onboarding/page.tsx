"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Sparkles,
  Bot,
  ListTodo,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Clock,
  MessageSquarePlus,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState("agencies");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [location, setLocation] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [agentName, setAgentName] = useState("AI assistant name");
  const [tone, setTone] = useState("professional");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleComplete = () => {
    setLoading(true);
    // Simulate API saving Profile, Services, FAQs, and Agent configuration
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  const stepIndicators = [
    { num: 1, label: "Business", icon: Building2 },
    { num: 2, label: "Services", icon: DollarSign },
    { num: 3, label: "AI Agent", icon: Bot },
    { num: 4, label: "FAQ Sheet", icon: ListTodo },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* HEADER SECTION */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Let&apos;s build your AI Client Closing Agent</h1>
        <p className="text-sm text-gray-400 max-w-lg mx-auto">
          Complete these quick setup details to seed your AI knowledge base. You can update this anytime.
        </p>
      </div>

      {/* STEP INDICATOR TABS */}
      <div className="flex justify-between items-center mb-10 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2 z-0" />
        {stepIndicators.map((s) => {
          const isCompleted = step > s.num;
          const isActive = step === s.num;
          return (
            <div key={s.num} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center border font-bold text-sm transition-all shadow-lg",
                  isCompleted
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : isActive
                    ? "bg-[#0c101d] border-indigo-500 text-indigo-300 ring-4 ring-indigo-500/10 shadow-indigo-500/5"
                    : "bg-[#0c101d] border-white/5 text-gray-500"
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-4.5 w-4.5" />}
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-semibold mt-2.5 transition-colors hidden sm:block",
                  isActive ? "text-indigo-400 font-bold" : "text-gray-500"
                )}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* STEP FORMS CONTAINER */}
      <div className="glassmorphism rounded-2xl border border-white/5 p-6 sm:p-8 shadow-2xl relative">
        {/* STEP 1: BUSINESS PROFILE */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" />
              1. Business Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Niche / Industry</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#090d16] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="agencies">Software Agency & Web Dev</option>
                  <option value="consulting">Coaching & Business Consulting</option>
                  <option value="realestate">Real Estate & Brokerage</option>
                  <option value="clinic">Clinic & Medical Practice</option>
                  <option value="creatives">Video Editors & Creatives</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Website URL (Optional)</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://your-business-domain.com"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Business Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Business location"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SERVICES & PRICING */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-400" />
              2. Core Services offered
            </h2>
            <p className="text-xs text-gray-400">
              List at least one primary service. The AI agent will read this price and description when leads ask about project packages.
            </p>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Name</label>
                  <input
                    type="text"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Service name"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Starting Price</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="text"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      placeholder="Service price"
                      className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Service Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe what the service includes."
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: AI AGENT PERSONA */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-400" />
              3. AI Agent Configuration
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="AI assistant name"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferred Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#090d16] border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="professional">Professional & Technical</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="luxury">Luxury & Direct</option>
                  <option value="empathetic">Direct & Persuasive</option>
                </select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Custom Agent Instructions (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Add real rules for how the AI should qualify and reply."
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: FAQ KNOWLEDGE BASE */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-indigo-400" />
              4. Business FAQ Knowledge Base
            </h2>
            <p className="text-xs text-gray-400">
              Provide one common question leads ask (e.g., about refunds, onboarding timelines, or discovery processes) and how the AI should answer.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">FAQ Question</label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="Question customers often ask"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">FAQ Answer</label>
                <textarea
                  rows={3}
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Real answer customers should receive."
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* CONTROLS AREA */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <button
            onClick={prevStep}
            className={cn(
              "px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5",
              step === 1 ? "opacity-0 pointer-events-none" : ""
            )}
            disabled={loading}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous Step
          </button>

          {step < 4 ? (
            <button
              onClick={nextStep}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 active:translate-y-0.5"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              disabled={loading}
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Complete Setup & Launch
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
