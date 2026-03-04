"use client";

import { useEffect, useState } from "react";
import { useSensorData } from "@/hooks/useSensorData";
import BottomNav from "@/components/BottomNav";

interface AlertRecord {
  id: string;
  type: string | null;
  severity: "NORMAL" | "WARNING" | "CRITICAL";
  message: string;
  timestamp: string;
  zoneId: string;
  zoneName: string;
  aiAnalysis?: string;
}

export default function AlertsPage() {
  const { alerts: sessionAlerts } = useSensorData();
  const [dbAlerts, setDbAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch persistent alerts from database
    fetch("/api/alerts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbAlerts(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Combine session and DB alerts, session alerts take priority
  const allAlerts = [...sessionAlerts, ...dbAlerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const uniqueAlerts = Array.from(
    new Map(allAlerts.map((a) => [a.id || `${a.timestamp}-${a.message}`, a])).values()
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] max-w-[32rem] mx-auto pb-24">
      <header className="px-5 pt-6 pb-3">
        <p className="text-xs tracking-[0.3em] text-[var(--color-muted)] uppercase font-medium">Safety Hub</p>
        <h1 className="text-xl font-bold mt-0.5">Alert History</h1>
      </header>

      <main className="px-4 mt-2 space-y-2">
        {loading && uniqueAlerts.length === 0 ? (
          <div className="card-glass rounded-2xl p-8 text-center">
            <p className="text-sm text-[var(--color-muted)]">Loading alerts...</p>
          </div>
        ) : uniqueAlerts.length === 0 ? (
          <div className="card-glass rounded-2xl p-8 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" strokeWidth="1.5" className="mx-auto mb-3 opacity-40">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-sm text-[var(--color-muted)]">No alerts recorded</p>
            <p className="text-xs text-[var(--color-muted)]/60 mt-1">Alerts will appear here when hazards are detected</p>
          </div>
        ) : (
          uniqueAlerts.map((a) => (
            <div
              key={a.id || `${a.timestamp}-${a.message}`}
              className={`card-glass rounded-xl p-4 border-l-4 ${
                a.severity === "CRITICAL"
                  ? "border-l-[var(--color-danger)]"
                  : a.severity === "WARNING"
                  ? "border-l-[var(--color-amber)]"
                  : "border-l-[var(--color-teal)]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold">{a.message}</p>
                  <p className="text-[10px] text-[var(--color-muted)] mt-1">{a.zoneName}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    a.severity === "CRITICAL"
                      ? "bg-[var(--color-danger)]/20 text-[var(--color-danger)]"
                      : a.severity === "WARNING"
                      ? "bg-[var(--color-amber)]/20 text-[var(--color-amber)]"
                      : "bg-[var(--color-teal)]/20 text-[var(--color-teal)]"
                  }`}
                >
                  {a.severity}
                </span>
              </div>
              {a.aiAnalysis && (
                <p className="text-[10px] text-[var(--color-muted)] mt-2 italic">
                  AI: {a.aiAnalysis}
                </p>
              )}
              <p className="text-[10px] text-[var(--color-muted)]/60 mt-2">
                {new Date(a.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
