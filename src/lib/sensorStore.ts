// In-memory sensor state — shared across API routes within the same Node.js process.
// This works for local dev and single-instance deployments.
// For multi-instance (e.g., Vercel serverless), you'd need Redis or similar.

export type GasStatus = "GOOD" | "MODERATE" | "DANGER";
export type AlertSeverity = "NORMAL" | "WARNING" | "CRITICAL";
export type HazardType = "EARTHQUAKE" | "GAS_LEAK" | "HIGH_TEMP" | "TRESPASSING" | null;

export interface SensorPayload {
  accelMag: number;
  gasLevel: number;
  temperature: number;
  humidity: number;
  alert: string;
  uptimeMs: number;
  mpuAvailable?: boolean;
  motion?: boolean;
  motionCount?: number;
}

export interface ProcessedState {
  zoneId: string;
  zoneName: string;
  timestamp: string;
  data: {
    seismic: { magnitude: number; depth: number; unit: string };
    gas: { raw: number; status: GasStatus; ppm: number };
    temperature: { celsius: number; fahrenheit: number; trend: number };
    humidity: { percent: number };
  };
  alert: {
    active: boolean;
    type: HazardType;
    severity: AlertSeverity;
    message: string;
  };
  sensorHealth: {
    online: boolean;
    uptime: number;
    lastEspResponse: string;
    mpuAvailable: boolean;
  };
}

// ─── Helpers ───

function getGasStatus(raw: number): GasStatus {
  if (raw < 400) return "GOOD";
  if (raw <= 800) return "MODERATE";
  return "DANGER";
}

function computeAlert(
  mag: number,
  gas: number,
  temp: number,
  motionDetected?: boolean
): { active: boolean; type: HazardType; severity: AlertSeverity; message: string } {
  // Priority: earthquake > temperature > gas > trespassing
  if (mag >= 2.5) {
    return { active: true, type: "EARTHQUAKE", severity: "CRITICAL", message: `EARTHQUAKE DETECTED — Magnitude ${mag.toFixed(1)}G` };
  }
  if (temp > 45) {
    return { active: true, type: "HIGH_TEMP", severity: "CRITICAL", message: `HIGH TEMPERATURE — ${temp.toFixed(1)}°C` };
  }
  if (gas > 800) {
    return { active: true, type: "GAS_LEAK", severity: "CRITICAL", message: `GAS LEAK DETECTED — Level ${gas}` };
  }
  if (gas > 400) {
    return { active: true, type: "GAS_LEAK", severity: "WARNING", message: `Elevated Gas Level — ${gas}` };
  }
  if (temp > 35) {
    return { active: true, type: "HIGH_TEMP", severity: "WARNING", message: `Elevated Temperature — ${temp.toFixed(1)}°C` };
  }
  if (motionDetected) {
    return { active: true, type: "TRESPASSING", severity: "CRITICAL", message: "TRESPASSING DETECTED — Unauthorized motion detected" };
  }
  return { active: false, type: null, severity: "NORMAL", message: "System Normal" };
}

function validateRange(val: number, min: number, max: number): number | null {
  if (typeof val !== "number" || isNaN(val)) return null;
  if (val < min || val > max) return null;
  return val;
}

// ─── Alert Debouncing ───
// Require 3 consecutive readings above threshold to trigger, 5 below to clear

interface DebounceState {
  consecutiveAbove: number;
  consecutiveBelow: number;
  isActive: boolean;
}

const debounce: Record<string, DebounceState> = {
  earthquake: { consecutiveAbove: 0, consecutiveBelow: 0, isActive: false },
  gas: { consecutiveAbove: 0, consecutiveBelow: 0, isActive: false },
  temperature: { consecutiveAbove: 0, consecutiveBelow: 0, isActive: false },
  motion: { consecutiveAbove: 0, consecutiveBelow: 0, isActive: false },
};

function updateDebounce(key: string, isAbove: boolean): boolean {
  const d = debounce[key];
  if (isAbove) {
    d.consecutiveAbove++;
    d.consecutiveBelow = 0;
    if (d.consecutiveAbove >= 3) d.isActive = true;
  } else {
    d.consecutiveBelow++;
    d.consecutiveAbove = 0;
    if (d.consecutiveBelow >= 5) d.isActive = false;
  }
  return d.isActive;
}

