import type { FastifyInstance } from "fastify";

export function registerRigSight(app: FastifyInstance) {
  app.get("/rig/cameras", async () => {
    return [
      { id: "cam-thermal-a", type: "thermal", status: "online" },
      { id: "cam-rgb-b", type: "rgb", status: "online" }
    ];
  });
}
