"use client";

import BottomNav from "@/components/BottomNav";

export default function MapPage() {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-24">
      <header className="px-5 pt-6 pb-3">
        <p className="text-xs tracking-[0.3em] text-muted uppercase font-medium">Safety Hub</p>
        <h1 className="text-xl font-bold text-white mt-0.5">Campus Map</h1>
      </header>

      <main className="px-4 mt-4">
        <div className="card-glass rounded-2xl p-8 glow-teal relative overflow-hidden">
          {/* Grid pattern map placeholder */}
          <div className="absolute inset-0 opacity-15">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mapGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#00ffcc" strokeWidth="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mapGrid)" />
              <line x1="15%" y1="25%" x2="85%" y2="25%" stroke="#00ffcc" strokeWidth="1" />
              <line x1="15%" y1="50%" x2="85%" y2="50%" stroke="#00ffcc" strokeWidth="1" />
              <line x1="15%" y1="75%" x2="85%" y2="75%" stroke="#00ffcc" strokeWidth="0.5" />
              <line x1="25%" y1="15%" x2="25%" y2="85%" stroke="#00ffcc" strokeWidth="1" />
              <line x1="50%" y1="15%" x2="50%" y2="85%" stroke="#00ffcc" strokeWidth="0.5" />
              <line x1="75%" y1="15%" x2="75%" y2="85%" stroke="#00ffcc" strokeWidth="1" />
              <rect x="20%" y="20%" width="15%" height="12%" fill="#00ffcc" fillOpacity="0.08" stroke="#00ffcc" strokeWidth="0.5" />
              <rect x="55%" y="40%" width="20%" height="15%" fill="#00ffcc" fillOpacity="0.08" stroke="#00ffcc" strokeWidth="0.5" />
              <rect x="30%" y="62%" width="18%" height="10%" fill="#00ffcc" fillOpacity="0.08" stroke="#00ffcc" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Zone marker */}
          <div className="relative z-10 flex flex-col items-center justify-center py-16">
            <div className="w-4 h-4 bg-teal rounded-full mb-3 animate-live-pulse shadow-[0_0_12px_rgba(0,255,204,0.5)]" />
            <p className="text-sm font-semibold text-white">KGiSL - Seminar Hall 1</p>
            <p className="text-xs text-teal mt-1">Active Monitoring</p>
          </div>
        </div>

        <div className="mt-4 card-glass rounded-xl p-4 glow-teal">
          <p className="text-xs text-muted text-center">
            Interactive campus map with multi-zone overlay coming in v2
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
