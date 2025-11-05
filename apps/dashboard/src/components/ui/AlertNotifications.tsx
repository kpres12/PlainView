import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';

const severityConfig = {
  error: {
    bg: '#1A0000',
    border: '#FF4040',
    text: '#FF4040',
    icon: AlertCircle,
  },
  warning: {
    bg: '#1A1500',
    border: '#F5A623',
    text: '#F5A623',
    icon: AlertTriangle,
  },
  success: {
    bg: '#001A08',
    border: '#5FFF96',
    text: '#5FFF96',
    icon: CheckCircle,
  },
  info: {
    bg: '#000A1A',
    border: '#2E9AFF',
    text: '#2E9AFF',
    icon: Info,
  },
};

export const AlertNotifications: React.FC = () => {
  const { alerts, removeAlert } = useAlertStore();

  return (
    <div
      style={{
        position: 'fixed',
        top: '100px',
        right: '24px',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '380px',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 400, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 400, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                background: config.bg,
                border: `1px solid ${config.border}`,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px ${config.border}40`,
                backdropFilter: 'blur(8px)',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
              onClick={() => removeAlert(alert.id)}
            >
              <Icon size={20} color={config.text} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: config.text,
                    fontSize: '14px',
                    fontWeight: 500,
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                  }}
                >
                  {alert.message}
                </div>
                <div
                  style={{
                    color: '#666',
                    fontSize: '11px',
                    marginTop: '4px',
                  }}
                >
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAlert(alert.id);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = config.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default AlertNotifications;
