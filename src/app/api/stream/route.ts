import { getState, addSSEClient, removeSSEClient } from "@/lib/sensorStore";

// GET /api/stream — Server-Sent Events stream for real-time dashboard updates
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately on connect
      const current = getState();
      if (current) {
        const initial = `data: ${JSON.stringify(current)}\n\n`;
        controller.enqueue(new TextEncoder().encode(initial));
      }

      // Register this client for future broadcasts
      addSSEClient(controller);

      // Send keepalive every 15s to prevent connection timeout
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 15000);

      // Cleanup is handled when the client disconnects (stream closes)
      // The ReadableStream cancel callback handles this
    },
    cancel(controller) {
      removeSSEClient(controller as ReadableStreamDefaultController);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Prevent Next.js from statically optimizing this route
export const dynamic = "force-dynamic";
