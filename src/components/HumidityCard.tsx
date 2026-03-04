"use client";

import { useRef, useEffect } from "react";

interface HumidityCardProps {
  percent: number;
  history: number[];
}

export default function HumidityCard({ percent, history }: HumidityCardProps) {
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

    if (history.length < 2) return;

    const minVal = Math.min(...history) - 2;
    const maxVal = Math.max(...history) + 2;
    const range = maxVal - minVal || 1;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(0, 255, 204, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    history.forEach((val, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((val - minVal) / range) * h * 0.8 - h * 0.1;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(0, 255, 204, 0.08)");
    grad.addColorStop(1, "rgba(0, 255, 204, 0)");
    ctx.fillStyle = grad;
    ctx.fill();
  }, [history]);

  return (
    <div className="card-glass rounded-2xl p-4 glow-teal">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Humidity
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal/60">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </div>

      <p className="text-3xl font-bold tabular-nums text-white">
        {Math.round(percent)}%
      </p>

      <canvas
        ref={canvasRef}
        className="w-full h-10 mt-2"
        style={{ display: "block" }}
      />
    </div>
  );
}
