import type { FastifyInstance } from "fastify";
import { bus } from "../sse";
import { sentinelClient, type SpreadParameters } from "../sentinel-client";
import { db } from "../db/client";

const uuid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Cache last spread prediction
let lastSpreadPrediction: any = null;
let lastPredictionTime = 0;
const PREDICTION_CACHE_MS = 5 * 60 * 1000; // 5 min
import type { FlowMetrics, FlowAnomaly } from "@plainview/shared";

// Simulate flow health data
const baselineMetrics: FlowMetrics = {
  flowRateLpm: 150,
  pressurePa: 2500000,
  temperatureC: 45,
  timestamp: new Date().toISOString()
};

const anomalyHistory: FlowAnomaly[] = [];
const metricsHistory: FlowMetrics[] = [];
let ros2Active = false;

function detectAnomalies(current: FlowMetrics): FlowAnomaly[] {
  const anomalies: FlowAnomaly[] = [];
  const recent = metricsHistory.slice(-10); // last 10 readings

  if (recent.length >= 3) {
    // Flow rate anomaly detection
    const avgFlow = recent.reduce((sum, m) => sum + m.flowRateLpm, 0) / recent.length;
    const flowDeviation = Math.abs(current.flowRateLpm - avgFlow);
    if (flowDeviation > avgFlow * 0.25) {
      // >25% deviation
      anomalies.push({
        id: uuid() as any,
        type: "flow_rate_deviation",
        severity: flowDeviation > avgFlow * 0.5 ? "high" : "medium",
        detectedAt: new Date().toISOString(),
        metrics: { flowRateLpm: current.flowRateLpm },
        expectedRange: { min: avgFlow * 0.75, max: avgFlow * 1.25 },
        actualValue: current.flowRateLpm
      });
    }

    // Pressure anomaly detection
    const avgPressure = recent.reduce((sum, m) => sum + m.pressurePa, 0) / recent.length;
    const pressureDeviation = Math.abs(current.pressurePa - avgPressure);
    if (pressureDeviation > 100000) {
      // >100kPa deviation
      anomalies.push({
        id: uuid() as any,
        type: "pressure_deviation",
        severity: pressureDeviation > 200000 ? "high" : "low",
        detectedAt: new Date().toISOString(),
        metrics: { pressurePa: current.pressurePa },
        expectedRange: { min: avgPressure - 100000, max: avgPressure + 100000 },
        actualValue: current.pressurePa
      });
    }

    // Temperature anomaly
    const avgTemp = recent.reduce((sum, m) => sum + m.temperatureC, 0) / recent.length;
    const tempDeviation = Math.abs(current.temperatureC - avgTemp);
    if (tempDeviation > 10) {
      // >10°C deviation
      anomalies.push({
        id: uuid() as any,
        type: "temperature_spike",
        severity: tempDeviation > 20 ? "high" : "medium",
        detectedAt: new Date().toISOString(),
        metrics: { temperatureC: current.temperatureC },
        expectedRange: { min: avgTemp - 5, max: avgTemp + 5 },
        actualValue: current.temperatureC
      });
    }
  }

  return anomalies;
}

export async function ingestFlowTelemetry(sample: Partial<FlowMetrics> & { timestamp?: number | string }) {
  ros2Active = true;
  const last = metricsHistory[metricsHistory.length - 1] || baselineMetrics;
  const current: FlowMetrics = {
    flowRateLpm: sample.flowRateLpm ?? last.flowRateLpm,
    pressurePa: sample.pressurePa ?? last.pressurePa,
    temperatureC: sample.temperatureC ?? last.temperatureC,
    timestamp: sample.timestamp ? new Date(sample.timestamp).toISOString() : new Date().toISOString()
  };

  metricsHistory.push(current);
  if (metricsHistory.length > 100) metricsHistory.shift();

  await db.insertMetric(current);

  const anomalies = detectAnomalies(current);
  anomalies.forEach((anom) => {
    anomalyHistory.push(anom);
    bus.emit("event", {
      type: "anomaly.detected",
      assetId: "flow-system",
      anomalyType: anom.type,
      confidence: anom.severity === "high" ? 0.95 : 0.7,
      at: Date.now()
    } as any);
  });

  bus.emit("event", { type: "flow.metrics.updated", metrics: current } as any);
}

