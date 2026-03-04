"use client";

import { useRef, useEffect } from "react";
import type { GasStatus } from "@/types";

interface GasCardProps {
  raw: number;
  status: GasStatus;
  ppm: number;
  history: number[];
  isAlert: boolean;
}

const STATUS_COLORS: Record<GasStatus, string> = {
  GOOD: "text-teal",
  MODERATE: "text-amber",
  DANGER: "text-danger",
};

export default function GasCard({ raw, status, ppm, history, isAlert }: GasCardProps) {
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

    const last8 = history.slice(-8);
    const gap = 4;
    const barWidth = (w - gap * (last8.length - 1)) / last8.length;
    const maxVal = 1000;

    last8.forEach((val, i) => {
      const barH = Math.max(2, (val / maxVal) * h * 0.9);
      const x = i * (barWidth + gap);
      const y = h - barH;

      if (val > 800) {
        ctx.fillStyle = "rgba(255, 51, 51, 0.8)";
      } else if (val > 400) {
        ctx.fillStyle = "rgba(255, 170, 0, 0.8)";
      } else {
        ctx.fillStyle = "rgba(0, 255, 204, 0.6)";
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 2);
      ctx.fill();
    });
  }, [history]);

  return (
    <div className={`card-glass rounded-2xl p-4 ${isAlert ? "glow-danger" : "glow-teal"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
          <path d="M6.5 6.5c1.5-2.5 4-4 6-4s3.5 1 4.5 3c1 2 0 5-2 7s-4.5 3-4.5 5.5" />
          <path d="M12 22v-2" />
        </svg>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Gas Level
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-1">
        <p className={`text-3xl font-bold tabular-nums ${isAlert ? "text-danger" : "text-white"}`}>
          {raw}
        </p>
      </div>
      <p className={`text-xs font-semibold ${STATUS_COLORS[status]}`}>{status}</p>

      {/* PPM label */}
      <p className="text-[10px] text-muted mt-2 mb-2">
        {ppm} <span className="uppercase">Concentration PPM</span>
      </p>

      {/* Bar chart */}
      <canvas
        ref={canvasRef}
        className="w-full h-14"
        style={{ display: "block" }}
      />
    </div>
  );
}
