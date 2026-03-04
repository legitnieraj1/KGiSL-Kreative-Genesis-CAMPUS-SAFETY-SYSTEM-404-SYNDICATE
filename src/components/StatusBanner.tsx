"use client";

import { AlertState, ConnectionStatus } from "@/types";

interface StatusBannerProps {
  alert: AlertState;
  connection: ConnectionStatus;
  sensorOnline: boolean;
}

export default function StatusBanner({ alert, connection, sensorOnline }: StatusBannerProps) {
  if (connection === "reconnecting" || connection === "disconnected") {
    return (
      <div className="mx-5 mt-3 px-4 py-2.5 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber animate-pulse" />
          <span className="text-xs font-semibold text-amber uppercase tracking-wide">
            Connection Lost
          </span>
        </div>
        <span className="text-xs text-amber/70">Reconnecting…</span>
      </div>
    );
  }

  if (!sensorOnline) {
    return (
      <div className="mx-5 mt-3 px-4 py-2.5 rounded-full bg-muted/10 border border-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-muted" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">
            Sensor Offline
          </span>
        </div>
        <span className="text-xs text-muted/70">No Data</span>
      </div>
    );
  }

  if (alert.active && alert.severity === "CRITICAL") {
    return (
      <div className="mx-5 mt-3 px-4 py-2.5 rounded-full bg-danger/10 border border-danger/40 flex items-center justify-between animate-pulse-danger">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-danger" />
          <span className="text-xs font-bold text-danger uppercase tracking-wide">
            {alert.type?.replace("_", " ")} Detected
          </span>
        </div>
        <span className="text-xs text-danger/80 font-semibold">CRITICAL</span>
      </div>
    );
  }

  if (alert.active && alert.severity === "WARNING") {
    return (
      <div className="mx-5 mt-3 px-4 py-2.5 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber" />
          <span className="text-xs font-semibold text-amber uppercase tracking-wide">
            Elevated Readings
          </span>
        </div>
        <span className="text-xs text-amber/70">Warning</span>
      </div>
    );
  }

  return (
    <div className="mx-5 mt-3 px-4 py-2.5 rounded-full bg-teal/5 border border-teal/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-teal animate-live-pulse" />
        <span className="text-xs font-semibold text-teal uppercase tracking-wide">
          Monitoring Active
        </span>
      </div>
      <span className="text-xs text-teal/60">No Threats</span>
    </div>
  );
}
