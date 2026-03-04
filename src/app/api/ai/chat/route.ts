import { NextRequest, NextResponse } from "next/server";
import { getState } from "@/lib/sensorStore";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Get current sensor state for context
    const currentState = getState();

    // Also try to get from Supabase for richer context
    let recentReadings = "";
    try {
      const { supabaseAdmin, isSupabaseConfigured } = await import("@/lib/supabase");
      if (isSupabaseConfigured()) {
        const { data } = await supabaseAdmin
          .from("sensor_readings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);
        if (data && data.length > 0) {
          recentReadings = `\nRecent readings from database:\n${data.map((r) => `  Mag:${r.accel_mag}G Gas:${r.gas_level} Temp:${r.temperature}°C at ${r.created_at}`).join("\n")}`;
        }
      }
    } catch {
      // Supabase not available, continue with in-memory state
    }

    const systemPrompt = `You are SafetyHub AI Assistant, the intelligent safety monitoring system for Sri Krishna College campus. You help campus security personnel, students, and faculty understand the current safety status of their campus.

CURRENT LIVE SENSOR DATA:
${currentState ? `
- Zone: ${currentState.zoneName} (${currentState.zoneId})
- Seismic: ${currentState.data.seismic.magnitude}G
- Gas Level: ${currentState.data.gas.raw} raw (${currentState.data.gas.status}) / ${currentState.data.gas.ppm} PPM
- Temperature: ${currentState.data.temperature.celsius}°C / ${currentState.data.temperature.fahrenheit}°F (trend: ${currentState.data.temperature.trend > 0 ? "+" : ""}${currentState.data.temperature.trend}°)
- Humidity: ${currentState.data.humidity.percent}%
- Alert Active: ${currentState.alert.active ? `YES - ${currentState.alert.type} (${currentState.alert.severity})` : "No"}
- Alert Message: ${currentState.alert.message}
- Sensor Online: ${currentState.sensorHealth.online}
- Uptime: ${Math.floor(currentState.sensorHealth.uptime / 60000)} minutes
` : "No live data available - sensors may be offline"}
${recentReadings}

THRESHOLDS:
- Earthquake: ≥2.5G = CRITICAL
- Gas: >800 = CRITICAL (DANGER), >400 = WARNING (MODERATE), <400 = GOOD
- Temperature: >45°C = CRITICAL, >35°C = WARNING

RULES:
- Be concise (2-4 sentences max)
- If asked about safety, give a clear YES/NO first, then explain
- Reference actual sensor values in your answers
- If sensors are offline, say so clearly
- Suggest evacuation only for CRITICAL alerts
- Be calm and professional, avoid unnecessary alarm`;

    // Build conversation
    const history = (conversationHistory || []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: "System context: " + systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I'm SafetyHub AI, ready to help with campus safety monitoring. I have access to the current sensor data and will provide clear, actionable safety information." }] },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({
      response: responseText,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({
      response: "I'm having trouble connecting to my AI services right now. Please check the dashboard directly for current sensor readings and alerts.",
      timestamp: new Date().toISOString(),
    });
  }
}
