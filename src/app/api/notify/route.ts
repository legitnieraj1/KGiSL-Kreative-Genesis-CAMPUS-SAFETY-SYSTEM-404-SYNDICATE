import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { alertType, severity, message, aiAnalysis } = await request.json();

    // Dynamic import web-push (it's a Node.js module)
    const webpush = await import("web-push");

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || "mailto:safetyhub@example.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    // Get all push subscriptions from Supabase
    const { supabaseAdmin, isSupabaseConfigured } = await import("@/lib/supabase");
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*");

    if (error || !subscriptions) {
      console.error("Failed to fetch subscriptions:", error);
      return NextResponse.json({ sent: 0 });
    }

    const notificationPayload = JSON.stringify({
      title: `SafetyHub: ${severity} Alert`,
      body: message + (aiAnalysis ? `\n\nAI: ${aiAnalysis.substring(0, 100)}` : ""),
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `safetyhub-${alertType}-${Date.now()}`,
      data: {
        url: "/alerts",
        alertType,
        severity,
        timestamp: new Date().toISOString(),
      },
    });

    let sent = 0;
    const expired: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys_p256dh,
                auth: sub.keys_auth,
              },
            },
            notificationPayload
          );
          sent++;
        } catch (err: unknown) {
          const pushError = err as { statusCode?: number };
          if (pushError.statusCode === 410 || pushError.statusCode === 404) {
            expired.push(sub.endpoint);
          }
          console.error(`Push failed for ${sub.endpoint}:`, pushError.statusCode);
        }
      })
    );

    // Clean up expired subscriptions
    if (expired.length > 0) {
      await supabaseAdmin
        .from("push_subscriptions")
        .delete()
        .in("endpoint", expired);
    }

    return NextResponse.json({ sent, total: subscriptions.length, expired: expired.length });
  } catch (error) {
    console.error("Notify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
