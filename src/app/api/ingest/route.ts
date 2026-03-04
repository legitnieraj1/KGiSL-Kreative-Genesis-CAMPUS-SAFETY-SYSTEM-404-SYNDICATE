import { NextRequest, NextResponse } from "next/server";
import { ingestSensorData, getState } from "@/lib/sensorStore";

// Dynamic import to avoid issues in edge runtime
async function getSupabaseAdmin() {
  try {
    const { supabaseAdmin, isSupabaseConfigured } = await import("@/lib/supabase");
    if (!isSupabaseConfigured()) return null;
    return supabaseAdmin;
  } catch {
    return null;
  }
}

async function sendPushNotifications(alertType: string, severity: string, message: string, aiAnalysis?: string) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    await fetch(`${baseUrl}/api/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertType, severity, message, aiAnalysis }),
    });
  } catch (error) {
    console.error("Failed to send push notifications:", error);
  }
}

async function getAIAnalysis(sensorData: Record<string, unknown>): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are SafetyHub AI, a campus safety monitoring system. Analyze these sensor readings and respond in 2-3 concise sentences:

Sensor Data:
- Acceleration Magnitude: ${sensorData.accelMag}G (threshold: 2.5G for earthquake)
- Gas Level: ${sensorData.gasLevel} raw ADC (threshold: 800 for danger, 400 for warning)
- Temperature: ${sensorData.temperature}°C (threshold: 45°C critical, 35°C warning)
- Humidity: ${sensorData.humidity}%
- Current Alert: ${sensorData.alert}

Provide: 1) What's happening 2) Risk assessment 3) Recommended action. Be specific and actionable. Do NOT use markdown formatting.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("AI analysis failed:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      const auth = request.headers.get("authorization");
      if (auth !== `Bearer ${apiKey}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();

    const payload = {
      accelMag: Number(body.accelMag) || 0,
      gasLevel: Number(body.gasLevel) || 0,
      temperature: Number(body.temperature) || 0,
      humidity: Number(body.humidity) || 0,
      alert: String(body.alert || "System Normal"),
      uptimeMs: Number(body.uptimeMs) || 0,
      mpuAvailable: body.mpuAvailable !== false,
      motion: Boolean(body.motion),
      motionCount: Number(body.motionCount) || 0,
    };

    if (payload.accelMag === undefined && payload.gasLevel === undefined) {
      return NextResponse.json({ error: "No sensor data" }, { status: 400 });
    }

    const zoneId = body.zoneId || "skasc-seminar-hall-1";
    const zoneName = body.zoneName || "SKASC - Seminar Hall 1";

    // Get previous state for alert change detection
    const prevState = getState();
    const prevAlertType = prevState?.alert?.type || null;

    // Process through existing in-memory logic (keeps SSE working for local dev)
    ingestSensorData(payload, zoneId, zoneName);
    const newState = getState();
    const newAlertType = newState?.alert?.type || null;
    const newSeverity = newState?.alert?.severity || "NORMAL";

    // Store in Supabase (non-blocking)
    const supabase = await getSupabaseAdmin();
    if (supabase) {
      // Insert sensor reading
      supabase
        .from("sensor_readings")
        .insert({
          zone_id: zoneId,
          accel_mag: payload.accelMag,
          gas_level: payload.gasLevel,
          temperature: payload.temperature,
          humidity: payload.humidity,
          alert_type: newAlertType,
          severity: newSeverity,
          mpu_available: payload.mpuAvailable,
          motion: payload.motion,
          motion_count: payload.motionCount,
        })
        .then(({ error }) => {
          if (error) console.error("Supabase insert error:", error.message);
        });

      // Broadcast via Supabase Realtime (insert triggers realtime automatically)

      // If alert changed to active, store alert + get AI analysis + send push
      if (newAlertType && newAlertType !== prevAlertType && newSeverity !== "NORMAL") {
        const alertMessage = newState?.alert?.message || `${newAlertType} detected`;

        // Get AI analysis for the alert
        const aiAnalysis = await getAIAnalysis(payload);

        // Store alert in DB
        supabase
          .from("alerts")
          .insert({
            zone_id: zoneId,
            zone_name: zoneName,
            type: newAlertType,
            severity: newSeverity,
            message: alertMessage,
            ai_analysis: aiAnalysis,
          })
          .then(({ error }) => {
            if (error) console.error("Alert insert error:", error.message);
          });

        // Send push notifications for WARNING and CRITICAL
        if (newSeverity === "WARNING" || newSeverity === "CRITICAL") {
          sendPushNotifications(newAlertType, newSeverity, alertMessage, aiAnalysis || undefined);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
