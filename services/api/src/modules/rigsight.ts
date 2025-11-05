import type { FastifyInstance } from "fastify";
import { bus } from "../sse";

const uuid = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
import type { CameraFeed } from "@plainview/shared";

const cameras: CameraFeed[] = [
  {
    id: "cam-101",
    name: "Wellhead North",
    location: "North Section",
    status: "online",
    resolution: "1920x1080",
    frameRate: 30,
    lastFrame: {
      url: "https://via.placeholder.com/1920x1080?text=Wellhead+North",
      timestamp: new Date().toISOString(),
      anomalies: []
    }
  },
  {
    id: "cam-102",
    name: "Pipeline Manifold",
    location: "Central Section",
    status: "online",
    resolution: "1920x1080",
    frameRate: 30,
    lastFrame: {
      url: "https://via.placeholder.com/1920x1080?text=Pipeline+Manifold",
      timestamp: new Date().toISOString(),
      anomalies: []
    }
  },
  {
    id: "cam-103",
    name: "Tank Farm East",
    location: "East Section",
    status: "degraded",
    resolution: "1280x720",
    frameRate: 15,
    lastFrame: {
      url: "https://via.placeholder.com/1280x720?text=Tank+Farm+East",
      timestamp: new Date(Date.now() - 5000).toISOString(),
      anomalies: ["Low frame rate"]
    }
  }
];

const detectionEvents: any[] = [];

export function registerRigSight(app: FastifyInstance) {
  // Simulate detection events
  const detectionInterval = setInterval(() => {
    const camera = cameras[Math.floor(Math.random() * cameras.length)];
    if (camera.status !== "offline" && Math.random() < 0.2) {
      // 20% chance per interval
      const detectionType = (["pressure_deviation", "corrosion", "leak_sign", "thermal_anomaly"] as const)[
        Math.floor(Math.random() * 4)
      ];
      const confidence = 0.7 + Math.random() * 0.3;

      const event = {
        id: uuid(),
        cameraId: camera.id,
        type: detectionType,
        confidence,
        timestamp: new Date().toISOString(),
        region: {
          x: Math.floor(Math.random() * 1920),
          y: Math.floor(Math.random() * 1080),
          width: 100 + Math.random() * 200,
          height: 100 + Math.random() * 200
        }
      };

      detectionEvents.push(event);
      if (detectionEvents.length > 500) detectionEvents.shift();

      // Update camera last frame anomalies
      if (camera.lastFrame) {
        camera.lastFrame.anomalies = camera.lastFrame.anomalies || [];
        camera.lastFrame.anomalies.push(`${detectionType} (${(confidence * 100).toFixed(0)}%)`);
        if (camera.lastFrame.anomalies.length > 3) camera.lastFrame.anomalies.shift();
      }

      // Emit detection event
      bus.emit("event", {
        type: "detection.made",
        sourceId: camera.id,
        detectionType,
        confidence,
        timestamp: new Date().toISOString()
      });
    }

    // Simulate occasional degradation
    if (Math.random() < 0.05) {
      // 5% chance
      const randomCamera = cameras[Math.floor(Math.random() * cameras.length)];
      const wasOnline = randomCamera.status === "online";
      randomCamera.status = wasOnline ? "degraded" : "online";
    }
  }, 3000);

  // GET /cameras - list all cameras with status
  app.get("/cameras", async () => {
    return {
      totalCameras: cameras.length,
      onlineCameras: cameras.filter((c) => c.status === "online").length,
      cameras: cameras.map((c) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        status: c.status,
        resolution: c.resolution,
        frameRate: c.frameRate,
        lastUpdate: c.lastFrame?.timestamp
      }))
    };
  });

  // GET /cameras/:id - get single camera details
  app.get<{ Params: { id: string } }>("/cameras/:id", async (req) => {
    const camera = cameras.find((c) => c.id === req.params.id);
    if (!camera) return null;

    const recentDetections = detectionEvents
      .filter((e) => e.cameraId === camera.id)
      .slice(-10);

    return {
      ...camera,
      recentDetections
    };
  });

  // GET /cameras/:id/stream - stream metadata
  app.get<{ Params: { id: string } }>("/cameras/:id/stream", async (req) => {
    const camera = cameras.find((c) => c.id === req.params.id);
    if (!camera) return null;

    return {
      cameraId: camera.id,
      status: camera.status,
      resolution: camera.resolution,
      frameRate: camera.frameRate,
      // In production, this would return actual stream URL
      streamUrl: `/stream/${camera.id}.webrtc`,
      lastFrame: camera.lastFrame,
      uptime: "99.2%",
      bandwidth: "2.5 Mbps"
    };
  });

  // GET /detections - historical detections
  app.get("/detections", async (req: any) => {
    let results = detectionEvents;

    const query = req.query;
    if (query.cameraId) {
      results = results.filter((d) => d.cameraId === query.cameraId);
    }
    if (query.type) {
      results = results.filter((d) => d.type === query.type);
    }
    if (query.confidence_min) {
      const minConf = parseFloat(query.confidence_min);
      results = results.filter((d) => d.confidence >= minConf);
    }

    return {
      count: results.length,
      detections: results.slice(-50) // last 50
    };
  });

  // GET /health - camera system health
  app.get("/health", async () => {
    const onlineCount = cameras.filter((c) => c.status === "online").length;
    const degradedCount = cameras.filter((c) => c.status === "degraded").length;
    const recentDetections = detectionEvents.filter(
      (d) => new Date(d.timestamp).getTime() > Date.now() - 60 * 60 * 1000
    ).length;

    return {
      timestamp: new Date().toISOString(),
      onlineCameras: onlineCount,
      degradedCameras: degradedCount,
      offlineCameras: cameras.length - onlineCount - degradedCount,
      coverageScore: (onlineCount / cameras.length) * 100,
      recentDetectionsCount: recentDetections,
      averageConfidence:
        detectionEvents.length > 0
          ? detectionEvents.slice(-100).reduce((sum, d) => sum + d.confidence, 0) / Math.min(100, detectionEvents.length)
          : 0
    };
  });

  return () => clearInterval(detectionInterval);
}
