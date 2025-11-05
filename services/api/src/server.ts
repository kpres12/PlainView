import Fastify from "fastify";
import cors from "@fastify/cors";
import { MODULES, type Health } from "./shared";
import { registerValveOps } from "./modules/valveops";
import { registerPipelineGuard } from "./modules/pipelineguard";
import { registerRigSight } from "./modules/rigsight";
import { registerFlowIQ } from "./modules/flowiq";
import { registerIncidents } from "./modules/incidents";
import { registerEvents } from "./sse";

const fastify = Fastify({ logger: true });
const startedAt = Date.now();

await fastify.register(cors, { origin: true });

fastify.get("/health", async () => {
  const payload: Health = { status: "ok", uptimeSec: Math.floor((Date.now() - startedAt) / 1000) };
  return payload;
});

fastify.get("/modules", async () => MODULES);

fastify.get("/", async () => ({ name: "Plainview API", version: "0.0.1" }));

registerEvents(fastify);
registerValveOps(fastify);
registerPipelineGuard(fastify);
registerRigSight(fastify);
registerFlowIQ(fastify);
registerIncidents(fastify);

const port = Number(process.env.PORT || 4000);
fastify.listen({ port, host: "0.0.0.0" }).catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