// ─── Global State ───

let currentState: ProcessedState | null = null;
let previousTemp: number = 22;
const sseClients: Set<ReadableStreamDefaultController> = new Set();

export function getState(): ProcessedState | null {
  return currentState;
}

export function getClientCount(): number {
  return sseClients.size;
}

export function addSSEClient(controller: ReadableStreamDefaultController): void {
  sseClients.add(controller);
}

export function removeSSEClient(controller: ReadableStreamDefaultController): void {
  sseClients.delete(controller);
}

function broadcast(state: ProcessedState): void {
  const data = `data: ${JSON.stringify(state)}\n\n`;
  const deadClients: ReadableStreamDefaultController[] = [];

  for (const client of sseClients) {
    try {
      client.enqueue(new TextEncoder().encode(data));
    } catch {
      deadClients.push(client);
    }
  }

  // Clean up dead connections
  for (const client of deadClients) {
    sseClients.delete(client);
  }
}

export function ingestSensorData(
  payload: SensorPayload,
  zoneId: string = "kgisl-seminar-hall-1",
  zoneName: string = "KGiSL - Seminar Hall 1"
): { success: boolean; error?: string } {
  // ─── Validate ───
  const mag = validateRange(payload.accelMag, 0, 20);
  const gas = validateRange(payload.gasLevel, 0, 4095);
  const temp = validateRange(payload.temperature, -40, 85);
  const hum = validateRange(payload.humidity, 0, 100);

  // Flag ADC rail values as sensor error
  const gasValid = gas !== null && gas !== 0 && gas !== 4095;
  const gasValue = gasValid ? gas! : (currentState?.data.gas.raw ?? 0);

  const magValue = mag ?? 0;
  const tempValue = temp ?? (currentState?.data.temperature.celsius ?? 22);
  const humValue = hum ?? (currentState?.data.humidity.percent ?? 45);

  // ─── Debounce alerts ───
  updateDebounce("earthquake", magValue >= 2.5);
  updateDebounce("gas", gasValue > 800);
  updateDebounce("temperature", tempValue > 45);
  updateDebounce("motion", payload.motion === true);

  // Build debounced alert — only fire if debounce confirms
  let alert = computeAlert(magValue, gasValue, tempValue, debounce.motion.isActive);
  if (alert.type === "EARTHQUAKE" && !debounce.earthquake.isActive) {
    alert = { active: false, type: null, severity: "NORMAL", message: "System Normal" };
  } else if (alert.type === "GAS_LEAK" && alert.severity === "CRITICAL" && !debounce.gas.isActive) {
    alert = { active: false, type: null, severity: "NORMAL", message: "System Normal" };
  } else if (alert.type === "HIGH_TEMP" && alert.severity === "CRITICAL" && !debounce.temperature.isActive) {
    alert = { active: false, type: null, severity: "NORMAL", message: "System Normal" };
  } else if (alert.type === "TRESPASSING" && !debounce.motion.isActive) {
    alert = { active: false, type: null, severity: "NORMAL", message: "System Normal" };
  }

  // ─── Compute trend ───
  const trend = Math.round((tempValue - previousTemp) * 10) / 10;
  previousTemp = tempValue;

  const fahrenheit = Math.round((tempValue * 9 / 5 + 32) * 10) / 10;

  // ─── Build state ───
  const now = new Date().toISOString();
  currentState = {
    zoneId,
    zoneName,
    timestamp: now,
    data: {
      seismic: { magnitude: Math.round(magValue * 100) / 100, depth: 5.0, unit: "G" },
      gas: { raw: Math.round(gasValue), status: getGasStatus(gasValue), ppm: Math.round(gasValue) },
      temperature: { celsius: Math.round(tempValue * 10) / 10, fahrenheit, trend },
      humidity: { percent: Math.round(humValue * 10) / 10 },
    },
    alert,
    sensorHealth: {
      online: true,
      uptime: payload.uptimeMs ?? 0,
      lastEspResponse: now,
      mpuAvailable: payload.mpuAvailable ?? true,
    },
  };

  // ─── Broadcast to all SSE clients ───
  broadcast(currentState);

  return { success: true };
}
