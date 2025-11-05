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
