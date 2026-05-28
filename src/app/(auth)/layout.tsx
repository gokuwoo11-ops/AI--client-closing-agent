import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#060814] text-gray-100 overflow-hidden px-4">
      {/* Decorative Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* Brand Header */}
      <div className="z-10 mb-8 flex items-center gap-2.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-lg shadow-indigo-500/20">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <Link href="/" className="group">
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent group-hover:text-indigo-300 transition-colors">
            AI Client Closing Agent
          </span>
        </Link>
      </div>

      {/* Main Glass Box Container */}
      <div className="z-10 w-full max-w-md glassmorphism rounded-2xl shadow-2xl shadow-black/50 p-8 border border-white/5">
        {children}
      </div>

      {/* Footer */}
      <div className="z-10 mt-6 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} AI Client Closing Agent. All rights reserved.
      </div>
    </div>
  );
}
