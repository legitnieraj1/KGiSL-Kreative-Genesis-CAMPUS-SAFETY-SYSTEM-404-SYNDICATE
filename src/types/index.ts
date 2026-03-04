export type AlertSeverity = "NORMAL" | "WARNING" | "CRITICAL";
export type HazardType = "EARTHQUAKE" | "GAS_LEAK" | "HIGH_TEMP" | "TRESPASSING" | null;
export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";
export type SensorStatus = "online" | "stale" | "offline";
export type GasStatus = "GOOD" | "MODERATE" | "DANGER";

export interface SensorData {
  seismic: {
    magnitude: number;
    depth: number;
    unit: string;
  };
  gas: {
    raw: number;
    status: GasStatus;
    ppm: number;
  };
  temperature: {
    celsius: number;
    fahrenheit: number;
    trend: number;
  };
  humidity: {
    percent: number;
  };
  motion?: boolean;
  motionCount?: number;
}

export interface AlertState {
  active: boolean;
  type: HazardType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
}

export interface ZoneState {
  zoneId: string;
  zoneName: string;
  lastUpdate: string;
  data: SensorData;
  alert: AlertState;
  sensorHealth: {
    online: boolean;
    uptime: number;
    lastEspResponse: string;
  };
}

export interface AlertEvent {
  id: string;
  type: HazardType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  zoneId: string;
  zoneName: string;
  aiAnalysis?: string;
}

export interface AppState {
  zone: ZoneState;
  connection: ConnectionStatus;
  alerts: AlertEvent[];
  seismicHistory: number[];
  gasHistory: number[];
  tempHistory: number[];
  humidityHistory: number[];
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface AIAnalysis {
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendation: string;
  prediction: string;
  confidence: number;
  timestamp: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
