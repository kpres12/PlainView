import type { FastifyInstance } from "fastify";
import { bus } from "../sse";

const uuid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export interface Mission {
  id: string;
  title: string;
  type: "replay" | "scenario";
  status: "draft" | "active" | "paused" | "completed";
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  timeline: Array<{ timestamp: string; type: string; title: string; severity?: string; data: any }>;
  playbackSpeed: number;
}

const missions = new Map<string, Mission>();
let activeMission: Mission | null = null;

export function registerMissions(app: FastifyInstance) {
  // GET /missions
  app.get("/", async () => {
    return {
      count: missions.size,
      missions: Array.from(missions.values()),
      active: activeMission
    };
  });

  // POST /missions
  app.post<{ Body: Partial<Mission> }>("/", async (req: any) => {
    const mission: Mission = {
      id: uuid() as any,
      title: req.body.title || "Untitled",
      type: req.body.type || "replay",
      status: "draft",
      createdAt: new Date().toISOString(),
      timeline: req.body.timeline || [],
      playbackSpeed: 1
    };
    missions.set(mission.id, mission);
    return mission;
  });

  // GET /missions/:id
  app.get<{ Params: { id: string } }>("/:id", async (req) => {
    const m = missions.get(req.params.id);
    return m || { error: "not_found" };
  });

  // POST /missions/:id/start
  app.post<{ Params: { id: string } }>("/:id/start", async (req) => {
    const m = missions.get(req.params.id);
    if (!m) return { error: "not_found" };
    activeMission = { ...m, status: "active", startedAt: new Date().toISOString() };
    missions.set(m.id, activeMission);
    bus.emit("event", { type: "mission.started", missionId: m.id, at: Date.now() });
    return { ok: true };
  });

  // POST /missions/:id/pause
  app.post<{ Params: { id: string } }>("/:id/pause", async (req) => {
    const m = missions.get(req.params.id);
    if (!m) return { error: "not_found" };
    m.status = "paused";
    if (activeMission?.id === m.id) activeMission = null;
    return { ok: true };
  });

  // POST /missions/:id/resume
  app.post<{ Params: { id: string } }>("/:id/resume", async (req) => {
    const m = missions.get(req.params.id);
    if (!m) return { error: "not_found" };
    m.status = "active";
    activeMission = m;
    return { ok: true };
  });

  // POST /missions/:id/stop
  app.post<{ Params: { id: string } }>("/:id/stop", async (req) => {
    const m = missions.get(req.params.id);
    if (!m) return { error: "not_found" };
    m.status = "completed";
    m.completedAt = new Date().toISOString();
    if (activeMission?.id === m.id) activeMission = null;
    bus.emit("event", { type: "mission.completed", missionId: m.id, at: Date.now() });
    return { ok: true };
  });

  // POST /missions/:id/setspeed
  app.post<{ Params: { id: string }; Body: { speed: number } }>("/:id/setspeed", async (req) => {
    const m = missions.get(req.params.id);
    if (!m) return { error: "not_found" };
    m.playbackSpeed = Math.max(0.1, Math.min(10, req.body.speed));
    return { ok: true, speed: m.playbackSpeed };
  });

  // POST /missions/:id/branch - create scenario from mission
  app.post<{ Params: { id: string }; Body: any }>("/:id/branch", async (req: any) => {
    const source = missions.get(req.params.id);
    if (!source) return { error: "not_found" };
    const scenario: Mission = {
      ...source,
      id: uuid() as any,
      type: "scenario",
      title: req.body.title || `${source.title} (Scenario)`,
      status: "draft",
      createdAt: new Date().toISOString()
    };
    missions.set(scenario.id, scenario);
    return scenario;
  });

  // GET /missions/status/active
  app.get("/status/active", async () => {
    return {
      active: !!activeMission,
      mission: activeMission,
      progress: activeMission ? Math.random() * 100 : 0
    };
  });
}
