export type ModuleKey =
  | "pipeline-guard"
  | "rig-sight"
  | "valve-ops"
  | "flow-iq";

export interface Health {
  status: "ok" | "degraded" | "down";
  uptimeSec: number;
}

export interface ModuleDescriptor {
  key: ModuleKey;
  title: string;
  description: string;
}

export const MODULES: ModuleDescriptor[] = [
  { key: "pipeline-guard", title: "PipelineGuard", description: "Robot control & leak prevention" },
  { key: "rig-sight", title: "RigSight", description: "Camera/thermal integration for safety monitoring" },
  { key: "valve-ops", title: "ValveOps", description: "Autonomous actuation & maintenance scheduling" },
  { key: "flow-iq", title: "FlowIQ", description: "Predictive analytics & anomaly detection" }
];

// === Detections & Alerts ===
export type DetectionType = "smoke" | "flame" | "heat" | "leak" | "spill" | "pressure_anomaly";
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "active" | "acknowledged" | "resolved";

export interface Detection {
  id: string;
  type: DetectionType;
  confidence: number; // 0-1
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp: string; // ISO 8601
  sourceId: string; // device/camera ID
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  latitude?: number;
  longitude?: number;
  detectionId?: string;
  timestamp: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  moduleKey: ModuleKey;
}

// === Valve Operations ===
export type ValveStatus = "ok" | "warning" | "offline" | "maintenance";

export interface Valve {
  id: string;
  name: string;
  status: ValveStatus;
  lastTorqueNm?: number;
  lastActuationTime?: string;
  temperature?: number;
  pressurePa?: number;
  estimatedMaintenance?: string; // ISO 8601
}

export interface ValveActuation {
  valveId: string;
  requestedAt: string;
  torqueNm?: number;
  completedAt?: string;
  success: boolean;
  duration?: number; // milliseconds
}

// === Flow Health ===
export interface FlowMetrics {
  flowRateLpm: number;
  pressurePa: number;
  temperatureC: number;
  viscosity?: number;
  timestamp: string;
}

export interface FlowAnomaly {
  id: string;
  type: "pressure_deviation" | "flow_rate_deviation" | "temperature_spike" | "viscosity_change";
  severity: "low" | "medium" | "high";
  detectedAt: string;
  metrics: Partial<FlowMetrics>;
  expectedRange?: { min: number; max: number };
  actualValue?: number;
}

// === Incidents ===
export interface Incident {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: "active" | "investigating" | "mitigated" | "resolved";
  startedAt: string;
  resolvedAt?: string;
  affectedModules: ModuleKey[];
  detectionIds: string[];
  alertIds: string[];
  rootCause?: string;
  resolution?: string;
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  timestamp: string;
  type: "detection" | "alert" | "action" | "update";
  title: string;
  description: string;
  metadata?: Record<string, any>;
}

// === Events (SSE) ===
export type EventType =
  | "valve.actuation.requested"
  | "valve.actuation.completed"
  | "alert.created"
  | "alert.acknowledged"
  | "detection.made"
  | "flow.metrics.updated"
  | "anomaly.detected"
  | "incident.created"
  | "incident.updated"
  | "telemetry.heartbeat";

export interface DomainEvent {
  type: EventType;
  timestamp: string; // ISO 8601
  payload: Record<string, any>;
  moduleKey?: ModuleKey;
}

// === Camera/RigSight ===
export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline" | "degraded";
  resolution?: string;
  frameRate?: number;
  lastFrame?: {
    url: string;
    timestamp: string;
    anomalies?: string[];
  };
}

// === Pipeline Guard ===
export interface LeakDetection {
  id: string;
  severity: "minor" | "major" | "critical";
  location: {
    latitude: number;
    longitude: number;
    section?: string;
  };
  volumeEstimate?: number; // liters
  detectedAt: string;
  status: "active" | "contained" | "repaired";
}

export interface PipelineHealth {
  timestamp: string;
  integrityScore: number; // 0-100
  activeLeaks: number;
  lastInspection?: string;
  maintenanceDue?: string;
  pressureProfile?: { location: string; pressurePa: number }[];
}
