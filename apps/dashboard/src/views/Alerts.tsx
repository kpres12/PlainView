import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, AlertTriangle, Trash2, Clock, Bell, Shield } from 'lucide-react'
import { useAlertStore } from '../store/alertStore'

interface AlertItem {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  device?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  acknowledged?: boolean
}

export function Alerts() {
  const { alerts: storeAlerts, addAlert } = useAlertStore()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')

  useEffect(() => {
    // Mock data
    setAlerts([
      {
        id: '1',
        type: 'error',
        title: 'Methane Leak Detected',
        message: 'Methane concentration exceeded threshold at Sector 4',
        timestamp: new Date(Date.now() - 2 * 60000),
        device: 'Sensor-Pad-A',
        severity: 'critical',
      },
      {
        id: '2',
        type: 'warning',
        title: 'Pressure Rising',
        message: 'Valve 6C pressure rising above historical average',
        timestamp: new Date(Date.now() - 5 * 60000),
        device: 'Valve-6C',
        severity: 'high',
      },
      {
        id: '3',
        type: 'info',
        title: 'Roustabout-02 Began Patrol',
        message: 'Routine patrol mission started in Zone A',
        timestamp: new Date(Date.now() - 10 * 60000),
        device: 'Roustabout-02',
        severity: 'low',
        acknowledged: true,
      },
      {
        id: '4',
        type: 'success',
        title: 'Valve Actuation Complete',
        message: 'Valve 3B successfully rotated, seal verified',
        timestamp: new Date(Date.now() - 15 * 60000),
        device: 'Valve-3B',
        severity: 'low',
        acknowledged: true,
      },
      {
        id: '5',
        type: 'warning',
        title: 'Pump Vibration Anomaly',
        message: 'Pump P-2101 vibration frequency outside normal range',
        timestamp: new Date(Date.now() - 25 * 60000),
        device: 'Pump-P2101',
        severity: 'medium',
      },
      {
        id: '6',
        type: 'error',
        title: 'Pipeline Flow Blockage',
        message: 'Flow rate dropped 40% in Pipeline-C, possible obstruction',
        timestamp: new Date(Date.now() - 35 * 60000),
        device: 'Pipeline-C',
        severity: 'high',
      },
    ])
  }, [])

  const getIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'error': return AlertCircle
      case 'warning': return AlertTriangle
      case 'success': return CheckCircle
      default: return Clock
    }
  }

  const getTypeColor = (type: AlertItem['type']) => {
    switch (type) {
      case 'error': return '#FF4040'
      case 'warning': return '#F5A623'
      case 'success': return '#5FFF96'
      default: return '#2E9AFF'
    }
  }

  const getSeverityBadgeColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return '#FF4040'
      case 'high': return '#FF8040'
      case 'medium': return '#F5A623'
      case 'low': return '#5FFF96'
      default: return '#2E9AFF'
    }
  }

  const filtered = alerts.filter(a => {
    if (filter === 'unread') return !a.acknowledged
    if (filter === 'critical') return a.severity === 'critical' || a.severity === 'high'
    return true
  })

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
  }

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  const unreadCount = alerts.filter(a => !a.acknowledged).length
  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column', backgroundColor: '#0C0C0E' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1F2022', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={20} color="#FF4040" />
          <h1 style={{ color: '#FF4040', fontSize: '16px', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }}>SYSTEM ALERTS</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
          <div style={{ color: '#666' }}>Total: <span style={{ color: '#E4E4E4' }}>{alerts.length}</span></div>
          <div style={{ color: '#666' }}>Active: <span style={{ color: '#FF4040' }}>{unreadCount}</span></div>
        </div>
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #1F2022' }}>
        {(['all', 'unread', 'critical'] as const).map((f) => (
          <motion.button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              background: filter === f ? '#FF4040' : '#1A1A1E',
              color: filter === f ? '#fff' : '#A8A8A8',
              border: '1px solid ' + (filter === f ? '#FF4040' : '#2E2E34'),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            whileHover={{ background: filter === f ? '#FF4040' : '#2E2E34' }}
          >
            {f.toUpperCase()}
            {f === 'unread' && ` (${unreadCount})`}
            {f === 'critical' && ` (${criticalCount})`}
          </motion.button>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence>
              {filtered.map((alert, idx) => {
                const Icon = getIcon(alert.type)
                const typeColor = getTypeColor(alert.type)
                const severityColor = getSeverityBadgeColor(alert.severity)
                
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      background: alert.acknowledged ? '#1A1A1E' : '#1F1A1A',
                      border: `1px solid ${alert.acknowledged ? '#2E2E34' : typeColor}40`,
                      borderRadius: '8px',
                      padding: '16px',
                      opacity: alert.acknowledged ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Icon size={20} color={typeColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ color: '#E4E4E4', fontSize: '14px', fontWeight: '600', margin: 0 }}>{alert.title}</h4>
                          <div
                            style={{
                              background: severityColor,
                              color: '#0C0C0E',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '700',
                              flexShrink: 0,
                            }}
                          >
                            {alert.severity?.toUpperCase() || 'INFO'}
                          </div>
                        </div>
                        
                        <p style={{ color: '#999', fontSize: '13px', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                          {alert.message}
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ color: '#666', fontSize: '11px' }}>
                            <span style={{ color: typeColor }}>{alert.device}</span> • {formatTime(alert.timestamp)}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!alert.acknowledged && (
                              <motion.button
                                onClick={() => acknowledgeAlert(alert.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                  background: '#5FFF96',
                                  color: '#0C0C0E',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                }}
                              >
                                ACK
                              </motion.button>
                            )}
                            <motion.button
                              onClick={() => deleteAlert(alert.id)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                background: 'transparent',
                                color: '#666',
                                border: '1px solid #2E2E34',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Trash2 size={12} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50%',
              color: '#666',
              textAlign: 'center',
            }}
          >
            {filter === 'all' ? (
              <>
                <Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '16px', margin: '0 0 8px 0' }}>All Clear</h3>
                <p style={{ fontSize: '13px', maxWidth: '300px', margin: 0 }}>No system alerts detected. All operations running normally.</p>
              </>
            ) : (
              <>
                <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <h3 style={{ fontSize: '16px', margin: '0 0 8px 0' }}>No {filter} alerts</h3>
                <p style={{ fontSize: '13px', margin: 0 }}>Filter matched 0 alerts.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
