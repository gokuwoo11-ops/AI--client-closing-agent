import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PremiumMotionBackground } from "@/components/premium/PremiumMotionBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PremiumMotionBackground>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-gray-100">
        <div className="z-10 mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <Link href="/" className="group">
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
              AI Client Closing Agent
            </span>
          </Link>
        </div>
        <div className="z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.055] p-2 shadow-[0_24px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl">
          {children}
        </div>
      </div>
    </PremiumMotionBackground>
  );
}
