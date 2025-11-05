import { useState } from 'react'
import { Workflow, Zap, Play, Copy, Trash2, CheckCircle, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MissionBuilder } from '../components/ui/MissionBuilder'
import { FlowEditor } from '../components/ui/FlowEditor'

const missionsList = [
  { id: '1', name: 'Leak Patrol', status: 'active' as const, progress: 45, startTime: '14:32', eta: '18:45' },
  { id: '2', name: 'Valve Inspection', status: 'scheduled' as const, progress: 0, startTime: '—', eta: '20:00' },
  { id: '3', name: 'Routine Check', status: 'completed' as const, progress: 100, startTime: '12:00', eta: '14:15' },
]

export function Missions() {
  const [selectedMission, setSelectedMission] = useState('1')
  const [activeTab, setActiveTab] = useState<'active' | 'builder'>('active')
  const [flowEditorOpen, setFlowEditorOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#5FFF96'
      case 'scheduled': return '#F5A623'
      case 'completed': return '#2E9AFF'
      default: return '#666'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active': return '#003322'
      case 'scheduled': return '#331900'
      case 'completed': return '#000033'
      default: return '#1A1A1E'
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column', backgroundColor: '#0C0C0E' }}>
      {/* Tab buttons */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid #1F2022' }}>
        {(['active', 'builder'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              background: activeTab === tab ? '#F5A623' : '#1A1A1E',
              color: activeTab === tab ? '#0C0C0E' : '#A8A8A8',
              border: '1px solid ' + (activeTab === tab ? '#F5A623' : '#2E2E34'),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            whileHover={{ background: activeTab === tab ? '#F5A623' : '#2E2E34' }}
          >
            {tab === 'active' ? 'ACTIVE MISSIONS' : 'MISSION BUILDER'}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {activeTab === 'active' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '100%' }}>
            {/* Mission list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'auto' }}>
              <h3 style={{ color: '#F5A623', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', margin: '0 0 12px 0' }}>
                MISSION QUEUE
              </h3>
              <AnimatePresence>
                {missionsList.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedMission(m.id)}
                    style={{
                      padding: '16px',
                      background: selectedMission === m.id ? getStatusBg(m.status) : '#1A1A1E',
                      border: `1px solid ${selectedMission === m.id ? getStatusColor(m.status) : '#2E2E34'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h4 style={{ color: '#E4E4E4', fontSize: '14px', fontWeight: '600', margin: 0 }}>{m.name}</h4>
                        <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>
                          Start: {m.startTime} • ETA: {m.eta}
                        </div>
                      </div>
                      <div
                        style={{
                          background: getStatusColor(m.status),
                          color: '#0C0C0E',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '700',
                        }}
                      >
                        {m.status.toUpperCase()}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ background: '#0F0F12', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <motion.div
                        style={{
                          height: '100%',
                          background: `linear-gradient(90deg, ${getStatusColor(m.status)}, #F5A623)`,
                          borderRadius: '3px',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${m.progress}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                    <div style={{ color: '#999', fontSize: '10px', marginTop: '8px' }}>{m.progress}% complete</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Selected mission details */}
            {selectedMission && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  background: '#1A1A1E',
                  border: '1px solid #2E2E34',
                  borderRadius: '8px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {(() => {
                  const m = missionsList.find((x) => x.id === selectedMission)
                  if (!m) return null
                  return (
                    <>
                      <div>
                        <h3 style={{ color: '#F5A623', fontSize: '12px', fontWeight: '700', letterSpacing: '0.1em', margin: '0 0 12px 0' }}>
                          MISSION DETAILS
                        </h3>
                        <div style={{ color: '#E4E4E4', fontSize: '18px', fontWeight: '700' }}>{m.name}</div>
                        <div style={{ color: getStatusColor(m.status), fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>
                          ● {m.status.toUpperCase()}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: '#0F0F12', padding: '12px', borderRadius: '6px' }}>
                          <div style={{ color: '#999', fontSize: '10px' }}>STARTED</div>
                          <div style={{ color: '#E4E4E4', fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>{m.startTime}</div>
                        </div>
                        <div style={{ background: '#0F0F12', padding: '12px', borderRadius: '6px' }}>
                          <div style={{ color: '#999', fontSize: '10px' }}>ETA</div>
                          <div style={{ color: '#5FFF96', fontSize: '14px', fontWeight: '600', marginTop: '4px' }}>{m.eta}</div>
                        </div>
                      </div>

                      <motion.div
                        onClick={() => setFlowEditorOpen(true)}
                        style={{ flex: 1, background: '#0F0F12', borderRadius: '8px', border: '1px dashed #2E9AFF', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        whileHover={{ background: '#121218', borderColor: '#5FFF96' }}
                      >
                        <div style={{ textAlign: 'center', color: '#666' }}>
                          <Workflow size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                          <div style={{ fontSize: '12px' }}>Click to edit workflow</div>
                        </div>
                      </motion.div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {m.status === 'active' && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: '#FF4040',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                            >
                              ABORT
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                flex: 1,
                                padding: '10px',
                                background: '#F5A623',
                                color: '#0C0C0E',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                              }}
                            >
                              PAUSE
                            </motion.button>
                          </>
                        )}
                        {m.status === 'scheduled' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#5FFF96',
                              color: '#0C0C0E',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                          >
                            <Play size={14} style={{ display: 'inline', marginRight: '6px' }} />
                            LAUNCH NOW
                          </motion.button>
                        )}
                      </div>
                    </>
                  )
                })()}
              </motion.div>
            )}
          </div>
        ) : (
          <MissionBuilder />
        )}
      </div>

      {/* Flow Editor Modal */}
      <AnimatePresence>
        {flowEditorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFlowEditorOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90vw',
                height: '90vh',
                background: '#0C0C0E',
                borderRadius: '12px',
                border: '1px solid #2E9AFF',
                boxShadow: '0 0 40px rgba(46, 154, 255, 0.3)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #2E2E34', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ color: '#E4E4E4', fontSize: '16px', fontWeight: '700', margin: 0 }}>MISSION WORKFLOW EDITOR</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFlowEditorOpen(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#999',
                      cursor: 'pointer',
                      fontSize: '20px',
                      padding: '4px 8px',
                    }}
                  >
                    ✕
                  </motion.button>
                </div>
                <div style={{ flex: 1 }}>
                  <FlowEditor />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
