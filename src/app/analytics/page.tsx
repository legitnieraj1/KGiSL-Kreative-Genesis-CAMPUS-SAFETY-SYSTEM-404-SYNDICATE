"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useSensorData } from "@/hooks/useSensorData";

interface ReadingStats {
  avgTemp: number;
  avgGas: number;
  avgMag: number;
  maxTemp: number;
  maxGas: number;
  maxMag: number;
  totalAlerts: number;
  totalReadings: number;
}

export default function AnalyticsPage() {
  const { alerts, seismicHistory, gasHistory, tempHistory } = useSensorData();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [dbAlerts, setDbAlerts] = useState<number>(0);

  useEffect(() => {
    // Calculate stats from history
    if (seismicHistory.length > 0 || gasHistory.length > 0 || tempHistory.length > 0) {
      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const max = (arr: number[]) => arr.length ? Math.max(...arr) : 0;

      setStats({
        avgTemp: parseFloat(avg(tempHistory).toFixed(1)),
        avgGas: Math.round(avg(gasHistory)),
        avgMag: parseFloat(avg(seismicHistory).toFixed(3)),
        maxTemp: parseFloat(max(tempHistory).toFixed(1)),
        maxGas: Math.round(max(gasHistory)),
        maxMag: parseFloat(max(seismicHistory).toFixed(3)),
        totalAlerts: alerts.length,
        totalReadings: seismicHistory.length,
      });
    }

    // Try to get alert count from DB
    fetch("/api/alerts")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setDbAlerts(data.length); })
      .catch(() => {});
  }, [seismicHistory, gasHistory, tempHistory, alerts]);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] max-w-[32rem] mx-auto pb-24">
      <Header alerts={alerts} />

      <main className="px-4 mt-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-lg font-bold">Analytics</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">LIVE</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Avg Temperature" value={`${stats?.avgTemp ?? "—"}°C`} color="var(--color-teal)" />
          <StatBox label="Max Temperature" value={`${stats?.maxTemp ?? "—"}°C`} color={stats && stats.maxTemp > 45 ? "var(--color-danger)" : "var(--color-amber)"} />
          <StatBox label="Avg Gas Level" value={`${stats?.avgGas ?? "—"}`} color="var(--color-teal)" />
          <StatBox label="Max Gas Level" value={`${stats?.maxGas ?? "—"}`} color={stats && stats.maxGas > 800 ? "var(--color-danger)" : "var(--color-amber)"} />
          <StatBox label="Avg Seismic" value={`${stats?.avgMag ?? "—"}G`} color="var(--color-teal)" />
          <StatBox label="Max Seismic" value={`${stats?.maxMag ?? "—"}G`} color={stats && stats.maxMag > 2.5 ? "var(--color-danger)" : "var(--color-amber)"} />
        </div>

        {/* Summary Cards */}
        <div className="card-glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-3">Session Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">Total Readings</span>
              <span>{stats?.totalReadings || 0}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">Session Alerts</span>
              <span className={alerts.length > 0 ? "text-[var(--color-danger)]" : ""}>{alerts.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">Historical Alerts (DB)</span>
              <span>{dbAlerts}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--color-muted)]">Data Points / Metric</span>
              <span>{seismicHistory.length} / 30 max</span>
            </div>
          </div>
        </div>

        {/* Alert Distribution */}
        {alerts.length > 0 && (
          <div className="card-glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold mb-3">Recent Alert Types</h2>
            <div className="space-y-2">
              {Object.entries(
                alerts.reduce<Record<string, number>>((acc, a) => {
                  const key = a.type || "UNKNOWN";
                  acc[key] = (acc[key] || 0) + 1;
                  return acc;
                }, {})
              ).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-[var(--color-background)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center px-2"
                      style={{
                        width: `${Math.min(100, (count / alerts.length) * 100)}%`,
                        backgroundColor:
                          type === "EARTHQUAKE" ? "var(--color-danger)" :
                          type === "GAS_LEAK" ? "var(--color-amber)" :
                          type === "HIGH_TEMP" ? "#ef4444" :
                          "var(--color-teal)",
                      }}
                    >
                      <span className="text-[9px] font-bold text-white whitespace-nowrap">{type}</span>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--color-muted)] w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card-glass rounded-xl p-3">
      <p className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
    </div>
  );
}
