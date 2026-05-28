"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function PremiumMotionBackground({ children, variant = "prospect" }: { children?: ReactNode; variant?: "prospect" | "owner" }) {
  const reduceMotion = useReducedMotion();
  const ownerMode = variant === "owner";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03040b] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(99,102,241,.34),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,.22),transparent_36%),linear-gradient(135deg,#03040b_0%,#06091a_48%,#05020b_100%)]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(148,163,184,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.9)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="premium-flow-line premium-flow-a" />
        <div className="premium-flow-line premium-flow-b" />

        {!reduceMotion && (
          <>
            <motion.div
              className="absolute -left-20 top-12 h-72 w-72 rounded-full border border-indigo-300/10 bg-[radial-gradient(circle_at_35%_25%,rgba(129,140,248,.32),rgba(79,70,229,.05)_50%,transparent_72%)] blur-[.2px]"
              animate={{ y: [0, -24, 8], x: [0, 18, -6], rotate: [0, 7, -3] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute bottom-10 right-[-80px] h-96 w-96 rounded-full border border-cyan-300/10 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.22),rgba(147,51,234,.08)_50%,transparent_72%)]"
              animate={{ y: [0, 28, -12], x: [0, -18, 10], rotate: [0, -10, 4] }}
              transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="premium-band premium-band-one"
              animate={{ rotate: 360 }}
              transition={{ duration: ownerMode ? 32 : 24, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="premium-band premium-band-two"
              animate={{ rotate: -360 }}
              transition={{ duration: ownerMode ? 44 : 30, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}

        {Array.from({ length: ownerMode ? 10 : 16 }).map((_, index) => (
          <span
            key={index}
            className="premium-particle"
            style={{
              left: `${8 + ((index * 17) % 88)}%`,
              top: `${7 + ((index * 23) % 84)}%`,
              animationDelay: `${index * 0.55}s`,
              animationDuration: `${8 + (index % 6)}s`,
            }}
          />
        ))}
      </div>
      <div className="relative z-10">{children}</div>
      <style>{`
        .signature-font{font-family:"Brush Script MT","Segoe Script","Snell Roundhand",cursive;letter-spacing:.02em;}
        .premium-flow-line{position:absolute;height:1px;width:62vw;background:linear-gradient(90deg,transparent,rgba(129,140,248,.6),rgba(34,211,238,.34),transparent);filter:blur(.2px);opacity:.35;}
        .premium-flow-a{left:-10vw;top:24vh;transform:rotate(16deg);animation:flowMove 9s ease-in-out infinite alternate;}
        .premium-flow-b{right:-12vw;bottom:26vh;transform:rotate(-12deg);animation:flowMove 11s ease-in-out infinite alternate-reverse;}
        .premium-band{position:absolute;border-radius:9999px;border:2px solid transparent;background:linear-gradient(#03040b,#03040b) padding-box,linear-gradient(135deg,rgba(129,140,248,.85),rgba(34,211,238,.08),rgba(168,85,247,.8)) border-box;box-shadow:0 0 42px rgba(99,102,241,.28),inset 0 0 34px rgba(255,255,255,.03);transform-style:preserve-3d;}
        .premium-band:before{content:"";position:absolute;inset:11%;border-radius:9999px;border:1px solid rgba(255,255,255,.08);filter:blur(.1px);}
        .premium-band-one{right:7vw;top:5vh;width:168px;height:62px;transform:rotateX(62deg) rotateZ(22deg);}
        .premium-band-two{left:8vw;bottom:10vh;width:118px;height:44px;transform:rotateX(68deg) rotateZ(-18deg);opacity:.65;}
        .premium-particle{position:absolute;width:4px;height:4px;border-radius:9999px;background:rgba(129,140,248,.8);box-shadow:0 0 12px rgba(129,140,248,.9);animation:particleDrift ease-in-out infinite alternate;}
        @keyframes particleDrift{from{transform:translate3d(0,0,0);opacity:.32}to{transform:translate3d(14px,-22px,0);opacity:.95}}
        @keyframes flowMove{from{opacity:.12;translate:-24px 0}to{opacity:.48;translate:28px 0}}
      `}</style>
    </div>
  );
}

export function GlassPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-[0_18px_80px_rgba(0,0,0,.4)] backdrop-blur-2xl ${className}`}>
      {children}
    </div>
  );
}

export function StatusBadge({ children, tone = "indigo" }: { children: ReactNode; tone?: "indigo" | "emerald" | "amber" | "slate" | "red" }) {
  const tones = {
    indigo: "border-indigo-400/30 bg-indigo-500/10 text-indigo-200",
    emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    slate: "border-white/10 bg-white/5 text-white/60",
    red: "border-red-400/30 bg-red-500/10 text-red-200",
  } as const;

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}
