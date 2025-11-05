import { useState } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, AlertCircle, Activity, Brain, Zap, Gauge, Target, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const pressureData = [
  { time: '00:00', value: 145, baseline: 140 },
  { time: '04:00', value: 148, baseline: 142 },
  { time: '08:00', value: 152, baseline: 144 },
  { time: '12:00', value: 151, baseline: 146 },
  { time: '16:00', value: 155, baseline: 148 },
  { time: '20:00', value: 158, baseline: 150 },
  { time: '24:00', value: 162, baseline: 152 },
]

const flowData = [
  { time: '00:00', rate: 1205, efficiency: 87 },
  { time: '04:00', rate: 1240, efficiency: 89 },
  { time: '08:00', rate: 1180, efficiency: 85 },
  { time: '12:00', rate: 1295, efficiency: 93 },
  { time: '16:00', rate: 1320, efficiency: 95 },
  { time: '20:00', rate: 1285, efficiency: 92 },
  { time: '24:00', rate: 1245, efficiency: 89 },
]

const anomalies = [
  { id: '1', asset: 'Valve V-3401', type: 'Pressure Spike', severity: 'high', confidence: 94, timestamp: '14:32', impact: 'Production -8%' },
  { id: '2', asset: 'Pump P-2101', type: 'Vibration Pattern', severity: 'medium', confidence: 78, timestamp: '12:45', impact: 'Maintenance +2 days' },
  { id: '3', asset: 'Pipeline-B', type: 'Flow Optimization', severity: 'low', confidence: 89, timestamp: '09:15', impact: 'Efficiency +12%' },
]

export function Analytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'anomalies' | 'predictions'>('overview')

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#FF4040'
      case 'medium': return '#F5A623'
      case 'low': return '#5FFF96'
      default: return '#2E9AFF'
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column', backgroundColor: '#0C0C0E' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1F2022', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Brain size={20} color="#2E9AFF" />
        <h1 style={{ color: '#2E9AFF', fontSize: '16px', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }}>FLOWIQ ANALYTICS</h1>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #1F2022' }}>
        {(['overview', 'anomalies', 'predictions'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              background: activeTab === tab ? '#2E9AFF' : '#1A1A1E',
              color: activeTab === tab ? '#0C0C0E' : '#A8A8A8',
              border: '1px solid ' + (activeTab === tab ? '#2E9AFF' : '#2E2E34'),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            whileHover={{ background: activeTab === tab ? '#2E9AFF' : '#2E2E34' }}
          >
            {tab.toUpperCase()}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', height: '100%' }}>
            {/* Charts Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Pressure Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#1A1A1E',
                  border: '1px solid #2E2E34',
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Gauge size={16} color="#F5A623" />
                  <h3 style={{ color: '#F5A623', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }}>
                    PRESSURE TRENDS
                  </h3>
                </div>
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pressureData}>
                      <defs>
                        <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2022" />
                      <XAxis dataKey="time" stroke="#666" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#666" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ background: '#1A1A1E', border: '1px solid #F5A623', borderRadius: '6px' }}
                        labelStyle={{ color: '#F5A623' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#F5A623" strokeWidth={2} fill="url(#pressureGradient)" />
                      <Line type="monotone" dataKey="baseline" stroke="#666" strokeDasharray="3 3" strokeWidth={1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Flow Rate */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  background: '#1A1A1E',
                  border: '1px solid #2E2E34',
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Activity size={16} color="#2E9AFF" />
                  <h3 style={{ color: '#2E9AFF', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }}>
                    FLOW EFFICIENCY
                  </h3>
                </div>
                <div style={{ height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={flowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2022" />
                      <XAxis dataKey="time" stroke="#666" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#666" style={{ fontSize: '11px' }} />
                      <Tooltip
                        contentStyle={{ background: '#1A1A1E', border: '1px solid #2E9AFF', borderRadius: '6px' }}
                        labelStyle={{ color: '#2E9AFF' }}
                      />
                      <Bar dataKey="efficiency" fill="#2E9AFF" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* KPIs Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Health Score */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  background: '#001A08',
                  border: '1px solid #5FFF96',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <CheckCircle size={24} color="#5FFF96" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: '#5FFF96', fontSize: '32px', fontWeight: '700', fontFamily: 'monospace' }}>94%</div>
                <div style={{ color: '#5FFF96', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em' }}>SYSTEM HEALTH</div>
              </motion.div>

              {/* Efficiency */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  background: '#000A1A',
                  border: '1px solid #2E9AFF',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <Target size={24} color="#2E9AFF" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: '#2E9AFF', fontSize: '32px', fontWeight: '700', fontFamily: 'monospace' }}>89%</div>
                <div style={{ color: '#2E9AFF', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em' }}>EFFICIENCY</div>
              </motion.div>

              {/* Alerts */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  background: '#1A1500',
                  border: '1px solid #F5A623',
                  borderRadius: '8px',
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                <AlertCircle size={24} color="#F5A623" style={{ margin: '0 auto 12px' }} />
                <div style={{ color: '#F5A623', fontSize: '32px', fontWeight: '700', fontFamily: 'monospace' }}>3</div>
                <div style={{ color: '#F5A623', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em' }}>ACTIVE ANOMALIES</div>
              </motion.div>

              {/* Predictions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  background: '#1A1A1E',
                  border: '1px solid #2E2E34',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <h4 style={{ color: '#F5A623', fontSize: '11px', fontWeight: '700', letterSpacing: '0.1em', margin: '0 0 12px 0' }}>
                  PREDICTIONS
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#E4E4E4' }}>Next Maintenance</div>
                  <div style={{ fontSize: '14px', color: '#5FFF96', fontWeight: '600' }}>14 days</div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>Pump P-2101 based on vibration patterns</div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: '#FF4040', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', margin: 0 }}>
              DETECTED ANOMALIES
            </h3>
            <AnimatePresence>
              {anomalies.map((anomaly, i) => (
                <motion.div
                  key={anomaly.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    background: '#1A1A1E',
                    border: `1px solid ${getSeverityColor(anomaly.severity)}40`,
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ color: '#E4E4E4', fontSize: '14px', fontWeight: '600', margin: 0 }}>{anomaly.type}</h4>
                      <div style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                        {anomaly.asset} • {anomaly.timestamp}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ color: getSeverityColor(anomaly.severity), fontSize: '10px', fontWeight: '700' }}>
                        {anomaly.confidence}% CONF
                      </div>
                      <div
                        style={{
                          background: getSeverityColor(anomaly.severity),
                          color: '#0C0C0E',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}
                      >
                        {anomaly.severity.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div style={{ color: '#666', fontSize: '11px' }}>Impact: {anomaly.impact}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <Brain size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>Predictive Models Training</h3>
            <p style={{ fontSize: '12px', maxWidth: '400px', margin: '0 auto' }}>
              ML algorithms are analyzing historical patterns to predict equipment failures, optimize maintenance schedules, and suggest operational improvements.
            </p>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 1.5, delay: i * 0.2, repeat: Infinity }}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#2E9AFF',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
