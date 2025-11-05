import type { FastifyInstance } from "fastify";
import { bus } from "../sse";
import { store } from "../store";

const uuid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
import type { Valve, ValveActuation } from "@plainview/shared";

// Valve inventory with health thresholds
const valveInventory: Valve[] = [
  {
    id: "v-101",
    name: "Wellhead A1",
    status: "ok",
    temperature: 45,
    pressurePa: 2500000, // 25 bar
    estimatedMaintenance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  },
  {
    id: "v-102",
    name: "Manifold B2",
    status: "warning",
    lastTorqueNm: 48,
    temperature: 62,
    pressurePa: 2800000, // pressure trending high
    estimatedMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  },
  {
    id: "v-103",
    name: "Isolation C3",
    status: "ok",
    temperature: 42,
    pressurePa: 2400000,
    estimatedMaintenance: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Health thresholds
const THRESHOLDS = {
  tempWarning: 60, // °C
  tempCritical: 75,
  pressureWarning: 2800000, // Pa (28 bar)
  pressureCritical: 3000000, // Pa (30 bar)
  torqueVariance: 5 // Nm
};

function updateValveHealth(valve: Valve): Valve {
  let status: "ok" | "warning" | "offline" | "maintenance" = "ok";
  let alerts: string[] = [];

  if (valve.temperature && valve.temperature > THRESHOLDS.tempCritical) {
    status = "offline";
    alerts.push(`Critical temperature: ${valve.temperature}°C`);
  } else if (valve.temperature && valve.temperature > THRESHOLDS.tempWarning) {
    status = "warning";
    alerts.push(`High temperature: ${valve.temperature}°C`);
  }

  if (valve.pressurePa && valve.pressurePa > THRESHOLDS.pressureCritical) {
    status = "offline";
    alerts.push(`Critical pressure: ${(valve.pressurePa / 1e5).toFixed(1)} bar`);
  } else if (valve.pressurePa && valve.pressurePa > THRESHOLDS.pressureWarning) {
    if (status !== "offline") status = "warning";
    alerts.push(`High pressure: ${(valve.pressurePa / 1e5).toFixed(1)} bar`);
  }

  // Check if maintenance is due
  if (valve.estimatedMaintenance && new Date(valve.estimatedMaintenance) <= new Date()) {
    status = "maintenance";
    alerts.push("Maintenance overdue");
  }

  // Emit alerts if status changed
  if (status !== valve.status && alerts.length > 0) {
    bus.emit("event", {
      type: "alert.created",
      valveId: valve.id,
      severity: status === "offline" ? "critical" : "warning",
      message: alerts.join("; "),
      timestamp: new Date().toISOString()
    });
  }

  return { ...valve, status };
}

export function registerValveOps(app: FastifyInstance) {
  store.init();

  // GET /valves - list all valves with current health
  app.get("/valves", async () => {
    const vs = store.getValves();
    return valveInventory.map((v) => {
      const stored = vs[v.id];
      const updated: Valve = {
        ...v,
        lastTorqueNm: stored?.lastTorqueNm ?? v.lastTorqueNm,
        lastActuationTime: stored?.lastActuationTime
      };
      // Simulate temperature/pressure drift
      if (Math.random() < 0.3) {
        updated.temperature = (updated.temperature || 50) + (Math.random() - 0.5) * 2;
      }
      return updateValveHealth(updated);
    });
  });

  // GET /valves/:id - get single valve with history
  app.get<{ Params: { id: string } }>("/valves/:id", async (req) => {
    const v = valveInventory.find((x) => x.id === req.params.id);
    if (!v) return null;
    const stored = store.getValves()[v.id];
    return updateValveHealth({
      ...v,
      lastTorqueNm: stored?.lastTorqueNm ?? v.lastTorqueNm,
      lastActuationTime: stored?.lastActuationTime
    });
  });

  // POST /valves/:id/actuate - actuate valve with telemetry
  app.post<{ Params: { id: string } }>("/valves/:id/actuate", async (req) => {
    const id = req.params.id;
    const v = valveInventory.find((x) => x.id === id);
    if (!v) return { ok: false, error: "not_found" };

    const actuationId = uuid() as any;
    const requestedAt = new Date().toISOString();

    bus.emit("event", {
      type: "valve.actuation.requested",
      valveId: id,
      requestedAt: Date.now()
    });

    // Simulate actuation with realistic timing and torque variation
    setTimeout(() => {
      const baseTorque = 50;
      const torque = baseTorque + (Math.random() - 0.5) * THRESHOLDS.torqueVariance;
      const completedAt = new Date().toISOString();
      const duration = Math.floor(800 + Math.random() * 600);

      store.upsertValve(id, {
        lastTorqueNm: torque,
        lastActuationTime: completedAt,
        actuations: [{ valveId: id, requestedAt, torqueNm: torque, completedAt, success: true, duration }]
      });

      bus.emit("event", {
        type: "valve.actuation.completed",
        valveId: id,
        torqueNm: torque,
        completedAt: Date.now()
      });
    }, 1000 + Math.random() * 400);

    return { ok: true, actuationId };
  });

  // GET /valves/:id/health - detailed health report
  app.get<{ Params: { id: string } }>("/valves/:id/health", async (req) => {
    const v = valveInventory.find((x) => x.id === req.params.id);
    if (!v) return null;
    const stored = store.getValves()[v.id];
    const updated = updateValveHealth({ ...v, lastTorqueNm: stored?.lastTorqueNm ?? v.lastTorqueNm });

    return {
      valveId: v.id,
      status: updated.status,
      temperature: updated.temperature,
      pressurePa: updated.pressurePa,
      lastTorqueNm: updated.lastTorqueNm,
      lastActuationTime: updated.lastActuationTime,
      estimatedMaintenance: updated.estimatedMaintenance,
      thresholds: THRESHOLDS,
      healthScore: (() => {
        let score = 100;
        if (updated.temperature && updated.temperature > THRESHOLDS.tempWarning) score -= 20;
        if (updated.pressurePa && updated.pressurePa > THRESHOLDS.pressureWarning) score -= 20;
        if (new Date(updated.estimatedMaintenance || "") <= new Date()) score -= 30;
        return Math.max(0, score);
      })()
    };
  });
}
