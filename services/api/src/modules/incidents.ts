import type { FastifyInstance } from "fastify";
import { bus } from "../sse";

const uuid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
import type { Incident, TimelineEvent, ModuleKey } from "@plainview/shared";

const incidents: Map<string, Incident> = new Map();
const alertQueue: any[] = [];

// Simple correlation engine
function correlateAlerts(newAlert: any): Incident | null {
  // Check if we can correlate this alert with an active incident
  const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
  const recentIncidents = Array.from(incidents.values()).filter(
    (inc) => inc.status !== "resolved" && new Date(inc.startedAt).getTime() > twoMinutesAgo
  );

  // Simple correlation: if same location within 2 min window, same incident
  if (newAlert.latitude && newAlert.longitude) {
    for (const incident of recentIncidents) {
      // Check if nearby (within 0.01 degrees ~ 1km)
      if (incident.detectionIds.length > 0) {
        return incident; // Simplified: group by module
      }
    }
  }

  return null;
}

function createTimelineEvent(
  type: "detection" | "alert" | "action" | "update",
  title: string,
  description: string,
  metadata?: Record<string, any>
): TimelineEvent {
  return {
    timestamp: new Date().toISOString(),
    type,
    title,
    description,
    metadata
  };
}

export function registerIncidents(app: FastifyInstance) {
  // Listen for all alert events and correlate into incidents
  const handleAlert = (event: any) => {
    if (event.type !== "alert.created") return;

    alertQueue.push(event);

    // Try to correlate
    const existingIncident = correlateAlerts(event);

    if (existingIncident) {
      // Add to existing incident
      existingIncident.alertIds.push(event.id || uuid());
      existingIncident.timeline.push(
        createTimelineEvent(
          "alert",
          "New alert",
          `${event.severity?.toUpperCase() || "INFO"}: ${event.message || "Alert"}`,
          event
        )
      );

      bus.emit("event", {
        type: "incident.updated",
        incidentId: existingIncident.id,
        timestamp: new Date().toISOString()
      });
    } else {
      // Create new incident
      const incident: Incident = {
        id: uuid() as any,
        title: event.message || "Incident",
        severity: event.severity || "warning",
        status: "active",
        startedAt: new Date().toISOString(),
        affectedModules: [event.moduleKey || "valve-ops"],
        detectionIds: [],
        alertIds: [event.id || uuid() as any],
        timeline: [
          createTimelineEvent("alert", "Incident Started", `${event.message}`, event)
        ]
      };

      incidents.set(incident.id, incident);

      bus.emit("event", {
        type: "incident.created",
        incidentId: incident.id,
        severity: incident.severity,
        timestamp: new Date().toISOString()
      });
    }
  };

  bus.on("event", handleAlert);

  // GET /incidents - list active and recent incidents
  app.get("/", async () => {
    const active = Array.from(incidents.values()).filter((i) => i.status === "active");
    const recent = Array.from(incidents.values())
      .filter((i) => new Date(i.startedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return {
      activeCount: active.length,
      activeIncidents: active,
      recentIncidents: recent.slice(0, 20)
    };
  });

  // GET /incidents/:id - detailed incident view
  app.get<{ Params: { id: string } }>("/:id", async (req) => {
    const incident = incidents.get(req.params.id);
    return incident || { error: "not_found" };
  });

  // POST /incidents/:id/update - update incident status
  app.post<{ Params: { id: string } }>("/:id/update", async (req: any) => {
    const incident = incidents.get(req.params.id);
    if (!incident) return { error: "not_found" };

    const { status, rootCause, resolution } = req.body;
    if (status) incident.status = status;
    if (rootCause) {
      incident.rootCause = rootCause;
      incident.timeline.push(
        createTimelineEvent(
          "update",
          "Root Cause Identified",
          rootCause
        )
      );
    }
    if (resolution) {
      incident.resolution = resolution;
      incident.status = "resolved";
      incident.resolvedAt = new Date().toISOString();
      incident.timeline.push(
        createTimelineEvent(
          "action",
          "Incident Resolved",
          resolution
        )
      );
    }

    bus.emit("event", {
      type: "incident.updated",
      incidentId: incident.id,
      timestamp: new Date().toISOString()
    });

    return incident;
  });

  // GET /incidents/:id/timeline - incident timeline details
  app.get<{ Params: { id: string } }>("/:id/timeline", async (req) => {
    const incident = incidents.get(req.params.id);
    if (!incident) return { error: "not_found" };

    return {
      incidentId: incident.id,
      title: incident.title,
      status: incident.status,
      startedAt: incident.startedAt,
      resolvedAt: incident.resolvedAt,
      timeline: incident.timeline.sort(
        (a: TimelineEvent, b: TimelineEvent) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    };
  });

  // GET /health - incident system health
  app.get("/health", async () => {
    const allIncidents = Array.from(incidents.values());
    const active = allIncidents.filter((i) => i.status === "active");
    const critical = allIncidents.filter((i) => i.severity === "critical");
    const avgResolutionTime =
      allIncidents
        .filter((i) => i.resolvedAt)
        .reduce((sum, i) => {
          const start = new Date(i.startedAt).getTime();
          const end = new Date(i.resolvedAt || "").getTime();
          return sum + (end - start);
        }, 0) / Math.max(1, allIncidents.filter((i) => i.resolvedAt).length) /
      1000 /
      60; // minutes

    return {
      timestamp: new Date().toISOString(),
      totalIncidents: allIncidents.length,
      activeIncidents: active.length,
      criticalIncidents: critical.length,
      avgResolutionMinutes: Math.round(avgResolutionTime),
      systemHealth: active.length === 0 ? 100 : Math.max(0, 100 - active.length * 10)
    };
  });

  return () => {
    bus.off("event", handleAlert);
  };
}
