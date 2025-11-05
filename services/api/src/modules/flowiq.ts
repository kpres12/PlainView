import type { FastifyInstance } from "fastify";

export function registerFlowIQ(app: FastifyInstance) {
  app.get("/flow/health", async () => {
    return [
      { id: "pump-4", health: 0.86, trend: "down" },
      { id: "compressor-2", health: 0.72, trend: "stable" }
    ];
  });
}
