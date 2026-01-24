import { onLogUpdate } from "@/src/utils/logStream";
import { requireAdminSession } from "@/src/utils/adminAuth";
import { logInfo } from "@/src/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminSession(); // Session je async kvuli cookies().
  if (!session.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };

      send("connected", "ok");
      logInfo("SSE admin stream připojen", { userId: session.userId });

      unsubscribe = onLogUpdate(() => {
        send("log_update", "ping"); // Trigger pro reload dat na klientovi.
      });

      heartbeat = setInterval(() => {
        send("heartbeat", "ping");
      }, 25_000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      logInfo("SSE admin stream odpojen");
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
