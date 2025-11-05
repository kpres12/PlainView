import type { FastifyInstance } from "fastify";
import { bus } from "../sse";

const uuid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
import type { LeakDetection, PipelineHealth, Alert } from "@plainview/shared";

const leaksHistory: LeakDetection[] = [];
const pipelineSections = [
  "A-North",
  "B-Central",
  "C-South",
  "D-East",
  "E-West"
];

function generateSimulatedLeak(): LeakDetection | null {
  // 10% chance of detecting a leak
  if (Math.random() > 0.1) return null;

  const section = pipelineSections[Math.floor(Math.random() * pipelineSections.length)];
  const severity = (
    ["minor", "major", "critical"] as const
  )[Math.floor(Math.random() * 3)];

  return {
    id: uuid() as any,
    severity,
    location: {
      latitude: 40 + Math.random() * 2,
      longitude: -120 + Math.random() * 2,
      section
    },
    volumeEstimate: severity === "critical" ? 500 + Math.random() * 1000 : severity === "major" ? 100 + Math.random() * 200 : 10 + Math.random() * 30,
    detectedAt: new Date().toISOString(),
    status: "active"
  };
}

export function registerPipelineGuard(app: FastifyInstance) {
  // Simulate leak monitoring every 10 seconds
  const monitoringInterval = setInterval(() => {
    const leak = generateSimulatedLeak();
    if (leak) {
      leaksHistory.push(leak);
      // Keep history limited
      if (leaksHistory.length > 100) leaksHistory.shift();

      // Emit alert
      bus.emit("event", {
        type: "alert.created",
        severity: leak.severity === "critical" ? "critical" : "warning",
        message: `${leak.severity.toUpperCase()} leak detected in ${leak.location.section}. Estimated volume: ${(leak.volumeEstimate || 0).toFixed(1)}L`,
        latitude: leak.location.latitude,
        longitude: leak.location.longitude,
        timestamp: new Date().toISOString()
      });
    }
  }, 10000);

  // GET /pipeline/alerts - active and recent leaks
  app.get("/alerts", async () => {
    const activeLeaks = leaksHistory.filter((l) => l.status === "active");
    const recentLeaks = leaksHistory.slice(-10);

    return {
      activeLeakCount: activeLeaks.length,
      criticalCount: activeLeaks.filter((l) => l.severity === "critical").length,
      activeLeaks: activeLeaks.slice(-20),
      recentHistory: recentLeaks,
      integrity: (() => {
        let score = 100;
        activeLeaks.forEach((leak) => {
          if (leak.severity === "critical") score -= 40;
          else if (leak.severity === "major") score -= 15;
          else score -= 5;
        });
        return Math.max(0, score);
      })()
    };
  });

  // GET /pipeline/health - overall health report
  app.get("/health", async () => {
    const activeLeaks = leaksHistory.filter((l) => l.status === "active");
    const totalVolumeLost = activeLeaks.reduce((sum, l) => sum + (l.volumeEstimate || 0), 0);

    return {
      timestamp: new Date().toISOString(),
      integrityScore: (() => {
        let score = 100;
        activeLeaks.forEach((leak) => {
          if (leak.severity === "critical") score -= 40;
          else if (leak.severity === "major") score -= 15;
          else score -= 5;
        });
        return Math.max(0, score);
      })(),
      activeLeaks: activeLeaks.length,
      lastInspection: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      maintenanceDue: activeLeaks.length > 3 ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedVolumeLost: totalVolumeLost,
      pressureProfile: pipelineSections.map((section) => ({
        location: section,
        pressurePa: 2500000 - Math.random() * 200000 // slight variation
      }))
    } as PipelineHealth;
  });

  // GET /pipeline/sections/:section - section-specific details
  app.get<{ Params: { section: string } }>("/sections/:section", async (req) => {
    const section = req.params.section;
    const sectionLeaks = leaksHistory.filter(
      (l) => l.location.section === section && l.status === "active"
    );

    return {
      section,
      activeLeaks: sectionLeaks,
      riskLevel: sectionLeaks.length > 5 ? "high" : sectionLeaks.length > 2 ? "medium" : "low",
      lastIncident: leaksHistory
        .filter((l) => l.location.section === section)
        .slice(-1)[0] || null
    };
  });

  // POST /pipeline/alerts/:id/resolve - mark leak as resolved
  app.post<{ Params: { id: string } }>("/alerts/:id/resolve", async (req) => {
    const leak = leaksHistory.find((l) => l.id === req.params.id);
    if (!leak) return { ok: false, error: "not_found" };

    leak.status = "repaired";
    bus.emit("event", {
      type: "alert.acknowledged",
      leakId: leak.id,
      timestamp: new Date().toISOString()
    });

    return { ok: true, leak };
  });

  return () => clearInterval(monitoringInterval);
}
