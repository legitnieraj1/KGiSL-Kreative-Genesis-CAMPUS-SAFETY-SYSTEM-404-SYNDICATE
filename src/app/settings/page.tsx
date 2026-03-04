"use client";

import BottomNav from "@/components/BottomNav";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <header className="px-5 pt-6 pb-3">
        <p className="text-xs tracking-[0.3em] text-muted uppercase font-medium">Safety Hub</p>
        <h1 className="text-xl font-bold text-white mt-0.5">Settings</h1>
      </header>

      <main className="px-4 mt-4 space-y-3">
        {/* System Info */}
        <div className="card-glass rounded-2xl p-5 glow-teal">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">System Information</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Version</span>
              <span className="text-xs text-white font-mono">1.0.0</span>
            </div>
            <div className="h-px bg-card-border" />

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Zone</span>
              <span className="text-xs text-white font-mono">SKASC - Seminar Hall 1</span>
            </div>
            <div className="h-px bg-card-border" />

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Data Refresh</span>
              <span className="text-xs text-white font-mono">1 Hz</span>
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div className="card-glass rounded-2xl p-5 glow-teal">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Alert Thresholds</h3>
          <p className="text-[10px] text-muted/60 mb-3">Configured in firmware — read-only in v1</p>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Earthquake</span>
              <span className="text-xs text-danger font-mono">&ge; 2.5 G</span>
            </div>
            <div className="h-px bg-card-border" />

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Gas Leak</span>
              <span className="text-xs text-danger font-mono">&gt; 800 raw</span>
            </div>
            <div className="h-px bg-card-border" />

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">High Temperature</span>
              <span className="text-xs text-danger font-mono">&gt; 45.0°C</span>
            </div>
          </div>
        </div>

        {/* Sensor Info */}
        <div className="card-glass rounded-2xl p-5 glow-teal">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Sensor Hardware</h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Seismic</span>
              <span className="text-xs text-white font-mono">MPU6050</span>
            </div>
            <div className="h-px bg-card-border" />

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Gas</span>
              <span className="text-xs text-white font-mono">MQ-Series</span>
            </div>
            <div className="h-px bg-card-border" />

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Temp / Humidity</span>
              <span className="text-xs text-white font-mono">DHT11</span>
            </div>
            <div className="h-px bg-card-border" />

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Controller</span>
              <span className="text-xs text-white font-mono">ESP32 DevKit V1</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
