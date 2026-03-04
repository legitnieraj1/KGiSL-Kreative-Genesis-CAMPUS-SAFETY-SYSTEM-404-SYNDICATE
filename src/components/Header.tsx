"use client";

import { AlertEvent } from "@/types";
import { useState } from "react";

interface HeaderProps {
  alerts: AlertEvent[];
}

export default function Header({ alerts }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = alerts.filter(
    (a) => Date.now() - new Date(a.timestamp).getTime() < 300000
  ).length;

  return (
    <header className="relative px-5 pt-6 pb-3 flex items-start justify-between">
      <div>
        <p className="text-xs tracking-[0.3em] text-muted uppercase font-medium">
          Safety Hub
        </p>
        <h1 className="text-xl font-bold text-white mt-0.5">
          SRI KRISHNA COLLEGE
        </h1>
      </div>

      {/* Notification bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative mt-1 p-2 rounded-full hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger rounded-full text-[10px] font-bold flex items-center justify-center text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-4 top-16 z-50 w-72 max-h-64 overflow-y-auto rounded-xl card-glass border border-card-border shadow-2xl">
          <div className="p-3 border-b border-card-border">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Recent Alerts</p>
          </div>
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">No alerts</div>
          ) : (
            alerts.slice(0, 10).map((a) => (
              <div key={a.id} className="px-3 py-2.5 border-b border-card-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.severity === "CRITICAL" ? "bg-danger" : "bg-amber"}`} />
                  <p className="text-xs font-medium text-white truncate">{a.message}</p>
                </div>
                <p className="text-[10px] text-muted mt-0.5 ml-4">
                  {new Date(a.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </header>
  );
}
