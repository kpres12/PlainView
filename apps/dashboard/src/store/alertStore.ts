import { create } from 'zustand';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

export interface Alert {
  id: string;
  message: string;
  severity: AlertSeverity;
  timestamp: number;
  duration?: number; // auto-dismiss in ms, undefined = manual
}

export interface TimelineEvent {
  id: string;
  message: string;
  type: 'alert' | 'action' | 'telemetry';
  severity?: AlertSeverity;
  timestamp: number;
}

interface AlertStore {
  alerts: Alert[];
  timelineEvents: TimelineEvent[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => string;
  removeAlert: (id: string) => void;
  logTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  clearTimeline: () => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  timelineEvents: [],

  addAlert: (alert) => {
    const id = `alert-${Date.now()}-${Math.random()}`;
    set((state) => ({
      alerts: [...state.alerts, { ...alert, id, timestamp: Date.now() }],
    }));

    // Auto-log to timeline
    get().logTimelineEvent({
      message: alert.message,
      type: 'alert',
      severity: alert.severity,
    });

    // Auto-dismiss if duration specified
    if (alert.duration) {
      setTimeout(() => {
        get().removeAlert(id);
      }, alert.duration);
    }

    return id;
  },

  removeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    }));
  },

  logTimelineEvent: (event) => {
    const id = `event-${Date.now()}-${Math.random()}`;
    set((state) => ({
      timelineEvents: [...state.timelineEvents, { ...event, id, timestamp: Date.now() }],
    }));
  },

  clearTimeline: () => {
    set({ timelineEvents: [] });
  },
}));
