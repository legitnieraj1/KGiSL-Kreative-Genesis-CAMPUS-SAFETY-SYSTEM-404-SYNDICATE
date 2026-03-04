"use client";

import { useRef, useEffect } from "react";

interface TempCardProps {
  fahrenheit: number;
  trend: number;
  history: number[];
  isAlert: boolean;
}

export default function TempCard({ fahrenheit, trend, history, isAlert }: TempCardProps) {
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

    const minVal = Math.min(...history) - 1;
    const maxVal = Math.max(...history) + 1;
    const range = maxVal - minVal || 1;

    ctx.beginPath();
    ctx.strokeStyle = isAlert ? "rgba(255, 51, 51, 0.8)" : "rgba(0, 255, 204, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    history.forEach((val, i) => {
      const x = (i / (history.length - 1)) * w;
      const y = h - ((val - minVal) / range) * h * 0.8 - h * 0.1;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area under line
    const lastX = w;
    const lastY = h - ((history[history.length - 1] - minVal) / range) * h * 0.8 - h * 0.1;
    ctx.lineTo(lastX, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (isAlert) {
      grad.addColorStop(0, "rgba(255, 51, 51, 0.15)");
      grad.addColorStop(1, "rgba(255, 51, 51, 0)");
    } else {
      grad.addColorStop(0, "rgba(0, 255, 204, 0.1)");
      grad.addColorStop(1, "rgba(0, 255, 204, 0)");
    }
    ctx.fillStyle = grad;
    ctx.fill();
  }, [history, isAlert]);

  const trendStr = trend >= 0 ? `+${Math.abs(trend)}°` : `-${Math.abs(trend)}°`;

  return (
    <div className={`card-glass rounded-2xl p-4 ${isAlert ? "glow-danger" : "glow-teal"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Temp
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal/60">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
      </div>

      <div className="flex items-baseline justify-between">
        <p className={`text-3xl font-bold tabular-nums ${isAlert ? "text-danger" : "text-white"}`}>
          {Math.round(fahrenheit)}°F
        </p>
        <span className={`text-sm font-medium ${trend >= 0 ? "text-teal/70" : "text-blue-400/70"}`}>
          {trendStr}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full h-10 mt-2"
        style={{ display: "block" }}
      />
    </div>
  );
}
