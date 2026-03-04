"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type GasStatus = "GOOD" | "MODERATE" | "DANGER";
type AlertSeverity = "NORMAL" | "WARNING" | "CRITICAL";
type HazardType = "EARTHQUAKE" | "GAS_LEAK" | "HIGH_TEMP" | "TRESPASSING" | null;
type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface SensorData {
  seismic: { magnitude: number; depth: number; unit: string };
  gas: { raw: number; status: GasStatus; ppm: number };
  temperature: { celsius: number; fahrenheit: number; trend: number };
  humidity: { percent: number };
  motion?: boolean;
  motionCount?: number;
}

interface AlertState {
  active: boolean;
  type: HazardType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
}

interface ZoneState {
  zoneId: string;
  zoneName: string;
  lastUpdate: string;
  data: SensorData;
  alert: AlertState;
  sensorHealth: {
    online: boolean;
    uptime: number;
    lastEspResponse: string;
    mpuAvailable: boolean;
  };
}

interface AlertEvent {
  id: string;
  type: HazardType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  zoneId: string;
  zoneName: string;
  aiAnalysis?: string;
}

interface AppState {
  zone: ZoneState;
  connection: ConnectionStatus;
  alerts: AlertEvent[];
  seismicHistory: number[];
  gasHistory: number[];
  tempHistory: number[];
  humidityHistory: number[];
}

const HISTORY_LENGTH = 30;
const MAX_ALERTS = 50;

const defaultZone: ZoneState = {
  zoneId: "",
  zoneName: "",
  lastUpdate: "",
  data: {
    seismic: { magnitude: 0, depth: 5.0, unit: "G" },
    gas: { raw: 0, status: "GOOD", ppm: 0 },
    temperature: { celsius: 0, fahrenheit: 32, trend: 0 },
    humidity: { percent: 0 },
    motion: false,
    motionCount: 0,
  },
  alert: { active: false, type: null, severity: "NORMAL", message: "Connecting...", timestamp: new Date().toISOString() },
  sensorHealth: { online: false, uptime: 0, lastEspResponse: "", mpuAvailable: false },
};

