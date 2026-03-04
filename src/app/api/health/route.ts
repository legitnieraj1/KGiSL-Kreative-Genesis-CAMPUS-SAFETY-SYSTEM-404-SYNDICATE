import { NextResponse } from "next/server";
import { getState, getClientCount } from "@/lib/sensorStore";

// GET /api/health — health check
export async function GET() {
  const state = getState();

  return NextResponse.json({
    status: "ok",
    connectedClients: getClientCount(),
    lastIngest: state?.timestamp ?? null,
    sensorOnline: state?.sensorHealth.online ?? false,
    zoneId: state?.zoneId ?? null,
  });
}

export const dynamic = "force-dynamic";
