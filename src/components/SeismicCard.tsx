"use client";

import { useRef, useEffect } from "react";

interface SeismicCardProps {
  magnitude: number;
  depth: number;
  history: number[];
  isAlert: boolean;
}

export default function SeismicCard({ magnitude, depth, history, isAlert }: SeismicCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const barCount = history.length;
    const gap = 3;
    const barWidth = (w - gap * (barCount - 1)) / barCount;
    const maxVal = 5;

    history.forEach((val, i) => {
      const barH = Math.max(2, (val / maxVal) * h * 0.9);
      const x = i * (barWidth + gap);
      const y = h - barH;

      const normalizedVal = Math.min(val / 2.5, 1);
      const r = Math.round(0 + normalizedVal * 255);
      const g = Math.round(255 - normalizedVal * 200);
      const b = Math.round(204 - normalizedVal * 150);

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
      ctx.fillRect(x, y, barWidth, barH);
    });
  }, [history]);

  return (
    <div className={`card-glass rounded-2xl p-5 ${isAlert ? "glow-danger animate-pulse-glow" : "glow-teal"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
            <path d="M2 12h3l3-9 4 18 4-18 3 9h3" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Seismic Activity
          </span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-teal/10 border border-teal/30 text-[10px] font-bold text-teal uppercase tracking-wider animate-live-pulse">
          Live
        </span>
      </div>

      {/* Values */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className={`text-5xl font-bold tabular-nums ${isAlert ? "text-danger" : "text-white"}`}>
            {magnitude.toFixed(1)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted mt-1">
            Magnitude (Richter)
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-white/80">
            {depth.toFixed(1)} <span className="text-sm text-muted">km</span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted mt-1">
            Depth
          </p>
        </div>
      </div>

      {/* Waveform bars */}
      <canvas
        ref={canvasRef}
        className="w-full h-16"
        style={{ display: "block" }}
      />
    </div>
  );
}
