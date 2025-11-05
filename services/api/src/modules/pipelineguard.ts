import type { FastifyInstance } from "fastify";

export function registerPipelineGuard(app: FastifyInstance) {
  app.get("/pipeline/alerts", async () => {
    return [
      { id: "leak-001", assetId: "pipe-17", type: "leak", severity: "low", at: Date.now() - 60_000 },
      { id: "vibe-002", assetId: "pump-4", type: "vibration", severity: "med", at: Date.now() - 10_000 }
    ];
  });
}
