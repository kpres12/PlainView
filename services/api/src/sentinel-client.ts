/**
 * Sentinel (Summit.OS) API Client
 * Wraps remote prediction and triangulation services for fire/incident prediction
 */

export interface TriangulationObservation {
  device_id: string;
  timestamp: string;
  device_latitude: number;
  device_longitude: number;
  device_altitude: number;
  camera_heading: number;
  camera_pitch: number;
  bearing: number;
  confidence: number;
  detection_id: string;
}

export interface TriangulationRequest {
  observations: TriangulationObservation[];
  max_distance_km?: number;
  min_confidence?: number;
}

export interface TriangulationResult {
  result_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number;
  confidence: number;
  uncertainty_meters: number;
  observation_ids: string[];
  method: string;
  quality_metrics: {
    angular_spread: number;
    baseline_distance: number;
    residual_error: number;
  };
}

export interface SpreadConditions {
  timestamp: string;
  latitude: number;
  longitude: number;
  temperature_c: number;
  relative_humidity: number;
  wind_speed_mps: number;
  wind_direction_deg: number;
  fuel_moisture: number;
  soil_moisture?: number;
  fuel_model: number;
  slope_deg: number;
  aspect_deg: number;
  canopy_cover?: number;
  elevation_m: number;
}

export interface SpreadParameters {
  ignition_points: Array<{ latitude: number; longitude: number; altitude: number }>;
  conditions: SpreadConditions;
  fire_lines?: any[];
  simulation_hours: number;
  time_step_minutes: number;
  monte_carlo_runs: number;
}

export interface Isochrone {
  hours_from_start: number;
  geometry: Array<{ latitude: number; longitude: number }>;
  area_hectares: number;
  perimeter_km: number;
}

export interface SpreadConfidence {
  overall_confidence: number;
  weather_confidence: number;
  fuel_confidence: number;
  terrain_confidence: number;
  confidence_factors: string;
}

export interface SpreadResult {
  simulation_id: string;
  created_at: string;
  isochrones: Isochrone[];
  perimeter: Array<{ latitude: number; longitude: number }>;
  total_area_hectares: number;
  max_spread_rate_mph: number;
  simulation_duration_hours: number;
  statistics: Record<string, number>;
  confidence: SpreadConfidence;
}

export class SentinelClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl?: string, timeoutMs = 30000) {
    this.baseUrl = baseUrl || process.env.SENTINEL_API_URL || "http://localhost:8000";
    this.timeout = timeoutMs;
  }

  /**
   * Triangulate smoke/fire location from multiple bearing observations
   */
  async triangulate(req: TriangulationRequest): Promise<TriangulationResult[] | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/v1/triangulation/triangulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Sentinel triangulation error: ${response.status}`);
        return null;
      }

      const data = (await response.json()) as any;
      return data.results || [];
    } catch (err) {
      console.error("Sentinel triangulation failed:", err);
      return null;
    }
  }

  /**
   * Simulate fire spread with weather, fuel, and terrain data
   */
  async simulateSpread(params: SpreadParameters): Promise<SpreadResult | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/v1/prediction/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Sentinel prediction error: ${response.status}`);
        return null;
      }

      return (await response.json()) as SpreadResult;
    } catch (err) {
      console.error("Sentinel spread simulation failed:", err);
      return null;
    }
  }

  /**
   * Health check on Sentinel endpoint
   */
  async health(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${this.baseUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const sentinelClient = new SentinelClient();
