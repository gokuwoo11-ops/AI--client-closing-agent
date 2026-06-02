"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

/* ─── Canvas particle system ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0;
    let H = 0;
    let t = 0;

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      life: number; speed: number;
      r: number; hue: number; alpha: number;
    }

    let particles: Particle[] = [];

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }

    function makeParticle(): Particle {
      const hues = [270, 320, 200];
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        life: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
        r: 1 + Math.random() * 1.8,
        hue: hues[Math.floor(Math.random() * hues.length)],
        alpha: 0.18 + Math.random() * 0.42,
      };
    }

    function init() {
      const count = Math.min(100, Math.floor((W * H) / 14000));
      particles = Array.from({ length: count }, makeParticle);
    }

    function drawOrbs() {
      const configs = [
        { cx: W * 0.15, cy: H * 0.18, r: 210, color: "rgba(124,58,237,0.13)", drift: Math.sin(t * 0.38) * 42 },
        { cx: W * 0.82, cy: H * 0.14, r: 190, color: "rgba(236,72,153,0.09)", drift: Math.cos(t * 0.28) * 32 },
        { cx: W * 0.5,  cy: H * 0.88, r: 230, color: "rgba(99,102,241,0.08)", drift: Math.sin(t * 0.48) * 26 },
      ];
      for (const o of configs) {
        const g = ctx!.createRadialGradient(o.cx, o.cy + o.drift, 0, o.cx, o.cy + o.drift, o.r);
        g.addColorStop(0, o.color);
        g.addColorStop(1, "transparent");
        ctx!.beginPath();
        ctx!.arc(o.cx, o.cy + o.drift, o.r, 0, Math.PI * 2);
        ctx!.fillStyle = g;
        ctx!.fill();
      }
    }

    function drawConnections() {
      const len = particles.length;
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 115) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(124,58,237,${(1 - d / 115) * 0.07})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }
    }

    function frame() {
      ctx!.clearRect(0, 0, W, H);
      t += 0.007;
      drawOrbs();
      drawConnections();
      for (const p of particles) {
        p.life += p.speed;
        if (p.life > 1) {
          Object.assign(p, makeParticle());
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const a = Math.sin(p.life * Math.PI) * p.alpha;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue},78%,68%,${a})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(frame);
    }

    resize();
    init();
    frame();

    const handleResize = () => { resize(); init(); };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="draftly-canvas"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}

/* ─── Cursor glow ─── */
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return <div ref={ref} className="draftly-cursor-glow" aria-hidden="true" />;
}

/* ─── PremiumMotionBackground ─── */
export function PremiumMotionBackground({
  children,
  variant = "prospect",
}: {
  children?: ReactNode;
  variant?: "prospect" | "owner";
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06070f] text-white">
      {/* Fixed background layer */}
      <div className="draftly-bg" aria-hidden="true">
        <ParticleCanvas />
        <div className="draftly-grid" />
        {/* Animated scan lines */}
        <div
          className="pointer-events-none absolute h-px"
          style={{
            top: "22%",
            left: 0,
            width: "18rem",
            background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.7),transparent)",
            animation: "draftly-scan 6s linear infinite",
          }}
        />
        <div
          className="pointer-events-none absolute h-px"
          style={{
            top: "68%",
            left: 0,
            width: "18rem",
            background: "linear-gradient(90deg,transparent,rgba(236,72,153,0.5),transparent)",
            animation: "draftly-scan 8s 2.5s linear infinite",
          }}
        />
        {/* Rotating orbit bands — only when motion is OK */}
        {!reduceMotion && (
          <>
            <motion.div
              className="premium-band premium-band-one"
              animate={{ rotate: 360 }}
              transition={{ duration: variant === "owner" ? 36 : 26, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="premium-band premium-band-two"
              animate={{ rotate: -360 }}
              transition={{ duration: variant === "owner" ? 48 : 32, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}
        {/* Floating micro-particles */}
        {Array.from({ length: variant === "owner" ? 8 : 14 }).map((_, i) => (
          <span
            key={i}
            className="premium-particle"
            style={{
              left: `${8 + ((i * 17) % 88)}%`,
              top: `${7 + ((i * 23) % 84)}%`,
              animationDelay: `${i * 0.55}s`,
              animationDuration: `${8 + (i % 6)}s`,
            }}
          />
        ))}
      </div>

      {/* Cursor glow (desktop only) */}
      <CursorGlow />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ─── GlassPanel ─── */
export function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] border border-white/10 bg-white/[0.055] premium-glass-border shadow-[0_24px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── StatusBadge ─── */
type Tone = "indigo" | "violet" | "emerald" | "amber" | "slate" | "red" | "cyan";

const toneMap: Record<Tone, string> = {
  indigo:  "border-indigo-400/30  bg-indigo-500/10  text-indigo-200",
  violet:  "border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-100",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  amber:   "border-amber-400/30   bg-amber-500/10   text-amber-200",
  slate:   "border-white/10       bg-white/5        text-white/60",
  red:     "border-red-400/30     bg-red-500/10     text-red-200",
  cyan:    "border-cyan-400/30    bg-cyan-500/10    text-cyan-200",
};

export function StatusBadge({
  children,
  tone = "indigo",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${toneMap[tone]}`}
    >
      {children}
    </span>
  );
}