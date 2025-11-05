import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIAssistantProps {
  open?: boolean;
  onClose?: () => void;
}

const insights = [
  {
    icon: Lightbulb,
    title: 'Anomaly Detected',
    description: 'Valve V-3401 pressure deviation +12% from baseline',
    severity: 'warning',
  },
  {
    icon: TrendingUp,
    title: 'Efficiency Insight',
    description: 'Flow optimization possible on Pipeline-B: 8% throughput improvement',
    severity: 'info',
  },
  {
    icon: AlertCircle,
    title: 'Maintenance Alert',
    description: 'Pump P-2101 predictive maintenance in 14 days',
    severity: 'warning',
  },
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ open = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(open);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: 'Hi! I\'m FlowIQ. I can help you understand system anomalies, optimize operations, and forecast maintenance. What would you like to know?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    onClose?.();
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        'Based on current telemetry, that\'s a great observation. Let me analyze the data further.',
        'I\'ve identified a correlation with the recent pressure fluctuations. Here\'s what I recommend...',
        'This aligns with our predictive models. I suggest monitoring this trend over the next 6 hours.',
        'Interesting pattern. This could indicate the need for proactive maintenance on that asset.',
      ];

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500 + Math.random() * 1500);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2E9AFF 0%, #F5A623 100%)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(46, 154, 255, 0.4)',
          zIndex: 100,
        }}
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '24px',
              width: '380px',
              maxHeight: '600px',
              background: '#1A1A1E',
              border: '1px solid #F5A623',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(245, 166, 35, 0.2)',
              zIndex: 101,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: '1px solid #2E2E34',
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    color: '#F5A623',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  FlowIQ Assistant
                </h3>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    color: '#666',
                    fontSize: '11px',
                  }}
                >
                  AI-powered insights
                </p>
              </div>
              <button
                onClick={handleToggle}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '0',
              }}
            >
              {messages.length === 1 && messages[0].id === 'initial' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '8px',
                  }}
                >
                  {insights.map((insight, idx) => {
                    const Icon = insight.icon;
                    const color = insight.severity === 'warning' ? '#F5A623' : '#2E9AFF';
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{
                          background: '#0F0F12',
                          border: `1px solid ${color}40`,
                          borderRadius: '8px',
                          padding: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = color;
                          (e.currentTarget as HTMLDivElement).style.background = '#1A1A1E';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = `${color}40`;
                          (e.currentTarget as HTMLDivElement).style.background = '#0F0F12';
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Icon size={14} color={color} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <div>
                            <div style={{ color: '#E4E4E4', fontSize: '12px', fontWeight: 500 }}>
                              {insight.title}
                            </div>
                            <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                              {insight.description}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      background: msg.role === 'user' ? '#F5A623' : '#2E2E34',
                      color: msg.role === 'user' ? '#0C0C0E' : '#E4E4E4',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      lineHeight: '1.4',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center',
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [-6, 0, -6] }}
                      transition={{ duration: 1, delay: i * 0.15, repeat: Infinity }}
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#F5A623',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Input area */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                padding: '12px',
                borderTop: '1px solid #2E2E34',
              }}
            >
              <input
                type="text"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                style={{
                  flex: 1,
                  background: '#0F0F12',
                  border: '1px solid #2E2E34',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: '#E4E4E4',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                style={{
                  background: '#F5A623',
                  border: 'none',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLoading || !input.trim() ? 'default' : 'pointer',
                  opacity: isLoading || !input.trim() ? 0.5 : 1,
                }}
              >
                <Send size={14} color="#0C0C0E" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
