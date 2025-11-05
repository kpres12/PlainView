import type { FastifyInstance } from "fastify";
import { store, type Incident } from "../store";
import { bus } from "../sse";

export function registerIncidents(app: FastifyInstance) {
  store.init();

  app.get("/incidents", async () => store.listIncidents());

  app.post<{ Body: Omit<Incident, "id" | "at"> & { id?: string; at?: number } }>("/incidents", async (req) => {
    const body = req.body;
    const inc: Incident = {
      id: body.id || `inc-${Date.now()}`,
      type: body.type as Incident["type"],
      assetId: body.assetId,
      severity: body.severity as Incident["severity"],
      at: body.at || Date.now(),
      meta: body.meta || {}
    };
    store.addIncident(inc);
    if (inc.type === "leak") {
      bus.emit("event", { type: "leak.alert", assetId: inc.assetId, severity: inc.severity, at: inc.at });
    }
    return { ok: true, incident: inc };
  });
}