export function registerFlowIQ(app: FastifyInstance) {
  // Simulate metric collection every 5 seconds (disabled when ROS2 is active)
  const collectionInterval = setInterval(async () => {
    if (ros2Active) return; // ROS2 supplying real telemetry
    const noise = {
      flow: (Math.random() - 0.5) * 10,
      pressure: (Math.random() - 0.5) * 50000,
      temp: (Math.random() - 0.5) * 3
    };

    const current: FlowMetrics = {
      flowRateLpm: Math.max(100, baselineMetrics.flowRateLpm + noise.flow),
      pressurePa: Math.max(2300000, baselineMetrics.pressurePa + noise.pressure),
      temperatureC: Math.max(20, baselineMetrics.temperatureC + noise.temp),
      timestamp: new Date().toISOString()
    };

    metricsHistory.push(current);
    if (metricsHistory.length > 100) metricsHistory.shift(); // keep last 100
    
    // Persist to DB
    await db.insertMetric(current);

    const anomalies = detectAnomalies(current);
    anomalies.forEach((anom) => {
      anomalyHistory.push(anom);
      bus.emit("event", {
        type: "anomaly.detected",
        assetId: "flow-system",
        anomalyType: anom.type,
        confidence: anom.severity === "high" ? 0.95 : 0.7,
        at: Date.now()
      });
    });

    bus.emit("event", {
      type: "flow.metrics.updated",
      metrics: current
    });
  }, 5000);

  // GET /flow/health - current system health
  app.get("/health", async () => {
    const current = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1] : baselineMetrics;
    const anomalies = anomalyHistory.filter(
      (a) => new Date(a.detectedAt).getTime() > Date.now() - 60 * 60 * 1000 // last hour
    );

    return {
      timestamp: new Date().toISOString(),
      currentMetrics: current,
      anomalyCount: anomalies.length,
      recentAnomalies: anomalies.slice(-5),
      healthScore: (() => {
        let score = 100;
        if (anomalies.length > 3) score -= 20;
        if (anomalies.some((a) => a.severity === "high")) score -= 30;
        return Math.max(0, score);
      })()
    };
  });

  // GET /flow/metrics - metrics history
  app.get("/metrics", async () => {
    return {
      current: metricsHistory[metricsHistory.length - 1] || baselineMetrics,
      history: metricsHistory.slice(-20), // last 20 readings
      stats: (() => {
        const flows = metricsHistory.map((m) => m.flowRateLpm);
        const pressures = metricsHistory.map((m) => m.pressurePa);
        const temps = metricsHistory.map((m) => m.temperatureC);
        return {
          flow: { min: Math.min(...flows), max: Math.max(...flows), avg: flows.reduce((a, b) => a + b) / flows.length },
          pressure: {
            min: Math.min(...pressures),
            max: Math.max(...pressures),
            avg: pressures.reduce((a, b) => a + b) / pressures.length
          },
          temperature: {
            min: Math.min(...temps),
            max: Math.max(...temps),
            avg: temps.reduce((a, b) => a + b) / temps.length
          }
        };
      })()
    };
  });

  // GET /flow/anomalies - historical anomalies
  app.get("/anomalies", async (req: any) => {
    const query = req.query;
    let results = anomalyHistory;

    if (query.severity) {
      results = results.filter((a) => a.severity === query.severity);
    }
    if (query.type) {
      results = results.filter((a) => a.type === query.type);
    }

    return results.slice(-50);
  });

  // GET /flow/history - historical metrics with aggregation
  app.get("/history", async (req: any) => {
    const { hoursBack = 1 } = req.query;
    const stats = await db.getMetricsStats(parseInt(hoursBack));
    return { stats, anomaliesCount: anomalyHistory.length };
  });

  // GET /flow/range - query metrics by time range
  app.get("/range", async (req: any) => {
    const { start, end } = req.query;
    if (!start || !end) {
      return { error: "start and end query params required" };
    }
    const metrics = await db.queryMetricsRange(start, end);
    const agg = await db.aggregateMetrics(start, end);
    return { metrics, aggregation: agg };
  });

  // GET /flow/source - show current data source (mock vs ROS2)
  app.get("/source", async () => {
    return { source: ros2Active ? "ros2" : "mock" };
  });

  // GET /flow/recentanomalies - anomalies from last N hours
  app.get("/recentanomalies", async (req: any) => {
    const { hours = 1, limit = 50 } = req.query;
    return db.queryRecentAnomalies(parseInt(hours), parseInt(limit));
  });

  // GET /flow/export - export CSV for analysis
  app.get("/export", async (req: any) => {
    const { hours = 24 } = req.query;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const endTime = new Date().toISOString();
    const metrics = await db.queryMetricsRange(startTime, endTime);
    
    // Simple CSV format
    const csv =
      "timestamp,flow_lpm,pressure_pa,temperature_c\n" +
      metrics.map((m) => `${m.time},${m.flowRateLpm},${m.pressurePa},${m.temperatureC}`).join("\n");
    
    return { format: "csv", data: csv, rowCount: metrics.length };
  });

  // GET /flow/prediction - call Sentinel for spread prediction if anomalies detected
  app.get("/prediction", async () => {
    const now = Date.now();

    // Return cached prediction if recent
    if (lastSpreadPrediction && now - lastPredictionTime < PREDICTION_CACHE_MS) {
      return { cached: true, prediction: lastSpreadPrediction };
    }

    const recentAnomalies = anomalyHistory.filter(
      (a) => new Date(a.detectedAt).getTime() > now - 60 * 60 * 1000
    );

    if (recentAnomalies.length === 0) {
      return { hasPrediction: false, reason: "No recent anomalies" };
    }

    // Build Sentinel prediction request from anomalies
    const params: SpreadParameters = {
      ignition_points: [
        {
          latitude: 40.0,
          longitude: -120.0,
          altitude: 1000.0
        }
      ],
      conditions: {
        timestamp: new Date().toISOString(),
        latitude: 40.0,
        longitude: -120.0,
        temperature_c: baselineMetrics.temperatureC || 45,
        relative_humidity: 35,
        wind_speed_mps: 5,
        wind_direction_deg: 270,
        fuel_moisture: 0.2,
        fuel_model: 4,
        slope_deg: 15,
        aspect_deg: 180,
        elevation_m: 1000
      },
      simulation_hours: 6,
      time_step_minutes: 15,
      monte_carlo_runs: 50
    };

    const prediction = await sentinelClient.simulateSpread(params);

    if (prediction) {
      lastSpreadPrediction = prediction;
      lastPredictionTime = now;

      bus.emit("event", {
        type: "anomaly.detected",
        assetId: "flow-system",
        anomalyType: "spread_prediction",
        confidence: prediction.confidence.overall_confidence,
        at: Date.now()
      });

      return { hasPrediction: true, prediction, anomalyCount: recentAnomalies.length };
    }

    return { hasPrediction: false, reason: "Sentinel unavailable", anomalyCount: recentAnomalies.length };
  });

  return () => clearInterval(collectionInterval);
}