export function useSensorData(): AppState {
  const [zone, setZone] = useState<ZoneState>(defaultZone);
  const [connection, setConnection] = useState<ConnectionStatus>("disconnected");
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [seismicHistory, setSeismicHistory] = useState<number[]>([]);
  const [gasHistory, setGasHistory] = useState<number[]>([]);
  const [tempHistory, setTempHistory] = useState<number[]>([]);
  const [humidityHistory, setHumidityHistory] = useState<number[]>([]);
  const prevAlertType = useRef<HazardType>(null);
  const mockMode = useRef(false);
  const mockInterval = useRef<NodeJS.Timeout | null>(null);
  const supabaseChannel = useRef<ReturnType<typeof import("@supabase/supabase-js").SupabaseClient.prototype.channel> | null>(null);

  const pushHistory = useCallback(
    (setter: React.Dispatch<React.SetStateAction<number[]>>, value: number) => {
      setter((prev) => {
        const next = [...prev, value];
        return next.length > HISTORY_LENGTH ? next.slice(-HISTORY_LENGTH) : next;
      });
    },
    []
  );

  const processState = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => {
      if (!state) return;

      const zoneState: ZoneState = {
        zoneId: state.zoneId || state.zone_id || "",
        zoneName: state.zoneName || state.zone_name || "",
        lastUpdate: state.timestamp || new Date().toISOString(),
        data: {
          seismic: state.data?.seismic || { magnitude: state.accel_mag || 0, depth: 5.0, unit: "G" },
          gas: state.data?.gas || {
            raw: state.gas_level || 0,
            status: (state.gas_level || 0) > 800 ? "DANGER" : (state.gas_level || 0) > 400 ? "MODERATE" : "GOOD",
            ppm: Math.round(((state.gas_level || 0) / 4095) * 10000),
          },
          temperature: state.data?.temperature || {
            celsius: state.temperature || 0,
            fahrenheit: ((state.temperature || 0) * 9) / 5 + 32,
            trend: 0,
          },
          humidity: state.data?.humidity || { percent: state.humidity || 0 },
          motion: state.data?.motion ?? state.motion ?? false,
          motionCount: state.data?.motionCount ?? state.motion_count ?? 0,
        },
        alert: state.alert || {
          active: state.severity !== "NORMAL" && state.alert_type !== null,
          type: state.alert_type || null,
          severity: state.severity || "NORMAL",
          message: state.alert_type ? `${state.alert_type} detected` : "System Normal",
          timestamp: state.timestamp || new Date().toISOString(),
        },
        sensorHealth: state.sensorHealth || {
          online: true,
          uptime: state.uptimeMs || 0,
          lastEspResponse: state.timestamp || new Date().toISOString(),
          mpuAvailable: state.mpu_available ?? true,
        },
      };

      setZone(zoneState);
      setConnection("connected");

      // Update histories
      pushHistory(setSeismicHistory, zoneState.data.seismic.magnitude);
      pushHistory(setGasHistory, zoneState.data.gas.raw);
      pushHistory(setTempHistory, zoneState.data.temperature.celsius);
      pushHistory(setHumidityHistory, zoneState.data.humidity.percent);

      // Track alerts
      if (zoneState.alert.active && zoneState.alert.type !== prevAlertType.current) {
        const newAlert: AlertEvent = {
          id: `alert-${Date.now()}`,
          type: zoneState.alert.type,
          severity: zoneState.alert.severity,
          message: zoneState.alert.message,
          timestamp: new Date().toISOString(),
          zoneId: zoneState.zoneId,
          zoneName: zoneState.zoneName,
        };
        setAlerts((prev) => [newAlert, ...prev].slice(0, MAX_ALERTS));
      }
      prevAlertType.current = zoneState.alert.type;
    },
    [pushHistory]
  );

  // Generate mock data for demo/offline mode
  const startMockMode = useCallback(() => {
    if (mockMode.current) return;
    mockMode.current = true;
    console.log("[SafetyHub] Starting mock data mode");

    mockInterval.current = setInterval(() => {
      const isQuake = Math.random() < 0.05;
      const isHighGas = Math.random() < 0.03;
      const temp = 20 + Math.random() * 5 + (Math.random() < 0.02 ? 30 : 0);

      const mag = isQuake ? 2.5 + Math.random() * 2 : Math.random() * 0.5;
      const gas = isHighGas ? 800 + Math.random() * 500 : 100 + Math.random() * 200;

      let alertType: HazardType = null;
      let severity: AlertSeverity = "NORMAL";
      let message = "System Normal — All readings nominal";

      if (mag >= 2.5) {
        alertType = "EARTHQUAKE";
        severity = "CRITICAL";
        message = `Seismic activity detected: ${mag.toFixed(2)}G`;
      } else if (temp > 45) {
        alertType = "HIGH_TEMP";
        severity = "CRITICAL";
        message = `High temperature: ${temp.toFixed(1)}°C`;
      } else if (gas > 800) {
        alertType = "GAS_LEAK";
        severity = "CRITICAL";
        message = `Gas leak detected: ${Math.round(gas)} raw`;
      } else if (temp > 35) {
        severity = "WARNING";
        message = `Elevated temperature: ${temp.toFixed(1)}°C`;
      } else if (gas > 400) {
        severity = "WARNING";
        message = `Elevated gas levels: ${Math.round(gas)} raw`;
      }

      processState({
        zoneId: "demo-zone",
        zoneName: "Demo Mode",
        timestamp: new Date().toISOString(),
        data: {
          seismic: { magnitude: parseFloat(mag.toFixed(3)), depth: 5.0, unit: "G" },
          gas: {
            raw: Math.round(gas),
            status: gas > 800 ? "DANGER" : gas > 400 ? "MODERATE" : "GOOD",
            ppm: Math.round((gas / 4095) * 10000),
          },
          temperature: {
            celsius: parseFloat(temp.toFixed(1)),
            fahrenheit: parseFloat(((temp * 9) / 5 + 32).toFixed(1)),
            trend: parseFloat((Math.random() * 2 - 1).toFixed(1)),
          },
          humidity: { percent: parseFloat((45 + Math.random() * 20).toFixed(1)) },
          motion: false,
          motionCount: 0,
        },
        alert: { active: alertType !== null, type: alertType, severity, message, timestamp: new Date().toISOString() },
        sensorHealth: { online: true, uptime: Date.now(), lastEspResponse: new Date().toISOString(), mpuAvailable: true },
      });
    }, 1000);
  }, [processState]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let sseWorked = false;

    async function trySupabaseRealtime(): Promise<boolean> {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return false;

        const supabase = createClient(url, key);

        // Get latest reading first
        const { data: latest } = await supabase
          .from("sensor_readings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        if (latest && latest.length > 0) {
          processState(latest[0]);
        }

        // Subscribe to new inserts
        const channel = supabase
          .channel("sensor-realtime")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "sensor_readings" },
            (payload) => {
              processState(payload.new);
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              setConnection("connected");
              console.log("[SafetyHub] Supabase Realtime connected");
            }
          });

        supabaseChannel.current = channel;
        return true;
      } catch (error) {
        console.log("[SafetyHub] Supabase not available:", error);
        return false;
      }
    }

    function connectSSE() {
      setConnection("reconnecting");
      eventSource = new EventSource("/api/stream");

      eventSource.onmessage = (event) => {
        try {
          const state = JSON.parse(event.data);
          processState(state);
          sseWorked = true;
        } catch (e) {
          console.error("[SafetyHub] SSE parse error:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        if (!sseWorked) {
          // SSE never worked — try Supabase, then fall back to mock
          console.log("[SafetyHub] SSE unavailable, trying Supabase...");
          trySupabaseRealtime().then((connected) => {
            if (!connected) {
              startMockMode();
            }
          });
        } else {
          // SSE was working but disconnected — reconnect
          setConnection("reconnecting");
          reconnectTimer = setTimeout(connectSSE, 3000);
        }
      };
    }

    // Try connecting: SSE first (for local dev), then Supabase, then mock
    connectSSE();

    return () => {
      eventSource?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (mockInterval.current) clearInterval(mockInterval.current);
      if (supabaseChannel.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabaseChannel.current as any).unsubscribe?.();
      }
    };
  }, [processState, startMockMode]);

  return { zone, connection, alerts, seismicHistory, gasHistory, tempHistory, humidityHistory };
}
