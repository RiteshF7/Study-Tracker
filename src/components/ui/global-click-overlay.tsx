"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Particle = { id: number; x: number; y: number; color: string };
type Ripple = { id: number; x: number; y: number; color: string };

function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shouldSkip(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.closest("[data-no-spark]")) return true;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ((el as any).isContentEditable) return true;
  const role = el.getAttribute("role");
  if (role === "textbox" || role === "slider" || role === "progressbar") return true;
  return false;
}

function getAccentColor() {
  if (typeof window === "undefined") return "hsl(200, 100%, 60%)";
  const style = getComputedStyle(document.documentElement);
  const accent = style.getPropertyValue("--accent") || style.getPropertyValue("--primary");
  return `hsl(${accent.trim()})`;
}

function pickColor(accent: string) {
  const r = Math.random();
  if (r < 0.6) {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 70%)`;
  }
  return accent;
}

function getIntensity() {
  try {
    const raw = localStorage.getItem("st-animation-intensity");
    if (raw) return raw as "Off" | "Subtle" | "Normal" | "Extra";
  } catch {}
  return "Extra";
}

function isEnabled() {
  try {
    const raw = localStorage.getItem("st-animations-enabled");
    if (raw === "false") return false;
    if (raw === "true") return true;
  } catch {}
  return true;
}

function particleCountFor(intensity: "Off" | "Subtle" | "Normal" | "Extra") {
  const mobile = isCoarsePointer();
  const map = {
    Off: 0,
    Subtle: mobile ? 3 : 5,
    Normal: mobile ? 5 : 8,
    Extra: mobile ? 8 : 12,
  } as const;
  return map[intensity];
}

export function GlobalClickOverlay() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const lastTimeRef = useRef(0);
  const disabledRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onClick = (e: MouseEvent) => {
      if (disabledRef.current) return;
      const now = performance.now();
      if (now - lastTimeRef.current < 100) return;
      lastTimeRef.current = now;
      if (shouldSkip(e.target)) return;
      if (!isEnabled()) return;
      const intensity = getIntensity();
      const count = particleCountFor(intensity as any);
      if (count <= 0) return;
      const accent = getAccentColor();
      const x = e.clientX;
      const y = e.clientY;
      const idBase = Date.now();
      const newParticles: Particle[] = Array.from({ length: count }).map((_, i) => ({
        id: idBase + i,
        x,
        y,
        color: pickColor(accent),
      }));
      const ripple: Ripple = { id: idBase + 9999, x, y, color: accent };
      setParticles(prev => [...prev, ...newParticles]);
      setRipples(prev => [...prev, ripple]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id < idBase || p.id >= idBase + count));
        setRipples(prev => prev.filter(r => r.id !== ripple.id));
      }, 800);
    };
    window.addEventListener("click", onClick, true);
    let samples = 0;
    let total = 0;
    let last = performance.now();
    const monitor = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      total += dt;
      samples += 1;
      if (samples >= 60) {
        const avg = total / samples;
        if (avg > 32) disabledRef.current = true;
        samples = 0;
        total = 0;
      }
      if (!disabledRef.current) requestAnimationFrame(monitor);
    };
    requestAnimationFrame(monitor);
    return () => {
      window.removeEventListener("click", onClick, true);
      disabledRef.current = false;
    };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, scale: 1, opacity: 1 }}
            animate={{
              x: p.x + Math.cos((p.id % 360) * (Math.PI / 180)) * 60,
              y: p.y + Math.sin((p.id % 360) * (Math.PI / 180)) * 60,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: p.color,
            }}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {ripples.map(r => (
          <motion.div
            key={r.id}
            initial={{ x: r.x - 16, y: r.y - 16, scale: 0.8, opacity: 0.2 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 32,
              height: 32,
              borderRadius: "9999px",
              backgroundColor: r.color,
              filter: "blur(2px)",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

