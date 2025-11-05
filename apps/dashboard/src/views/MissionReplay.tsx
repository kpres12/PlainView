import { useState } from 'react'
import { Card, Badge, Button, Slider } from '../components/ui'
import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Download } from 'lucide-react'

const replayEvents = [
  { time: 0, label: 'Mission Started', type: 'info' },
  { time: 5, label: 'Roustabout activated', type: 'info' },
  { time: 12, label: 'Navigation to Zone A', type: 'info' },
  { time: 45, label: 'Leak detected at sensor 3B', type: 'warning' },
  { time: 48, label: 'Roustabout en route to leak', type: 'info' },
  { time: 62, label: 'Valve actuated - seal verified', type: 'success' },
  { time: 75, label: 'Mission completed', type: 'success' },
]

export function MissionReplay() {
  const [playback, setPlayback] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const currentEvent = replayEvents.find((e) => Math.abs(e.time - playback) < 5)

  const getEventColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-pv-amber'
      case 'success': return 'text-pv-green'
      default: return 'text-pv-blue'
    }
  }

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-wider text-pv-text">MISSION REPLAY</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary">
            <Download size={14} /> PDF
          </Button>
          <Button size="sm" variant="secondary">
            <Download size={14} /> VIDEO
          </Button>
        </div>
      </div>

      {/* Playback Controls */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlayback(Math.max(0, playback - 5))}
              className="p-1 hover:bg-pv-darker rounded transition-colors"
            >
              <SkipBack size={16} className="text-pv-amber" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 hover:bg-pv-darker rounded transition-colors"
            >
              {isPlaying ? (
                <Pause size={16} className="text-pv-amber" />
              ) : (
                <Play size={16} className="text-pv-amber" />
              )}
            </button>
            <button
              onClick={() => setPlayback(Math.min(75, playback + 5))}
              className="p-1 hover:bg-pv-darker rounded transition-colors"
            >
              <SkipForward size={16} className="text-pv-amber" />
            </button>
            <div className="ml-auto text-sm font-mono text-pv-amber">
              {Math.floor(playback)}s / 75s
            </div>
          </div>

          <Slider
            min={0}
            max={75}
            value={playback}
            onChange={setPlayback}
            step={0.5}
          />
        </div>
      </Card>

      {/* Video/Stream Area */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 bg-gradient-to-br from-pv-darker to-pv-black h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">📹</div>
            <p className="text-pv-muted text-sm">RGB Camera Stream</p>
            <p className="text-xs text-pv-muted/60 mt-2">{currentEvent?.label || 'Playing...'}</p>
          </div>
        </Card>

        {/* Telemetry during replay */}
        <Card>
          <h3 className="text-xs font-black tracking-wider text-pv-amber mb-3">TELEMETRY</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-pv-muted">Pressure</span>
              <span className="text-pv-amber">145 PSI</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-pv-muted">Temperature</span>
              <span className="text-pv-amber">68°C</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-pv-muted">Torque</span>
              <span className="text-pv-amber">132 Nm</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Timeline */}
      <Card>
        <h3 className="text-xs font-black tracking-wider text-pv-amber mb-3">EVENT TIMELINE</h3>
        <div className="space-y-2">
          {replayEvents.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 pb-2 border-b border-pv-darker last:border-0"
            >
              <div
                className={`text-xs font-mono font-bold ${
                  Math.abs(event.time - playback) < 5 ? 'text-pv-amber' : 'text-pv-muted'
                }`}
              >
                {event.time}s
              </div>
              <div
                className={`w-2 h-2 rounded-full ${
                  event.type === 'warning'
                    ? 'bg-pv-amber'
                    : event.type === 'success'
                    ? 'bg-pv-green'
                    : 'bg-pv-blue'
                }`}
              />
              <span className="text-xs text-pv-text flex-1">{event.label}</span>
              <Badge variant={event.type === 'warning' ? 'warning' : event.type === 'success' ? 'success' : 'info'}>
                {event.type.toUpperCase()}
              </Badge>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
