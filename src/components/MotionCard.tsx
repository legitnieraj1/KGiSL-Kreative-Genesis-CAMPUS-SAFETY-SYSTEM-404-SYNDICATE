"use client";

interface MotionCardProps {
  motion: boolean;
  motionCount?: number;
  isAlert: boolean;
}

export default function MotionCard({ motion, motionCount = 0, isAlert }: MotionCardProps) {
  return (
    <div className={`card-glass rounded-2xl p-5 ${isAlert ? "glow-danger animate-pulse-danger" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: isAlert ? "rgba(255,51,51,0.2)" : "rgba(0,255,204,0.1)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isAlert ? "var(--color-danger)" : "var(--color-teal)"} strokeWidth="2" strokeLinecap="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-[var(--color-foreground)]">Motion Detection</span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: motion ? "rgba(255,51,51,0.2)" : "rgba(0,255,204,0.1)",
            color: motion ? "var(--color-danger)" : "var(--color-teal)",
          }}
        >
          {motion ? "DETECTED" : "CLEAR"}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="text-3xl font-bold"
          style={{ color: motion ? "var(--color-danger)" : "var(--color-teal)" }}
        >
          {motion ? "ACTIVE" : "IDLE"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-muted)]">
          Trigger count: {motionCount}
        </span>
        {isAlert && (
          <span className="text-[10px] text-[var(--color-danger)] animate-pulse">
            TRESPASSING ALERT
          </span>
        )}
      </div>
    </div>
  );
}
