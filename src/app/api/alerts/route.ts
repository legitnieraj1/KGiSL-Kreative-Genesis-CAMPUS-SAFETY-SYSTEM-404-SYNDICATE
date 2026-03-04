import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { supabaseAdmin, isSupabaseConfigured } = await import("@/lib/supabase");
    if (!isSupabaseConfigured()) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabaseAdmin
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Alerts fetch error:", error);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}
