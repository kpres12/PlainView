import type { FastifyInstance } from "fastify";
import { bus } from "../sse";
import { store } from "../store";

export type Valve = {
  id: string;
  name: string;
  status: "ok" | "warning" | "offline";
  lastTorqueNm?: number;
};

const valves: Valve[] = [
  { id: "v-101", name: "Wellhead A1", status: "ok" },
  { id: "v-102", name: "Manifold B2", status: "warning", lastTorqueNm: 48 },
  { id: "v-103", name: "Isolation C3", status: "ok" }
];

export function registerValveOps(app: FastifyInstance) {
  store.init();

  app.get("/valves", async () => {
    const vs = store.getValves();
    return valves.map((v) => ({ ...v, lastTorqueNm: vs[v.id]?.lastTorqueNm ?? v.lastTorqueNm }));
  });

  app.post<{ Params: { id: string } }>("/valves/:id/actuate", async (req) => {
    const id = req.params.id;
    const v = valves.find((x) => x.id === id);
    if (!v) return { ok: false, error: "not_found" };

    bus.emit("event", { type: "valve.actuation.requested", valveId: id, requestedAt: Date.now() });

    // simulate work
    setTimeout(() => {
      const torque = Math.floor(40 + Math.random() * 20);
      store.upsertValve(id, { lastTorqueNm: torque });
      bus.emit("event", {
        type: "valve.actuation.completed",
        valveId: id,
        torqueNm: torque,
        completedAt: Date.now()
      });
    }, 1200);

    return { ok: true };
  });
}
