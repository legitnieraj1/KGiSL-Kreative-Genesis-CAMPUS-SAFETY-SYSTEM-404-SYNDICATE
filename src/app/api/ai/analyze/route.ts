import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const { sensorData, history } = await request.json();

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are SafetyHub AI, an advanced campus safety monitoring system for Sri Krishna College. Analyze the following real-time sensor data and provide a comprehensive safety assessment.

CURRENT SENSOR READINGS:
- Seismic Activity: ${sensorData?.seismic?.magnitude || 0}G (Earthquake threshold: 2.5G)
- Gas Level: ${sensorData?.gas?.raw || 0} raw / ${sensorData?.gas?.ppm || 0} PPM (Danger: >800, Warning: >400)
- Temperature: ${sensorData?.temperature?.celsius || 0}°C (Critical: >45°C, Warning: >35°C)
- Humidity: ${sensorData?.humidity?.percent || 0}%
- Gas Status: ${sensorData?.gas?.status || "UNKNOWN"}
- Temperature Trend: ${sensorData?.temperature?.trend || 0}°C (positive = rising)

RECENT HISTORY (last ${history?.length || 0} readings):
${history ? history.map((h: { accelMag: number; gasLevel: number; temperature: number }, i: number) => `  ${i + 1}. Mag:${h.accelMag}G Gas:${h.gasLevel} Temp:${h.temperature}°C`).join("\n") : "No history available"}

Respond ONLY with valid JSON in this exact format:
{
  "riskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "summary": "One line summary of current safety status",
  "recommendation": "Specific actionable recommendation for campus security team",
  "prediction": "What might happen in the next 10-30 minutes based on trends",
  "details": {
    "seismic": "Brief analysis of seismic data",
    "airQuality": "Brief analysis of gas/air quality",
    "thermal": "Brief analysis of temperature conditions"
  },
  "confidence": 0.0 to 1.0
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response (handle markdown code blocks)
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Failed to parse AI response" };
    } catch {
      analysis = {
        riskLevel: "MODERATE",
        summary: responseText.substring(0, 200),
        recommendation: "Unable to parse structured response. Raw AI output provided.",
        prediction: "Continue monitoring.",
        confidence: 0.5,
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
