"use client";

interface ZoneCardProps {
  zoneName: string;
  sensorOnline: boolean;
}

export default function ZoneCard({ zoneName, sensorOnline }: ZoneCardProps) {
  return (
    <div className="card-glass rounded-2xl p-5 relative overflow-hidden glow-teal">
      {/* Map background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00ffcc" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Fake road-like lines */}
          <line x1="10%" y1="30%" x2="90%" y2="30%" stroke="#00ffcc" strokeWidth="0.5" />
          <line x1="10%" y1="60%" x2="90%" y2="60%" stroke="#00ffcc" strokeWidth="0.5" />
          <line x1="30%" y1="10%" x2="30%" y2="90%" stroke="#00ffcc" strokeWidth="0.5" />
          <line x1="65%" y1="10%" x2="65%" y2="90%" stroke="#00ffcc" strokeWidth="0.5" />
          {/* Intersection highlights */}
          <circle cx="30%" cy="30%" r="3" fill="#00ffcc" opacity="0.3" />
          <circle cx="65%" cy="60%" r="3" fill="#00ffcc" opacity="0.3" />
          <circle cx="30%" cy="60%" r="3" fill="#00ffcc" opacity="0.2" />
          <circle cx="65%" cy="30%" r="3" fill="#00ffcc" opacity="0.2" />
        </svg>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{zoneName}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                sensorOnline ? "bg-teal animate-live-pulse" : "bg-danger"
              }`}
            />
            <span className={`text-xs ${sensorOnline ? "text-teal" : "text-danger"}`}>
              {sensorOnline ? "Sensors Online" : "Sensors Offline"}
            </span>
          </div>
        </div>

        {/* Navigate arrow */}
        <div className="w-10 h-10 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffcc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l19-9-9 19-2-8-8-2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
