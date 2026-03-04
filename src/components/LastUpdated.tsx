"use client";

import { useState, useEffect } from "react";

interface LastUpdatedProps {
  timestamp: string;
}

export default function LastUpdated({ timestamp }: LastUpdatedProps) {
  const [display, setDisplay] = useState("JUST NOW");

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
      if (diff < 3) {
        setDisplay("JUST NOW");
      } else if (diff < 10) {
        setDisplay(`${diff}s AGO`);
      } else if (diff < 30) {
        setDisplay(`${diff}s AGO — STALE`);
      } else {
        setDisplay("OFFLINE");
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  const isStale = display.includes("STALE") || display === "OFFLINE";

  return (
    <div className="text-center py-3">
      <p className={`text-[10px] uppercase tracking-widest font-medium ${isStale ? "text-amber" : "text-muted"}`}>
        Last Updated: {display}
      </p>
    </div>
  );
}
