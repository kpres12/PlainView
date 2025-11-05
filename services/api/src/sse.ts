import type { FastifyInstance } from "fastify";
import { EventEmitter } from "events";

export type PlainviewEvent =
  | { type: "valve.actuation.requested"; valveId: string; requestedAt: number }
  | { type: "valve.actuation.completed"; valveId: string; torqueNm: number; completedAt: number }
  | { type: "leak.alert"; assetId: string; severity: "low" | "med" | "high"; at: number }
  | { type: "telemetry.tick"; at: number }
  | { type: "anomaly.detected"; assetId: string; anomalyType: string; confidence: number; at: number }
  | { type: "mission.started"; missionId: string; missionName: string; at: number }
  | { type: "mission.completed"; missionId: string; duration: number; status: "success" | "failure"; at: number }
  | { type: "device.status"; deviceId: string; status: "online" | "offline"; at: number }
  | { type: "ros2.telemetry"; nodeId: string; topic: string; data: any; at: number }
  | { type: "ros2.node.discovered"; nodeId: string; nodeType: string; location?: { lat: number; lon: number }; at: number }
  | { type: "ros2.node.offline"; nodeId: string; at: number }
  | { type: "flow.metrics.updated"; metrics: any }; // ROS2 flow data ingestion

export const bus = new EventEmitter();

export function registerEvents(app: FastifyInstance) {
  app.get("/events", async (req, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*"
    });

    const write = (ev: PlainviewEvent) => {
      reply.raw.write(`event: ${ev.type}\n`);
      reply.raw.write(`data: ${JSON.stringify(ev)}\n\n`);
    };

    const listener = (ev: PlainviewEvent) => write(ev);
    bus.on("event", listener);

    // heartbeat
    const interval = setInterval(() => write({ type: "telemetry.tick", at: Date.now() }), 5000);

    req.raw.on("close", () => {
      clearInterval(interval);
      bus.off("event", listener);
    });

    // initial
    write({ type: "telemetry.tick", at: Date.now() });

    return reply;
  });
}
