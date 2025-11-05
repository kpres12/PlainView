/**
 * ROS2 Bridge - Production scaffold for integrating autonomous agents
 * 
 * In production, this would:
 * 1. Use rcljs (ROS2 client library for Node.js) to discover nodes
 * 2. Subscribe to /tf (transform) for robot localization
 * 3. Subscribe to /sensor_data for telemetry from edge agents
 * 4. Publish to /cmd_* topics for coordinated actuation
 * 5. Handle faults and autonomous fallback via Summit.OS Fabric
 * 
 * Current implementation: event emitter pattern with mock node discovery
 */

import { EventEmitter } from "events";
import type { FastifyInstance } from "fastify";
import { bus } from "./sse";
import { ingestFlowTelemetry } from "./modules/flowiq";

export interface ROS2Node {
  name: string;
  namespace: string;
  type: "robot" | "sensor" | "gateway" | "stationary";
  location?: { lat: number; lon: number; z?: number };
  topics: { subscribe: string[]; publish: string[] };
  lastSeen: number;
  health: "ok" | "degraded" | "offline";
}

export interface ROS2Telemetry {
  nodeId: string;
  topic: string;
  data: Record<string, any>;
  timestamp: number;
}

export interface ROS2Command {
  nodeId: string;
  topic: string;
  action: string;
  params: Record<string, any>;
  priority: "low" | "normal" | "high";
  timeout?: number;
}

export interface ROS2CommandResult {
  commandId: string;
  status: "pending" | "sent" | "acked" | "failed" | "timeout";
  nodeId: string;
  timestamp: number;
  error?: string;
}

class ROS2Bridge extends EventEmitter {
  private nodes = new Map<string, ROS2Node>();
  private telemetryBuffer: ROS2Telemetry[] = [];
  private commandHistory = new Map<string, ROS2CommandResult>();
  private nodeHeartbeatInterval = 30000; // 30s
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
  }

  /**
   * Initialize bridge (in production, connect to ROS2 Master)
   */
  async initialize() {
    // In production: connect to ROS2 node
    // Mock: pre-register edge agent nodes
    this.registerNode({
      name: "robot_01",
      namespace: "/fleet/robots",
      type: "robot",
      location: { lat: 40.7128, lon: -74.006, z: 0 },
      topics: {
        subscribe: ["/tf", "/sensor_data/imu", "/sensor_data/lidar"],
        publish: ["/cmd/velocity", "/cmd/mission"]
      },
      lastSeen: Date.now(),
      health: "ok"
    });

    this.registerNode({
      name: "sensor_gateway_01",
      namespace: "/field/sensors",
      type: "gateway",
      location: { lat: 40.7129, lon: -74.005 },
      topics: {
        subscribe: ["/sensor_data/pressure", "/sensor_data/flow"],
        publish: ["/alert/pressure_anomaly", "/alert/flow_anomaly"]
      },
      lastSeen: Date.now(),
      health: "ok"
    });

    // Start heartbeat monitor
    this.startHeartbeatMonitor();
  }

  /**
   * Register a ROS2 node (edge agent, robot, sensor gateway, etc.)
   */
  registerNode(node: ROS2Node) {
    const nodeId = `${node.namespace}/${node.name}`;
    this.nodes.set(nodeId, node);
    this.emit("node:registered", { nodeId, node });
    bus.emit("event", {
      type: "ros2.node.discovered",
      nodeId,
      nodeType: node.type,
      location: node.location,
      at: Date.now()
    } as any);
  }

  /**
   * Discover all registered nodes
   */
  discoverNodes(filter?: { type?: string; namespace?: string }): ROS2Node[] {
    let results = Array.from(this.nodes.values());
    if (filter?.type) {
      results = results.filter((n) => n.type === filter.type);
    }
    if (filter?.namespace) {
      results = results.filter((n) => n.namespace === filter.namespace);
    }
    return results;
  }

  /**
   * Subscribe to telemetry from a node (in production via rcljs subscription)
   */
  subscribeTelemetry(nodeId: string, topic: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      this.emit("error", new Error(`Node ${nodeId} not found`));
      return;
    }

    if (!node.topics.subscribe.includes(topic)) {
      this.emit("error", new Error(`Node ${nodeId} does not publish ${topic}`));
      return;
    }

    // In production: create rcljs subscription
    // Mock: simulate telemetry stream
    const mockInterval = setInterval(() => {
      if (!this.nodes.has(nodeId)) {
        clearInterval(mockInterval);
        return;
      }

      const data = this.generateMockTelemetry(topic);
      const telemetry: ROS2Telemetry = {
        nodeId,
        topic,
        data,
        timestamp: Date.now()
      };

      this.telemetryBuffer.push(telemetry);
      if (this.telemetryBuffer.length > 1000) this.telemetryBuffer.shift();

      // Emit to SSE bus for unified dashboard
      bus.emit("event", {
        type: "ros2.telemetry",
        nodeId,
        topic,
        data,
        at: Date.now()
      } as any);

      // Ingest flow data into FlowIQ if topic is flow-related
      if (topic.includes("flow") && data.flowRateLpm !== undefined) {
        ingestFlowTelemetry({
          flowRateLpm: data.flowRateLpm,
          pressurePa: data.pressurePa,
          temperatureC: data.temperatureC,
          timestamp: Date.now() as any
        }).catch((err) => console.error("FlowIQ ingestion error:", err));
      }

      this.emit("telemetry", telemetry);
    }, 5000);
  }

  /**
   * Publish a command to a ROS2 node
   */
  async publishCommand(cmd: ROS2Command): Promise<ROS2CommandResult> {
    const node = this.nodes.get(cmd.nodeId);
    if (!node) {
      throw new Error(`Node ${cmd.nodeId} not found`);
    }

    if (!node.topics.publish.includes(cmd.topic)) {
      throw new Error(`Node ${cmd.nodeId} does not subscribe to ${cmd.topic}`);
    }

    const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result: ROS2CommandResult = {
      commandId,
      status: "pending",
      nodeId: cmd.nodeId,
      timestamp: Date.now()
    };

    this.commandHistory.set(commandId, result);

    // In production: publish via rcljs publisher
    // Mock: simulate command delivery
    this.emit("command:sent", { commandId, cmd });

    setTimeout(() => {
      const res = this.commandHistory.get(commandId);
      if (res && res.status === "pending") {
        res.status = "acked";
        this.emit("command:acked", result);
      }
    }, Math.random() * 2000 + 500);

    return result;
  }

  /**
   * Query command status
   */
  getCommandStatus(commandId: string): ROS2CommandResult | null {
    return this.commandHistory.get(commandId) || null;
  }

  /**
   * Get recent telemetry for a node/topic
   */
  getRecentTelemetry(
    nodeId: string,
    topic?: string,
    maxAge?: number
  ): ROS2Telemetry[] {
    const now = Date.now();
    return this.telemetryBuffer.filter((t) => {
      const isNode = t.nodeId === nodeId;
      const isTopic = !topic || t.topic === topic;
      const isRecent = !maxAge || now - t.timestamp < maxAge;
      return isNode && isTopic && isRecent;
    });
  }

  /**
   * Mark node as offline (fault handling)
   */
  markNodeOffline(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.health = "offline";
      node.lastSeen = Date.now();
      this.emit("node:offline", { nodeId, node });
      bus.emit("event", {
        type: "ros2.node.offline",
        nodeId,
        at: Date.now()
      } as any);
    }
  }

  /**
   * Start monitoring node heartbeats
   */
  private startHeartbeatMonitor() {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      this.nodes.forEach((node, nodeId) => {
        if (now - node.lastSeen > 60000) {
          // 60s timeout
          this.markNodeOffline(nodeId);
        }
      });
    }, this.nodeHeartbeatInterval);
  }

  /**
   * Generate mock telemetry for different topics
   */
  private generateMockTelemetry(topic: string): Record<string, any> {
    if (topic.includes("lidar")) {
      return {
        points: Math.floor(Math.random() * 10000),
        rangeMin: 0.1,
        rangeMax: 100,
        angleMin: -Math.PI,
        angleMax: Math.PI
      };
    }
    if (topic.includes("imu")) {
      return {
        accelX: (Math.random() - 0.5) * 2,
        accelY: (Math.random() - 0.5) * 2,
        accelZ: 9.8 + (Math.random() - 0.5) * 0.5,
        gyroX: (Math.random() - 0.5) * 0.1,
        gyroY: (Math.random() - 0.5) * 0.1,
        gyroZ: (Math.random() - 0.5) * 0.1
      };
    }
    if (topic.includes("pressure")) {
      return {
        pressurePa: 2500000 + (Math.random() - 0.5) * 100000,
        temperatureC: 45 + (Math.random() - 0.5) * 5
      };
    }
    if (topic.includes("flow")) {
      return {
        flowRateLpm: 150 + (Math.random() - 0.5) * 20,
        flowDirection: Math.random() > 0.5 ? "forward" : "reverse"
      };
    }
    return { data: Math.random() };
  }

  shutdown(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }
}

