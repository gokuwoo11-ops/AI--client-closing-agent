"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  MessageSquare,
  TrendingUp,
  Mail,
  Zap,
  Calendar,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Building,
  UserCheck,
  ChevronRight,
  ArrowRight,
  Play,
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("agencies");

  const niches = [
    {
      id: "agencies",
      label: "Agencies & Devs",
      text: "Qualify high-ticket client inquiries, filter budget sizes, and book project discovery calls automatically.",
    },
    {
      id: "realestate",
      label: "Real Estate",
      text: "Reply instantly to home seekers, gather timeline/budget preferences, and schedule property viewings.",
    },
    {
      id: "clinics",
      label: "Clinics & Coaches",
      text: "Capture consult requests 24/7, answer common treatment/FAQ concerns, and secure calendar slots.",
    },
    {
      id: "freelancers",
      label: "Freelancers",
      text: "Stop letting messages pile up. Let the AI qualify your leads and schedule them right into your Calendly.",
    },
  ];

  return (
    <div className="bg-[#05070f] text-gray-100 min-h-screen relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[60%] bg-pink-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" />

      {/* HEADER NAVBAR */}
      <header className="border-b border-white/5 bg-[#05070f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
              AI Client Closing Agent
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <Link href="#problem" className="hover:text-white transition-colors">The Problem</Link>
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md shadow-indigo-500/10 transition-colors"
            >
              Start Setup
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Omnichannel AI Closing Inbox
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Turn Client Inquiries Into{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Booked Calls Automatically
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto font-medium">
            AI Client Closing Agent replies instantly to new leads, asks the right questions, follows up, and helps book appointments while you focus on your work.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/sign-up"
              className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              Start Setup
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-white" />
              View Product Flow
            </Link>
          </div>

          {/* Product Interface Preview */}
          <div className="pt-12">
            <div className="glassmorphism rounded-2xl border border-white/5 p-3 shadow-2xl max-w-4xl mx-auto relative group">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-300" />
              <div className="bg-[#090c15] rounded-xl overflow-hidden border border-white/5 aspect-[16/10] flex flex-col">
                {/* Browser Bar */}
                <div className="bg-[#0c101d] px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/40" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/40" />
                    <span className="w-3 h-3 rounded-full bg-green-500/40" />
                  </div>
                  <div className="bg-white/5 rounded-md text-[10px] text-gray-500 px-6 py-1 mx-auto w-80 truncate text-center">
                    https://closingagent.ai/dashboard
                  </div>
                </div>
                {/* Product Content */}
                <div className="flex-1 flex text-left text-xs text-gray-400 overflow-hidden">
                  <div className="w-48 bg-[#0a0d17] p-4 border-r border-white/5 hidden md:block space-y-4">
                    <div className="h-4 w-28 bg-white/10 rounded-md" />
                    <div className="space-y-2">
                      <div className="h-6 w-full bg-indigo-600/10 border border-indigo-500/20 rounded-md" />
                      <div className="h-6 w-full bg-white/5 rounded-md" />
                      <div className="h-6 w-full bg-white/5 rounded-md" />
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                        <div>
                          <p className="text-white font-bold text-sm">Leads Overview</p>
                          <p className="text-[10px] text-gray-500">Live AI agent closed transactions</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold text-[10px]">
                          18 Active Closing
                        </span>
                      </div>
                      {/* Conversation Preview */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-[10px]">L</div>
                          <div className="bg-[#0f1423] p-3 rounded-xl rounded-tl-none border border-white/5 max-w-sm">
                            <p className="text-gray-300 leading-relaxed text-[11px]">Hi, I need a modern marketing website built for my interior design agency. My budget is $5,000 and I need it in 4 weeks.</p>
                          </div>
                        </div>
                        <div className="flex items-start justify-end gap-2.5">
                          <div className="bg-indigo-600/10 border border-indigo-500/20 p-3 rounded-xl rounded-tr-none max-w-sm text-right">
                            <p className="text-indigo-200 leading-relaxed text-[11px]">That sounds like a beautiful project! I can confirm our design team regularly delivers customized agency portfolios inside 3-4 weeks. Let&apos;s get you scheduled. Click below to book:</p>
                            <span className="inline-block mt-2 text-[10px] bg-indigo-600 text-white font-bold px-3 py-1 rounded-md">📅 Book Discovery Call</span>
                          </div>
                          <div className="h-7 w-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-[10px]">AI</div>
                        </div>
                      </div>
                    </div>
                    {/* Metrics Footer */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 text-center">
                      <div>
                        <p className="text-[10px] text-gray-500">Leads Today</p>
                        <p className="text-white font-bold text-sm">+24</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Conversion Rate</p>
                        <p className="text-emerald-400 font-bold text-sm">34.8%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500">Hours Saved</p>
                        <p className="text-indigo-400 font-bold text-sm">45 hrs</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section id="problem" className="py-20 border-t border-white/5 bg-[#090b15]/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Why service businesses lose clients online</h2>
            <p className="text-gray-400">
              When an inquiry comes in, your response time is the single most critical factor deciding whether a lead buys from you or goes to a competitor.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-red-500/20 transition-colors">
              <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400 mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">The Speed Dilemma</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Replying more than 5 minutes late decreases your chances of qualifying a lead by 10x. But you cannot stay glued to your phone 24/7.
              </p>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-red-500/20 transition-colors">
              <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400 mb-4">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Manual Follow-ups</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Over 70% of business inquiries are lost because owners forget to follow up. Writing manual sequence check-ins is exhausting and slow.
              </p>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-red-500/20 transition-colors">
              <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400 mb-4">
                <Bot className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Basic Chatbot Failure</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Standard chatbots feel robotic, fail to qualify, cannot address custom services, and don&apos;t save structured contact profiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION / NICHE USE CASE MODULE */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Designed to close clients in any industry niche
              </h2>
              <p className="text-gray-400">
                AI Client Closing Agent connects immediately with your specific service catalogue, team working hours, and standard business FAQs to generate responses that convert.
              </p>
              <div className="space-y-3">
                {niches.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setActiveTab(n.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      activeTab === n.id
                        ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-300 font-bold shadow-md shadow-indigo-500/5"
                        : "bg-white/[0.01] border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{n.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                    {activeTab === n.id && (
                      <p className="text-xs text-gray-400 mt-2 font-normal leading-relaxed">{n.text}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Visual Panel representing chat widget */}
            <div className="glassmorphism rounded-2xl border border-white/5 p-6 shadow-2xl relative">
              <p className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                <Bot className="h-4.5 w-4.5 text-indigo-400" />
                Contextual Conversation Qualify Funnel
              </p>
              <div className="bg-[#060812] rounded-xl border border-white/5 p-4 space-y-4 text-xs">
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">AI Assistant Step Checklist:</span>
                  <div className="flex items-center gap-2 text-indigo-300">
                    <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>Collect Lead Details (Name, Phone, Email)</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-300">
                    <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>Validate Service Match & Budget Range</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-300 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-pink-500 shrink-0 animate-ping" />
                    <span>Offer Custom Calendly Meeting Link</span>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-3 mt-3">
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-2">Automated Owner SMS & Email Alert:</p>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-1">
                    <p className="text-[11px] text-white font-bold">🚨 New Qualified Booking Call</p>
                    <p className="text-[10px] text-gray-400 font-medium">Lead: Marcus Aurelius &bull; $4,500 Web Budget</p>
                    <p className="text-[10px] text-indigo-400 hover:underline">Link to Lead Profile &rarr;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="py-20 border-t border-white/5 bg-[#090b15]/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">Full-stack SaaS modules to double your sales</h2>
            <p className="text-gray-400">
              Not just a simple script. AI Client Closing Agent offers a full lead management suite out of the box.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.02] hover:-translate-y-0.5 active:translate-y-0 transition-all">
              <Bot className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Intelligent LLM Reply</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Uses GPT-4o systems combined with your uploaded services and FAQ sheets to speak like a professional sales person.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.02] hover:-translate-y-0.5 active:translate-y-0 transition-all">
              <MessageSquare className="h-8 w-8 text-pink-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Embeddable Web Widget</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Copy and paste a simple &lt;script&gt; tag into your site to instantly load a gorgeous floating qualifying bot.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.02] hover:-translate-y-0.5 active:translate-y-0 transition-all">
              <TrendingUp className="h-8 w-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Lead CRM Dashboard</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                View incoming contacts in real-time. Review summaries, lead scores, and see chronology messages in a clean portal.
              </p>
            </div>
            {/* Feature 4 */}
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.02] hover:-translate-y-0.5 active:translate-y-0 transition-all">
              <Mail className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Follow-up Sequences</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Create sequence rules to automatically send email/widget follow-ups if a user becomes inactive before scheduling.
              </p>
            </div>
            {/* Feature 5 */}
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.02] hover:-translate-y-0.5 active:translate-y-0 transition-all">
              <Calendar className="h-8 w-8 text-yellow-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Direct Booking Integration</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Plugs straight into your Calendly or Google appointment system to present slots inside the conversation window.
              </p>
            </div>
            {/* Feature 6 */}
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.02] hover:-translate-y-0.5 active:translate-y-0 transition-all">
              <ShieldCheck className="h-8 w-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Agency Workspace Mode</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Create separate workspace accounts for your own clients. Manage all separate bots, widgets, and leads lists under one roof.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING MODULE */}
      <section id="pricing" className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">SaaS Pricing Plans</h2>
            <p className="text-gray-400">
              Get started with a 14-day free trial on any plan. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Plan 1 */}
            <div className="p-8 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-colors">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Starter</span>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-4xl font-extrabold tracking-tight">$39</span>
                  <span className="ml-1 text-sm font-semibold text-gray-500">/mo</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Best for solo consultants & freelancers</p>
                <div className="border-t border-white/5 my-6" />
                <ul className="space-y-4 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>1 AI Closing Agent</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>100 leads / month limit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Sleek Chat Widget & Form</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Basic CRM Database</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/sign-up"
                className="mt-8 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold text-center border border-white/10 transition-colors cursor-pointer"
              >
                Start Trial
              </Link>
            </div>

            {/* Plan 2 */}
            <div className="p-8 bg-indigo-600/5 border-2 border-indigo-500 rounded-2xl flex flex-col justify-between shadow-xl shadow-indigo-500/5 relative">
              <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-indigo-500 text-[9px] font-bold text-white uppercase">Popular</span>
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Pro</span>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-4xl font-extrabold tracking-tight">$79</span>
                  <span className="ml-1 text-sm font-semibold text-gray-500">/mo</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Perfect for growing service agencies</p>
                <div className="border-t border-indigo-500/20 my-6" />
                <ul className="space-y-4 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>3 AI Closing Agents</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>1,000 leads / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Automated Follow-ups</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Deep Visual CRM Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Branding Removal Option</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/sign-up"
                className="mt-8 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold text-center transition-colors cursor-pointer"
              >
                Start Trial
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="p-8 bg-white/[0.01] border border-white/5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-colors">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Agency</span>
                <div className="mt-4 flex items-baseline text-white">
                  <span className="text-4xl font-extrabold tracking-tight">$149</span>
                  <span className="ml-1 text-sm font-semibold text-gray-500">/mo</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">For web designers managing client sites</p>
                <div className="border-t border-white/5 my-6" />
                <ul className="space-y-4 text-xs text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Unlimited AI Agents</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Unlimited Leads List</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Multi-Workspace Control</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>White-Label Brand Setup</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-400" />
                    <span>Add Team Members</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/sign-up"
                className="mt-8 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold text-center border border-white/10 transition-colors cursor-pointer"
              >
                Start Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 border-t border-white/5 bg-[#090b15]/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-gray-400">Everything you need to know about the AI Closing Sales Assistant</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                Will the AI make fake promises or change my prices?
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Absolutely not. The AI agent operates inside strict guidelines based solely on the business profile information, FAQ sheets, and service details you configure. If asked a question that isn&apos;t in your knowledge base or files, the agent will gracefully declare it doesn&apos;t know and tag the lead for human handoff.
              </p>
            </div>

            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                How does the embeddable chat widget load?
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                It loads via a tiny asynchronously-delivered JavaScript block. In your dashboard, you will receive a custom snippet. Copy and paste it immediately before the closing `&lt;/body&gt;` tag of any website (WordPress, Framer, Webflow, Shopify, custom HTML) and the bubble is live instantly.
              </p>
            </div>

            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                Can I connect separate widgets for my clients?
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Yes! With the Agency Tier, you can open discrete client workspace accounts. Each workspace maintains its own database, FAQs, services list, custom AI agent configuration, and analytics logs to keep details separated.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 border-t border-white/5 text-center relative">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Start booking qualified calls on autopilot</h2>
          <p className="text-base text-gray-400 max-w-xl mx-auto">
            Join agencies and freelancers saving hours of manual replies and sealing high-ticket clients every day.
          </p>
          <div className="pt-4">
            <Link
              href="/sign-up"
              className="inline-flex group px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all items-center gap-2 cursor-pointer"
            >
              Get Started for Free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#05070f] py-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span className="font-bold text-white text-sm">AI Client Closing Agent</span>
          </div>
          <p>&copy; {new Date().getFullYear()} AI Client Closing Agent. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
