import { useEffect, useState } from 'react'
import { Card, Badge, Tabs, Button } from '../components/ui'
import { motion } from 'framer-motion'
import { Camera, Download, ArrowLeft } from 'lucide-react'
import { useAppStore } from '../store'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts'

const healthData = [
  { time: '1h', health: 92 },
  { time: '2h', health: 91 },
  { time: '3h', health: 90 },
  { time: '4h', health: 88 },
  { time: '5h', health: 87 },
  { time: 'now', health: 95 },
]

const torqueCycles = [
  { t: 'now', cycles: 1200 },
  { t: '+4h', cycles: 1325 },
  { t: '+8h', cycles: 1450 },
  { t: '+12h', cycles: 1580 },
  { t: '+16h', cycles: 1710 },
  { t: '+20h', cycles: 1840 },
  { t: '+24h', cycles: 1975 },
]

const missionHistory = [
  { id: '1', name: 'Leak Patrol Sector 3', status: 'completed', time: '2h ago', summary: 'Detected minor seep at junction J-12; flagged for inspection.' },
  { id: '2', name: 'Valve Inspection 6B-6C', status: 'completed', time: '4h ago', summary: 'Roustabout-01 turned Valve #27, torque 132 Nm, seal verified.' },
  { id: '3', name: 'Routine Maintenance', status: 'completed', time: '6h ago', summary: 'Lubrication cycle completed; vibration nominal at 0.2 g RMS.' },
]

interface AssetDetailProps {
  assetId?: string
}

export function AssetDetail({ assetId = 'r1' }: AssetDetailProps) {
  const [selectedMission, setSelectedMission] = useState<string | null>(null)
  const { setActiveView } = useAppStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveView('command-center')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setActiveView])

  const tabs = [
    {
      id: 'overview',
      label: 'OVERVIEW',
      content: (
        <div className="space-y-4 mt-4">
          <div>
            <h3 className="text-xs font-black tracking-wider text-pv-amber mb-3 flex items-center gap-2">
              <Camera size={16} /> LIVE FEED
            </h3>
            <Card className="bg-gradient-to-br from-pv-darker to-pv-black h-64 grid grid-cols-2 gap-2 p-2">
              <div className="flex items-center justify-center rounded-md border border-pv-darker/60">
                <div className="text-center">
                  <Camera className="w-10 h-10 text-pv-amber/30 mx-auto mb-2" />
                  <p className="text-pv-muted text-xs">RGB Stream</p>
                </div>
              </div>
              <div className="flex items-center justify-center rounded-md border border-pv-darker/60">
                <div className="text-center">
                  <Camera className="w-10 h-10 text-pv-amber/30 mx-auto mb-2" />
                  <p className="text-pv-muted text-xs">Thermal Stream</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <div className="text-xs text-pv-muted mb-2">STATUS</div>
              <div className="text-lg font-mono text-pv-green">ONLINE</div>
              <div className="text-2xl mt-1">🤖</div>
            </Card>
            <Card>
              <div className="text-xs text-pv-muted mb-2">UPTIME</div>
              <div className="text-lg font-mono text-pv-amber">127h 45m</div>
              <div className="text-xs text-pv-muted mt-2">+18h this week</div>
            </Card>
            <Card>
              <div className="text-xs text-pv-muted mb-2">LAST UPDATE</div>
              <div className="text-lg font-mono text-pv-blue">2 sec ago</div>
            </Card>
            <Card>
              <div className="text-xs text-pv-muted mb-2">LOCATION</div>
              <div className="text-sm font-mono text-pv-text">Zone A, Pad 3</div>
            </Card>
          </div>

          <Card>
            <h3 className="text-xs font-black tracking-wider text-pv-amber mb-3">SENSOR METRICS</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] text-pv-muted">PRESSURE</div>
                <div className="text-lg font-mono text-pv-text">68.2 psi</div>
                <div className="text-[10px] text-pv-muted mt-1">stable</div>
              </div>
              <div>
                <div className="text-[10px] text-pv-muted">TORQUE</div>
                <div className="text-lg font-mono text-pv-text">132 Nm</div>
                <div className="text-[10px] text-pv-muted mt-1">last actuation</div>
              </div>
              <div>
                <div className="text-[10px] text-pv-muted">TEMPERATURE</div>
                <div className="text-lg font-mono text-pv-text">41.3 °C</div>
                <div className="text-[10px] text-pv-muted mt-1">down 1.2 °C</div>
              </div>
            </div>
          </Card>
        </div>
      )
    },
    {
      id: 'health',
      label: 'HEALTH',
      content: (
        <div className="space-y-4 mt-4">
          <Card>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black tracking-wider text-pv-amber">SYSTEM HEALTH</h3>
                <Badge variant="success">95%</Badge>
              </div>
              <div className="w-full bg-pv-darker rounded-full h-2">
                <div className="bg-gradient-to-r from-pv-green to-pv-amber h-full rounded-full" style={{ width: '95%' }} />
              </div>
            </div>
            <p className="text-xs text-pv-muted">Based on FlowIQ analytics. All systems operational.</p>
          </Card>

          <div>
            <h3 className="text-xs font-black tracking-wider text-pv-amber mb-3">24H TREND</h3>
            <Card>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={healthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2022" />
                  <XAxis dataKey="time" stroke="#A8A8A8" style={{ fontSize: '11px' }} />
                  <YAxis stroke="#A8A8A8" style={{ fontSize: '11px' }} />
                  <Tooltip contentStyle={{ background: '#18191B', border: '1px solid #5FFF96' }} />
                  <Line type="monotone" dataKey="health" stroke="#5FFF96" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div>
            <h3 className="text-xs font-black tracking-wider text-pv-amber mb-3">PREDICTIVE MAINTENANCE</h3>
            <Card>
              <div className="flex items-center justify-between px-3 pt-3">
                <div className="text-[11px] text-pv-muted">Next service estimate</div>
                <Badge variant="warning">23h</Badge>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={torqueCycles}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2022" />
                    <XAxis dataKey="t" stroke="#A8A8A8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#A8A8A8" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ background: '#18191B', border: '1px solid #F5A623' }} />
                    <Line type="monotone" dataKey="cycles" stroke="#F5A623" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-pv-muted px-3 pb-3">Projection based on torque cycle accumulation.</p>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'missions',
      label: 'MISSIONS',
      content: (
        <div className="space-y-3 mt-4">
          {missionHistory.map((mission, i) => (
            <motion.div key={mission.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="cursor-pointer hover:border-pv-amber transition-colors" onClick={() => setSelectedMission(mission.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-pv-text text-sm">{mission.name}</h4>
                    <p className="text-xs text-pv-muted mt-1">{mission.time}</p>
                    <p className="text-xs text-pv-text/80 mt-1 italic">{mission.summary}</p>
                  </div>
                  <Badge variant={mission.status === 'completed' ? 'success' : 'warning'}>
                    {mission.status.toUpperCase()}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )
    }
  ]

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setActiveView('command-center')}>
            <ArrowLeft size={14} /> BACK TO MAP
          </Button>
          <h2 className="text-xl font-black tracking-wider text-pv-text">ROUSTABOUT-01</h2>
        </div>
        <Button size="sm" variant="secondary">
          <Download size={14} /> EXPORT
        </Button>
      </div>

      <Tabs tabs={tabs} />
    </div>
  )
}
