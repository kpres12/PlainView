import Fastify from "fastify";
import cors from "@fastify/cors";
import { MODULES, type Health } from "./shared";
import { registerValveOps } from "./modules/valveops";
import { registerPipelineGuard } from "./modules/pipelineguard";
import { registerRigSight } from "./modules/rigsight";
import { registerFlowIQ } from "./modules/flowiq";
import { registerIncidents } from "./modules/incidents";
import { registerMissions } from "./modules/missions-lite";
import { registerEvents } from "./sse";
import { registerROS2Bridge } from "./ros2-bridge";
// import { WsControlServer } from "./ws-server";
// WebSocket will be initialized after installing ws dependency

const fastify = Fastify({ logger: true });
const startedAt = Date.now();

await fastify.register(cors, { origin: true });

// let wsServer: WsControlServer;

fastify.get("/health", async () => {
  const payload: Health = { status: "ok", uptimeSec: Math.floor((Date.now() - startedAt) / 1000) };
  return payload;
});

fastify.get("/modules", async () => MODULES);

fastify.get("/", async () => ({ name: "Plainview API", version: "0.0.1" }));

registerEvents(fastify);

// Register domain modules with route prefixes
fastify.register(async (f) => registerValveOps(f), { prefix: "/valves" });
fastify.register(async (f) => registerPipelineGuard(f), { prefix: "/pipeline" });
fastify.register(async (f) => registerRigSight(f), { prefix: "/rig" });
fastify.register(async (f) => registerFlowIQ(f), { prefix: "/flow" });
fastify.register(async (f) => registerIncidents(f), { prefix: "/incidents" });
fastify.register(async (f) => registerMissions(f), { prefix: "/missions" });
fastify.register(async (f) => registerROS2Bridge(f), { prefix: "/ros2" });

// Add endpoint to query WS server status
// fastify.get("/ws/status", async () => {
//   return {
//     connectedClients: wsServer?.getClients() || 0,
//     recentCommands: wsServer?.getCommandHistory(20) || []
//   };
// });

const port = Number(process.env.PORT || 4000);
fastify.listen({ port, host: "0.0.0.0" }).catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});

// TODO: Initialize WebSocket server after installing ws dependency
// const wsServer = new WsControlServer(fastify.server as any);
// console.log(`✓ WebSocket control server initialized on ws://localhost:${port}/control`);
