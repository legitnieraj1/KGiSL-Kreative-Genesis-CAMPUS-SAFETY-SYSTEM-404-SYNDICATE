import { NextRequest, NextResponse } from "next/server";
import { getState } from "@/lib/sensorStore";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "stepfun/step-3.5-flash:free";

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 });
    }

    const { message, conversationHistory } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get current sensor state for context
    const currentState = getState();

    // Try to get recent readings from Supabase for richer context
    let recentReadings = "";
    try {
      const { supabaseAdmin, isSupabaseConfigured } = await import("@/lib/supabase");
      if (isSupabaseConfigured() && supabaseAdmin) {
        const { data } = await supabaseAdmin
          .from("sensor_readings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);
        if (data && data.length > 0) {
          recentReadings = `\nRecent DB readings:\n${data
            .map((r) => `  Mag:${r.accel_mag}G Gas:${r.gas_level} Temp:${r.temperature}°C at ${r.created_at}`)
            .join("\n")}`;
        }
      }
    } catch {
      // Supabase not available, continue with in-memory state
    }

    const systemPrompt = `You are SafetyHub AI Assistant, the intelligent safety monitoring system for KGiSL campus. You help campus security personnel, students, and faculty understand the current safety status.

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
` : "No live data available — sensors may be offline"}
${recentReadings}

THRESHOLDS:
- Earthquake: ≥2.5G = CRITICAL
- Gas: >800 = DANGER, >400 = WARNING, <400 = GOOD
- Temperature: >45°C = CRITICAL, >35°C = WARNING

RULES:
- Be concise (2-4 sentences max)
- If asked about safety, answer YES/NO first, then explain
- Reference actual sensor values
- If sensors are offline, say so clearly
- Suggest evacuation only for CRITICAL alerts`;

    // Build messages: system as first user turn (OpenRouter compatible)
    const messages: { role: string; content: string }[] = [
      { role: "user", content: systemPrompt },
      { role: "assistant", content: "Understood. I'm SafetyHub AI, ready to assist with campus safety. I have access to live sensor data and will give clear, actionable answers." },
      // Inject conversation history
      ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      // Current user message
      { role: "user", content: message },
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://campussafetysystemkgislhackathon.vercel.app",
        "X-Title": "SafetyHub Campus Monitor",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        reasoning: { enabled: true },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const result = await response.json();
    const responseText = result.choices[0].message.content || "Unable to generate response.";

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