// Singleton instance
export const ros2Bridge = new ROS2Bridge();

/**
 * Register ROS2 bridge routes with Fastify
 */
export async function registerROS2Bridge(app: FastifyInstance) {
  await ros2Bridge.initialize();

  // GET /ros2/nodes - discover all nodes
  app.get("/nodes", async (req: any) => {
    const { type, namespace } = req.query;
    return {
      nodes: ros2Bridge.discoverNodes({ type, namespace }),
      count: ros2Bridge.discoverNodes({ type, namespace }).length
    };
  });

  // GET /ros2/nodes/:nodeId - get node details
  app.get<{ Params: { nodeId: string } }>("/:nodeId", async (req) => {
    const nodes = ros2Bridge.discoverNodes();
    const nodeId = `${decodeURIComponent(req.params.nodeId)}`;
    const node = nodes.find(
      (n) => `${n.namespace}/${n.name}` === nodeId
    );
    return node || { error: "not_found" };
  });

  // POST /ros2/subscribe - subscribe to node telemetry
  app.post<{ Body: { nodeId: string; topic: string } }>(
    "/subscribe",
    async (req: any) => {
      const { nodeId, topic } = req.body;
      try {
        ros2Bridge.subscribeTelemetry(nodeId, topic);
        return { ok: true, message: `Subscribed to ${nodeId}/${topic}` };
      } catch (err: any) {
        return { error: err.message };
      }
    }
  );

  // POST /ros2/command - publish command to node
  app.post<{ Body: ROS2Command }>("/command", async (req: any) => {
    try {
      const result = await ros2Bridge.publishCommand(req.body);
      return result;
    } catch (err: any) {
      return { error: err.message };
    }
  });

  // GET /ros2/command/:commandId - query command status
  app.get<{ Params: { commandId: string } }>(
    "/command/:commandId",
    async (req) => {
      const status = ros2Bridge.getCommandStatus(req.params.commandId);
      return status || { error: "not_found" };
    }
  );

  // GET /ros2/telemetry - get recent telemetry
  app.get("/telemetry", async (req: any) => {
    const { nodeId, topic, maxAge } = req.query;
    if (!nodeId) return { error: "nodeId required" };
    return {
      telemetry: ros2Bridge.getRecentTelemetry(
        nodeId,
        topic,
        maxAge ? parseInt(maxAge) : undefined
      )
    };
  });
}
