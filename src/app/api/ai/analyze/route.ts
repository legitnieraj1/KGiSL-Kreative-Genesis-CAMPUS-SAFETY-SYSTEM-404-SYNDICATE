import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "stepfun/step-3.5-flash:free";

async function callOpenRouter(messages: { role: string; content: string }[]): Promise<string> {
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
    const err = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${err}`);
  }

  const result = await response.json();
  return result.choices[0].message.content || "";
}

export async function POST(request: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OpenRouter API key not configured" }, { status: 500 });
    }

    const { sensorData, history } = await request.json();

    const prompt = `You are SafetyHub AI, an advanced campus safety monitoring system for KGiSL. Analyze the following real-time sensor data and provide a comprehensive safety assessment.

CURRENT SENSOR READINGS:
- Seismic Activity: ${sensorData?.seismic?.magnitude || 0}G (Earthquake threshold: 2.5G)
- Gas Level: ${sensorData?.gas?.raw || 0} raw / ${sensorData?.gas?.ppm || 0} PPM (Danger: >800, Warning: >400)
- Temperature: ${sensorData?.temperature?.celsius || 0}°C (Critical: >45°C, Warning: >35°C)
- Humidity: ${sensorData?.humidity?.percent || 0}%
- Gas Status: ${sensorData?.gas?.status || "UNKNOWN"}
- Temperature Trend: ${sensorData?.temperature?.trend || 0}°C (positive = rising)

RECENT HISTORY (last ${history?.length || 0} readings):
${history ? history.map((h: { accelMag: number; gasLevel: number; temperature: number }, i: number) => `  ${i + 1}. Mag:${h.accelMag}G Gas:${h.gasLevel} Temp:${h.temperature}°C`).join("\n") : "No history available"}

Respond ONLY with valid JSON, no markdown, no code blocks. Use this exact format:
{
  "riskLevel": "LOW",
  "summary": "One line summary of current safety status",
  "recommendation": "Specific actionable recommendation for campus security team",
  "prediction": "What might happen in the next 10-30 minutes based on trends",
  "details": {
    "seismic": "Brief analysis of seismic data",
    "airQuality": "Brief analysis of gas/air quality",
    "thermal": "Brief analysis of temperature conditions"
  },
  "confidence": 0.85
}
riskLevel must be one of: LOW, MODERATE, HIGH, CRITICAL`;

    const responseText = await callOpenRouter([
      { role: "user", content: prompt },
    ]);

    // Extract JSON (strip markdown if model wraps it)
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      if (!analysis?.riskLevel) throw new Error("Missing riskLevel");
    } catch {
      // Fallback: parse what we can
      analysis = {
        riskLevel: "MODERATE",
        summary: responseText.substring(0, 150),
        recommendation: "Monitor sensor readings closely.",
        prediction: "Continue observing current trends.",
        confidence: 0.6,
      };
    }

    return NextResponse.json({
      ...analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      {
        riskLevel: "MODERATE",
        summary: "AI analysis temporarily unavailable",
        recommendation: "Rely on threshold-based alerts",
        prediction: "Continue monitoring sensor data",
        confidence: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
