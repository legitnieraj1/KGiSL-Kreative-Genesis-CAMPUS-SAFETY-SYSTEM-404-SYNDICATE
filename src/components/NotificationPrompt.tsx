"use client";

import { useState, useEffect } from "react";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  registerServiceWorker,
} from "@/lib/pushNotifications";

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");

  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker();

    // Check if we should show the prompt
    if (!isNotificationSupported()) return;

    const permission = getNotificationPermission();
    if (permission === "granted") {
      // Already granted, ensure subscription exists
      subscribeToPush();
      return;
    }
    if (permission === "denied") return;

    // Check if user dismissed before
    const dismissed = localStorage.getItem("safetyhub-notif-dismissed");
    if (dismissed) {
      const dismissedAt = new Date(dismissed).getTime();
      const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60);
      if (hoursSince < 24) return; // Don't show again for 24 hours
    }

    // Show prompt after 3 seconds
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  async function handleEnable() {
    setStatus("loading");
    const granted = await requestNotificationPermission();
    if (granted) {
      await subscribeToPush();
      setStatus("granted");
      setTimeout(() => setShow(false), 2000);
    } else {
      setStatus("denied");
      setTimeout(() => setShow(false), 3000);
    }
  }

  function handleDismiss() {
    localStorage.setItem("safetyhub-notif-dismissed", new Date().toISOString());
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-bottom">
      <div className="card-glass rounded-2xl p-4 border border-[var(--color-teal)]/30 shadow-lg shadow-[var(--color-teal)]/10">
        {status === "granted" ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-teal)]/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-teal)]">Notifications enabled! You&apos;ll be alerted of emergencies.</p>
          </div>
        ) : status === "denied" ? (
          <div className="flex items-center gap-3">
            <p className="text-sm text-[var(--color-muted)]">Notifications blocked. You can enable them in browser settings.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-danger)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">Enable Emergency Alerts</p>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Get instant notifications when gas leaks, earthquakes, or high temperatures are detected on campus.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              >
                Not now
              </button>
              <button
                onClick={handleEnable}
                disabled={status === "loading"}
                className="px-4 py-1.5 text-xs font-semibold bg-[var(--color-teal)] text-[var(--color-background)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {status === "loading" ? "Enabling..." : "Enable Alerts"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
