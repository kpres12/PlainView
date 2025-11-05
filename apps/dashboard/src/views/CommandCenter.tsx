import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, Badge, Button, Slider } from '../components/ui'
import { useAppStore } from '../store'
import { Zap, AlertCircle, Radio, Settings } from 'lucide-react'
import { TerrainScene } from '../components/ui/TerrainScene'

interface Asset {
  id: string
  name: string
  type: 'roustabout' | 'drone' | 'watchtower' | 'sensor'
  status: 'online' | 'offline' | 'warning'
  lastUpdate: string
}

interface TelemetryPoint {
  id: string
  label: string
  value: number | string
  unit?: string
  type: 'pressure' | 'temperature' | 'torque' | 'vibration'
}

export function CommandCenter() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([])
  const [timelinePos, setTimelinePos] = useState(100)
  const { setSelectedAssetId } = useAppStore()

  useEffect(() => {
    // Mock data
    setAssets([
      { id: 'r1', name: 'Roustabout-01', type: 'roustabout', status: 'online', lastUpdate: '2 sec ago' },
      { id: 'd1', name: 'EmberWing-03', type: 'drone', status: 'online', lastUpdate: '5 sec ago' },
      { id: 'w1', name: 'WatchTower-North', type: 'watchtower', status: 'online', lastUpdate: '1 sec ago' },
      { id: 's1', name: 'Sensor-Pad-A', type: 'sensor', status: 'warning', lastUpdate: '12 sec ago' },
    ])
    setSelectedAsset({ id: 'r1', name: 'Roustabout-01', type: 'roustabout', status: 'online', lastUpdate: '2 sec ago' })
  }, [])

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setSelectedAssetId(asset.id)
    // Mock telemetry
    setTelemetry([
      { id: '1', label: 'Pressure', value: 145, unit: 'PSI', type: 'pressure' },
      { id: '2', label: 'Temperature', value: 68, unit: '°C', type: 'temperature' },
      { id: '3', label: 'Torque', value: 132, unit: 'Nm', type: 'torque' },
      { id: '4', label: 'Vibration', value: 2.4, unit: 'm/s²', type: 'vibration' },
    ])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-pv-green'
      case 'offline': return 'text-pv-muted'
      case 'warning': return 'text-pv-amber'
      default: return 'text-pv-text'
    }
  }

  const getAssetIcon = (type: string) => {
    const icons: Record<string, string> = {
      roustabout: '🤖',
      drone: '🚁',
      watchtower: '🏛️',
      sensor: '📡',
    }
    return icons[type] || '●'
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', overflow: 'hidden' }}>
      {/* Main content area - 3-column layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '12px', overflow: 'hidden' }}>
        {/* Left Sidebar - Fleet Status */}
        <motion.div
          style={{
            gridColumn: 'span 2',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '4px',
          }}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <h3 style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em', color: '#F5A623', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
              FLEET STATUS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {assets.map((asset) => (
                <motion.button
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    backgroundColor: selectedAsset?.id === asset.id ? 'rgba(245, 166, 35, 0.15)' : 'transparent',
                    border: selectedAsset?.id === asset.id ? '1px solid rgba(245, 166, 35, 0.4)' : '1px solid rgba(245, 166, 35, 0.1)',
                    cursor: 'pointer',
                    color: '#E4E4E4',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  whileHover={{
                    backgroundColor: 'rgba(245, 166, 35, 0.2)',
                    borderColor: 'rgba(245, 166, 35, 0.6)',
                    scale: 1.04,
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: getStatusColor(asset.status) }}>●</span>
                    <span style={{ flex: 1 }}>{asset.name}</span>
                  </div>
                  <div style={{ fontSize: '20px', marginLeft: '20px' }}>{getAssetIcon(asset.type)}</div>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Center - 3D Terrain Scene */}
        <motion.div
          style={{ gridColumn: 'span 7', height: '100%', overflow: 'hidden' }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full relative overflow-hidden">
            <div className="absolute inset-0">
              {/* Three.js scene */}
              <TerrainScene
                assets={assets.map((a, idx) => ({
                  id: a.id,
                  name: a.name,
                  type: a.type,
                  // simple layout grid positions
                  position: [((idx % 4) - 2) * 6 + 3, 0.5, (Math.floor(idx / 4) - 1) * 6],
                }))}
                onAssetClick={(id) => {
                  const a = assets.find((x) => x.id === id)
                  if (a) {
                    setSelectedAsset(a)
                    setSelectedAssetId(a.id)
                    // Navigate to detailed asset dashboard (telemetry + camera)
                    useAppStore.getState().setActiveView('asset')
                  }
                }}
              />
              {/* Compass rose in corner */}
              <div className="absolute bottom-4 right-4 w-12 h-12 border border-pv-amber/30 rounded-full flex items-center justify-center text-pv-amber text-xs font-bold">
                N
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Right Sidebar - Telemetry */}
        <motion.div
          style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <h3 className="text-xs font-black tracking-wider text-pv-amber mb-4">
              {selectedAsset ? selectedAsset.name.toUpperCase() : 'SELECT ASSET'}
            </h3>
            {selectedAsset && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-pv-darker">
                  <span className="text-xs text-pv-muted">Status</span>
                  <Badge variant={selectedAsset.status === 'online' ? 'success' : 'warning'}>
                    {selectedAsset.status.toUpperCase()}
                  </Badge>
                </div>

                {telemetry.map((t) => (
                  <div key={t.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-pv-muted">{t.label}</span>
                      <span className="text-sm font-mono text-pv-amber">
                        {t.value}{t.unit && ` ${t.unit}`}
                      </span>
                    </div>
                    <div className="w-full bg-pv-darker rounded h-1">
                      <div
                        className="bg-gradient-to-r from-pv-blue to-pv-amber h-full rounded"
                        style={{ width: `${Math.min(typeof t.value === 'number' ? t.value * 2 : 50, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-xs font-black tracking-wider text-pv-amber mb-3">TIMELINE</h3>
            <Slider
              min={0}
              max={100}
              value={timelinePos}
              onChange={setTimelinePos}
              label="Event Replay"
              step={1}
            />
            <div className="text-xs text-pv-muted mt-3">
              Now: {new Date().toLocaleTimeString()}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Timeline Panel */}
      <motion.div
        style={{
          height: '70px',
          flexShrink: 0,
          backgroundColor: 'rgba(24, 25, 27, 0.9)',
          border: '1px solid rgba(31, 32, 34, 0.8)',
          borderRadius: '8px',
          padding: '10px',
          paddingRight: '4px',
          backdropFilter: 'blur(4px)',
          overflow: 'hidden',
        }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '4px' }}>
          <h3 style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.1em', color: '#F5A623', textTransform: 'uppercase', margin: 0, lineHeight: '1' }}>
            TIMELINE
          </h3>
          <div style={{ display: 'flex', gap: '5px', overflow: 'auto', paddingBottom: '2px', flex: 1, alignItems: 'center' }}>
            {/* Scrollbar spacer */}
            <div style={{ width: '0px' }} />
            {[...Array(24)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  flexShrink: 0,
                  width: '40px',
                  height: '40px',
                  backgroundColor: 'rgba(31, 32, 34, 0.8)',
                  border: '1px solid rgba(245, 166, 35, 0.2)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: '#A8A8A8',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                whileHover={{
                  backgroundColor: 'rgba(245, 166, 35, 0.15)',
                  borderColor: '#F5A623',
                  color: '#FFB74D',
                  scale: 1.08,
                }}
                whileTap={{ scale: 0.96 }}
              >
                {i}h
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
