import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const FILES = {
  incidents: join(DATA_DIR, "incidents.json"),
  valves: join(DATA_DIR, "valves.json")
} as const;

type Incident = {
  id: string;
  type: "leak" | "spill" | "vibration" | "heat";
  assetId: string;
  severity: "low" | "med" | "high";
  at: number;
  meta?: Record<string, any>;
};

type ValvesState = Record<string, { lastTorqueNm?: number; lastActuationTime?: string; actuations?: any[]; updatedAt?: number }>

function ensure() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILES.incidents)) writeFileSync(FILES.incidents, "[]");
  if (!existsSync(FILES.valves)) writeFileSync(FILES.valves, "{}\n");
}

function readJSON<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(path: string, data: any) {
  writeFileSync(path, JSON.stringify(data, null, 2));
}

export const store = {
  init: () => ensure(),
  listIncidents(): Incident[] {
    ensure();
    return readJSON(FILES.incidents, [] as Incident[]);
  },
  addIncident(inc: Incident) {
    ensure();
    const all = readJSON(FILES.incidents, [] as Incident[]);
    all.push(inc);
    writeJSON(FILES.incidents, all);
  },
  getValves(): ValvesState {
    ensure();
    return readJSON(FILES.valves, {} as ValvesState);
  },
  upsertValve(id: string, patch: Partial<ValvesState[string]>) {
    ensure();
    const s = readJSON(FILES.valves, {} as ValvesState);
    s[id] = { ...(s[id] || {}), ...patch, updatedAt: Date.now() };
    writeJSON(FILES.valves, s);
  }
};

export type { Incident, ValvesState };