"use client";

import { useState, useEffect, useCallback } from "react";

interface AIAnalysis {
  riskLevel: string;
  summary: string;
  recommendation: string;
  prediction: string;
  details?: {
    seismic?: string;
    airQuality?: string;
    thermal?: string;
  };
  confidence: number;
  timestamp: string;
}

interface AIInsightsCardProps {
  sensorData: {
    seismic?: { magnitude: number; depth: number; unit: string };
    gas?: { raw: number; status: string; ppm: number };
    temperature?: { celsius: number; fahrenheit: number; trend: number };
    humidity?: { percent: number };
  } | null;
  isAlert: boolean;
  seismicHistory?: number[];
  gasHistory?: number[];
  tempHistory?: number[];
}

export default function AIInsightsCard({ sensorData, isAlert, seismicHistory, gasHistory, tempHistory }: AIInsightsCardProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(0);

  const fetchAnalysis = useCallback(async () => {
    if (!sensorData) return;

    setLoading(true);
    setError(null);

    try {
      const history = [];
      const len = Math.min(seismicHistory?.length || 0, gasHistory?.length || 0, tempHistory?.length || 0, 10);
      for (let i = 0; i < len; i++) {
        history.push({
          accelMag: seismicHistory?.[seismicHistory.length - len + i] || 0,
          gasLevel: gasHistory?.[gasHistory.length - len + i] || 0,
          temperature: tempHistory?.[tempHistory.length - len + i] || 0,
        });
      }

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensorData, history }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data = await res.json();
      setAnalysis(data);
      setLastFetch(Date.now());
    } catch (err) {
      setError("AI analysis unavailable");
      console.error("AI fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [sensorData, seismicHistory, gasHistory, tempHistory]);

  // Auto-refresh: every 15s during alerts, every 60s normally
  useEffect(() => {
    const interval = isAlert ? 15000 : 60000;

    // Initial fetch
    if (Date.now() - lastFetch > interval) {
      fetchAnalysis();
    }

    const timer = setInterval(fetchAnalysis, interval);
    return () => clearInterval(timer);
  }, [isAlert, fetchAnalysis, lastFetch]);

  const riskColors: Record<string, string> = {
    LOW: "var(--color-teal)",
    MODERATE: "var(--color-amber)",
    HIGH: "var(--color-danger)",
    CRITICAL: "var(--color-danger)",
  };

  const riskBg: Record<string, string> = {
    LOW: "var(--color-teal)",
    MODERATE: "var(--color-amber)",
    HIGH: "var(--color-danger)",
    CRITICAL: "var(--color-danger)",
  };

  return (
    <div className={`card-glass rounded-2xl p-5 ${isAlert ? "border border-[var(--color-danger)]/30" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.4V11h-4V9.4C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z" />
              <path d="M10 11h4v2a2 2 0 0 1-4 0v-2z" />
              <line x1="12" y1="15" x2="12" y2="19" />
              <line x1="10" y1="19" x2="14" y2="19" />
              <circle cx="5" cy="8" r="1" fill="#a855f7" opacity="0.5" />
              <circle cx="19" cy="8" r="1" fill="#a855f7" opacity="0.5" />
              <circle cx="5" cy="14" r="0.5" fill="#a855f7" opacity="0.3" />
              <circle cx="19" cy="14" r="0.5" fill="#a855f7" opacity="0.3" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[var(--color-foreground)]">AI Safety Analysis</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">GEMINI</span>
        </div>
        {loading && (
          <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        )}
      </div>

      {error && !analysis ? (
        <p className="text-xs text-[var(--color-muted)]">{error}</p>
      ) : analysis ? (
        <div className="space-y-3">
          {/* Risk Level Badge */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `color-mix(in srgb, ${riskBg[analysis.riskLevel] || "var(--color-muted)"} 20%, transparent)`,
                color: riskColors[analysis.riskLevel] || "var(--color-muted)",
              }}
            >
              {analysis.riskLevel} RISK
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">
              {Math.round((analysis.confidence || 0) * 100)}% confidence
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm text-[var(--color-foreground)]">{analysis.summary}</p>

          {/* Recommendation */}
          <div className="bg-[var(--color-background)] rounded-xl p-3">
            <p className="text-[10px] font-semibold text-[var(--color-teal)] uppercase tracking-wider mb-1">Recommendation</p>
            <p className="text-xs text-[var(--color-foreground)]/80">{analysis.recommendation}</p>
          </div>

          {/* Prediction */}
          <div className="bg-[var(--color-background)] rounded-xl p-3">
            <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">Prediction</p>
            <p className="text-xs text-[var(--color-foreground)]/80">{analysis.prediction}</p>
          </div>

          {/* Details accordion */}
          {analysis.details && (
            <div className="grid grid-cols-3 gap-2">
              {analysis.details.seismic && (
                <div className="bg-[var(--color-background)] rounded-lg p-2">
                  <p className="text-[9px] font-semibold text-[var(--color-muted)] uppercase mb-1">Seismic</p>
                  <p className="text-[10px] text-[var(--color-foreground)]/70">{analysis.details.seismic}</p>
                </div>
              )}
              {analysis.details.airQuality && (
                <div className="bg-[var(--color-background)] rounded-lg p-2">
                  <p className="text-[9px] font-semibold text-[var(--color-muted)] uppercase mb-1">Air Quality</p>
                  <p className="text-[10px] text-[var(--color-foreground)]/70">{analysis.details.airQuality}</p>
                </div>
              )}
              {analysis.details.thermal && (
                <div className="bg-[var(--color-background)] rounded-lg p-2">
                  <p className="text-[9px] font-semibold text-[var(--color-muted)] uppercase mb-1">Thermal</p>
                  <p className="text-[10px] text-[var(--color-foreground)]/70">{analysis.details.thermal}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="h-4 bg-[var(--color-background)] rounded animate-pulse w-3/4" />
          <div className="h-3 bg-[var(--color-background)] rounded animate-pulse w-1/2" />
          <div className="h-12 bg-[var(--color-background)] rounded-xl animate-pulse" />
        </div>
      )}
    </div>
  );
}
