/**
 * AI Assistant Component
 * 
 * Subscribes to real-time events from the API and generates contextual insights.
 * Features:
 * - Live anomaly detection insights
 * - Predictive maintenance recommendations
 * - Risk scoring and alerts
 * - Conversational interface with mission planning
 * 
 * Production implementation would integrate with:
 * - Claude API or OpenAI for natural language
 * - Event stream from /events (SSE)
 * - Mission planning via /missions endpoints
 */

import { useEffect, useState, useCallback } from "react";
import { AlertCircle, Brain, Send, X, CheckCircle } from "lucide-react";

interface Insight {
  id: string;
  type: "alert" | "recommendation" | "info" | "success";
  title: string;
  description: string;
  severity?: "low" | "medium" | "high";
  timestamp: number;
  actionable?: boolean;
  suggestedAction?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  /**
   * Initialize SSE connection to /events
   */
  useEffect(() => {
    const base = (import.meta as any).env?.VITE_API_BASE || "http://localhost:4000";
    const es = new EventSource(`${base}/events`);

    const attach = (type: string) => {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const event = JSON.parse(e.data);
          handleIncomingEvent(event);
        } catch {}
      });
    };

    // Subscribe to known server-sent event types we care about
    [
      "telemetry.tick",
      "anomaly.detected",
      "mission.completed",
      "mission.started",
      "valve.actuation.completed",
      "alert.created",
      "incident.created",
      "detection.made",
      "intelligence.insight.received",
    ].forEach(attach);

    es.addEventListener("error", () => {
      es.close();
    });

    setEventSource(es);

    return () => {
      es.close();
    };
  }, []);

  /**
   * Process incoming events from the API and generate insights
   */
  const handleIncomingEvent = useCallback((event: any) => {
    const now = Date.now();

    if (event.type === "anomaly.detected") {
      const anomalyType = event.anomalyType || event.anomaly_type;
      const assetId = event.assetId || event.asset_id;
      const confidence = typeof event.confidence === "number" ? event.confidence : 0.0;
      const insight: Insight = {
        id: `insight_${now}`,
        type: "alert",
        title: "Anomaly Detected",
        description: `${anomalyType ?? "anomaly"} detected at ${assetId ?? "unknown"} with confidence ${(confidence * 100).toFixed(0)}%`,
        severity: confidence > 0.9 ? "high" : "medium",
        timestamp: now,
        actionable: true,
        suggestedAction:
          confidence > 0.9
            ? "Consider immediate investigation or maintenance"
            : "Monitor closely over next hour"
      };
      setInsights((prev) => [insight, ...prev].slice(0, 10));
    } else if (event.type === "mission.completed") {
      const missionId = event.missionId || event.mission?.id || "mission";
      const insight: Insight = {
        id: `insight_${now}`,
        type: "success",
        title: "Mission Completed",
        description: `Mission ${missionId} finished successfully`,
        timestamp: now
      };
      setInsights((prev) => [insight, ...prev].slice(0, 10));
    } else if (event.type === "valve.actuation.completed") {
      const valveId = event.valveId || event.valve_id || "valve";
      const torque = event.torque_nm ?? event.torqueNm;
      const insight: Insight = {
        id: `insight_${now}`,
        type: "info",
        title: "Valve Actuation Completed",
        description: `Valve ${valveId} actuation completed${torque ? ` (torque ${torque.toFixed?.(1) ?? torque}Nm)` : ""}`,
        timestamp: now
      };
      setInsights((prev) => [insight, ...prev].slice(0, 10));
    }
  }, []);

  /**
   * Send user message and get AI response
   */
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    try {
      // Mock response - in production, call Claude/OpenAI
      const response = await generateAIResponse(input);

      const assistantMsg: Message = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: response,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("AI error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generate mock AI response
   * In production: call Claude API or OpenAI
   */
  const generateAIResponse = async (userInput: string): Promise<string> => {
    // Mock: pattern matching on common queries
    const lower = userInput.toLowerCase();

    if (lower.includes("status") || lower.includes("health")) {
      return (
        "Current system health is strong. Flow metrics are within normal ranges, " +
        "with only minor temperature fluctuations. No immediate concerns detected. " +
        "Recommend routine valve inspection next week."
      );
    }

    if (lower.includes("anomal") || lower.includes("alert")) {
      return (
        `I found ${insights.filter((i) => i.type === "alert").length} active alerts. ` +
        "The most recent shows a flow rate deviation in Pipeline A. " +
        "Suggest checking for blockage or partial valve closure."
      );
    }

    if (lower.includes("mission") || lower.includes("plan")) {
      return (
        "I can help plan a maintenance mission. Would you like to: " +
        "1) Inspect all valves, 2) Perform pressure relief sequence, " +
        "or 3) Run diagnostic flow test? Let me know your preference."
      );
    }

    if (lower.includes("help") || lower.includes("?")) {
      return (
        "I can help with: system status, anomaly investigation, mission planning, " +
        "maintenance recommendations, and predictive analysis. " +
        "What would you like to know?"
      );
    }

    return (
      "I understand you're asking about " +
      userInput.slice(0, 30) +
      "... Can you provide more details? " +
      "I can help with diagnostics, planning, and insights."
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all"
          title="Open AI Assistant"
        >
          <Brain size={24} />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[32rem] flex flex-col border border-gray-200 dark:bg-gray-900 dark:border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={20} />
              <span className="font-semibold">AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-800 p-1 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Insights Panel */}
          <div className="border-b dark:border-gray-700 px-4 py-2 max-h-24 overflow-y-auto">
            {insights.length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p className="font-semibold mb-1">Recent Insights:</p>
                {insights.slice(0, 2).map((insight) => (
                  <div
                    key={insight.id}
                    className={`text-xs p-1 rounded mb-1 flex gap-1 ${
                      insight.type === "alert"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : insight.type === "success"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }`}
                  >
                    {insight.type === "alert" && <AlertCircle size={12} className="mt-0.5" />}
                    {insight.type === "success" && <CheckCircle size={12} className="mt-0.5" />}
                    <span>{insight.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
                <p className="font-semibold mb-2">How can I help?</p>
                <p className="text-xs">Ask about system status, anomalies, or mission planning</p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t dark:border-gray-700 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />
            <button
              onClick={handleSendMessage}
              disabled={isProcessing || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
