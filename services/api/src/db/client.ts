/**
 * TimescaleDB persistence layer using Drizzle ORM
 * Handles time-series data for metrics, anomalies, and events
 */

import type { FlowMetrics, Incident } from "@plainview/shared";

// Mock database client (production: use Drizzle with postgres adapter)
// For dev, we use in-memory storage that simulates DB behavior

export interface StoredMetric {
  id: string;
  time: string;
  flowRateLpm: number;
  pressurePa: number;
  temperatureC: number;
  valveId?: string;
}

export interface StoredAnomaly {
  id: string;
  time: string;
  type: string;
  severity: string;
  valveId?: string;
  data: Record<string, any>;
}

export interface StoredActuation {
  id: string;
  time: string;
  valveId: string;
  torqueNm: number;
  duration: number;
  success: boolean;
}

class TimescaleDBClient {
  private metrics: StoredMetric[] = [];
  private anomalies: StoredAnomaly[] = [];
  private actuations: StoredActuation[] = [];

  // Persist metric
  async insertMetric(metric: FlowMetrics): Promise<void> {
    this.metrics.push({
      id: `metric-${Date.now()}`,
      time: metric.timestamp,
      flowRateLpm: metric.flowRateLpm,
      pressurePa: metric.pressurePa,
      temperatureC: metric.temperatureC
    });
    // Keep last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Persist anomaly
  async insertAnomaly(type: string, severity: string, data: Record<string, any>): Promise<void> {
    this.anomalies.push({
      id: `anomaly-${Date.now()}`,
      time: new Date().toISOString(),
      type,
      severity,
      data
    });
    if (this.anomalies.length > 500) {
      this.anomalies = this.anomalies.slice(-500);
    }
  }

  // Persist actuation
  async insertActuation(valveId: string, torqueNm: number, duration: number, success: boolean): Promise<void> {
    this.actuations.push({
      id: `actuation-${Date.now()}`,
      time: new Date().toISOString(),
      valveId,
      torqueNm,
      duration,
      success
    });
    if (this.actuations.length > 500) {
      this.actuations = this.actuations.slice(-500);
    }
  }

  // Query metrics by time range
  async queryMetricsRange(startTime: string, endTime: string): Promise<StoredMetric[]> {
    return this.metrics.filter((m) => {
      const t = new Date(m.time).getTime();
      return t >= new Date(startTime).getTime() && t <= new Date(endTime).getTime();
    });
  }

  // Query metrics for a specific valve
  async queryValveMetrics(valveId: string, limit = 100): Promise<StoredMetric[]> {
    return this.metrics.filter((m) => m.valveId === valveId).slice(-limit);
  }

  // Query anomalies by severity
  async queryAnomaliesBySeverity(severity: string, limit = 50): Promise<StoredAnomaly[]> {
    return this.anomalies.filter((a) => a.severity === severity).slice(-limit);
  }

  // Query recent anomalies
  async queryRecentAnomalies(hoursBack = 1, limit = 50): Promise<StoredAnomaly[]> {
    const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;
    return this.anomalies.filter((a) => new Date(a.time).getTime() > cutoff).slice(-limit);
  }

  // Query actuations for a valve
  async queryValveActuations(valveId: string, limit = 100): Promise<StoredActuation[]> {
    return this.actuations.filter((a) => a.valveId === valveId).slice(-limit);
  }

  // Aggregate metrics (avg/min/max over time window)
  async aggregateMetrics(startTime: string, endTime: string): Promise<{
    avgFlow: number;
    avgPressure: number;
    avgTemp: number;
    minFlow: number;
    maxFlow: number;
    count: number;
  }> {
    const metrics = await this.queryMetricsRange(startTime, endTime);
    if (metrics.length === 0) {
      return { avgFlow: 0, avgPressure: 0, avgTemp: 0, minFlow: 0, maxFlow: 0, count: 0 };
    }

    return {
      avgFlow: metrics.reduce((sum, m) => sum + m.flowRateLpm, 0) / metrics.length,
      avgPressure: metrics.reduce((sum, m) => sum + m.pressurePa, 0) / metrics.length,
      avgTemp: metrics.reduce((sum, m) => sum + m.temperatureC, 0) / metrics.length,
      minFlow: Math.min(...metrics.map((m) => m.flowRateLpm)),
      maxFlow: Math.max(...metrics.map((m) => m.flowRateLpm)),
      count: metrics.length
    };
  }

  // Get statistics over time window
  async getMetricsStats(hoursBack = 1): Promise<any> {
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    const endTime = new Date().toISOString();
    return this.aggregateMetrics(startTime, endTime);
  }

  // Health check
  async health(): Promise<boolean> {
    return true;
  }
}

// Export singleton
export const db = new TimescaleDBClient();
