import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Settings } from 'lucide-react'

interface Node {
  id: string
  label: string
  type: 'detect' | 'verify' | 'actuate' | 'log' | 'report'
  x: number
  y: number
  config?: Record<string, any>
}

interface FlowEditorProps {
  nodes?: Node[]
  onNodesChange?: (nodes: Node[]) => void
}

const nodeColors = {
  detect: '#2E9AFF',
  verify: '#F5A623',
  actuate: '#5FFF96',
  log: '#FF8040',
  report: '#F5A623',
}

const nodeLabels = {
  detect: 'DETECT',
  verify: 'VERIFY',
  actuate: 'ACTUATE',
  log: 'LOG',
  report: 'REPORT',
}

const defaultNodes: Node[] = [
  { id: 'node-0', label: 'DETECT', type: 'detect', x: 50, y: 150 },
  { id: 'node-1', label: 'VERIFY', type: 'verify', x: 200, y: 150 },
  { id: 'node-2', label: 'ACTUATE', type: 'actuate', x: 350, y: 150 },
  { id: 'node-3', label: 'LOG', type: 'log', x: 500, y: 150 },
  { id: 'node-4', label: 'REPORT', type: 'report', x: 650, y: 150 },
]

export const FlowEditor: React.FC<FlowEditorProps> = ({ nodes = defaultNodes, onNodesChange }) => {
  const [nodeList, setNodeList] = useState<Node[]>(nodes)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [config, setConfig] = useState<Record<string, any>>({})

  const handleNodeDrag = (nodeId: string, dx: number, dy: number) => {
    const updated = nodeList.map((n) =>
      n.id === nodeId ? { ...n, x: Math.max(0, n.x + dx), y: Math.max(0, n.y + dy) } : n
    )
    setNodeList(updated)
    onNodesChange?.(updated)
  }

  const handleSelectNode = (nodeId: string) => {
    setSelectedNode(nodeId)
    const node = nodeList.find((n) => n.id === nodeId)
    if (node?.config) setConfig(node.config)
  }

  const handleUpdateNodeConfig = (key: string, value: any) => {
    const updated = {
      ...config,
      [key]: value,
    }
    setConfig(updated)
    const nodeUpdated = nodeList.map((n) =>
      n.id === selectedNode ? { ...n, config: updated } : n
    )
    setNodeList(nodeUpdated)
    onNodesChange?.(nodeUpdated)
  }

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', gap: '24px', padding: '24px' }}>
      {/* Canvas */}
      <div
        style={{
          flex: 1,
          background: '#0F0F12',
          border: '1px solid #2E2E34',
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Connections */}
          {nodeList.map((node, idx) => {
            if (idx === nodeList.length - 1) return null
            const nextNode = nodeList[idx + 1]
            return (
              <line
                key={`conn-${node.id}-${nextNode.id}`}
                x1={node.x + 80}
                y1={node.y + 50}
                x2={nextNode.x}
                y2={nextNode.y + 50}
                stroke='#2E9AFF'
                strokeWidth='2'
                markerEnd='url(#arrowhead)'
              />
            )
          })}
          <defs>
            <marker
              id='arrowhead'
              markerWidth='10'
              markerHeight='10'
              refX='9'
              refY='3'
              orient='auto'
            >
              <polygon points='0 0, 10 3, 0 6' fill='#2E9AFF' />
            </marker>
          </defs>
        </svg>

        {/* Nodes */}
        {nodeList.map((node) => (
          <motion.div
            key={node.id}
            draggable
            onDragStart={() => setDraggingNode(node.id)}
            onDragEnd={() => setDraggingNode(null)}
            onDrag={(_, { offset }) => handleNodeDrag(node.id, offset.x, offset.y)}
            onClick={() => handleSelectNode(node.id)}
            style={{
              position: 'absolute',
              left: `${node.x}px`,
              top: `${node.y}px`,
              cursor: 'grab',
            }}
            whileHover={{ scale: 1.05 }}
            whileDrag={{ scale: 1.1, opacity: 0.8 }}
          >
            <div
              style={{
                background: nodeColors[node.type],
                border: selectedNode === node.id ? '3px solid #E4E4E4' : '2px solid #0C0C0E',
                borderRadius: '8px',
                padding: '16px',
                width: '80px',
                textAlign: 'center',
                boxShadow: `0 0 20px ${nodeColors[node.type]}40`,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  color: '#0C0C0E',
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.1em',
                }}
              >
                {node.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Config Panel */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            width: '280px',
            background: '#1A1A1E',
            border: '1px solid #2E9AFF',
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <h3 style={{ color: '#2E9AFF', fontSize: '12px', fontWeight: '700', margin: 0, letterSpacing: '0.1em' }}>
            NODE CONFIGURATION
          </h3>

          {(() => {
            const node = nodeList.find((n) => n.id === selectedNode)
            return (
              <>
                <div>
                  <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>TYPE</label>
                  <div
                    style={{
                      color: nodeColors[node?.type || 'detect'],
                      fontSize: '13px',
                      fontWeight: '700',
                      marginTop: '6px',
                    }}
                  >
                    {node?.label}
                  </div>
                </div>

                {node?.type === 'detect' && (
                  <>
                    <div>
                      <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>SENSOR TYPE</label>
                      <select
                        value={config.sensorType || 'pressure'}
                        onChange={(e) => handleUpdateNodeConfig('sensorType', e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0F0F12',
                          border: '1px solid #2E2E34',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#E4E4E4',
                          fontSize: '12px',
                          marginTop: '6px',
                        }}
                      >
                        <option value='pressure'>Pressure</option>
                        <option value='temperature'>Temperature</option>
                        <option value='flow'>Flow Rate</option>
                        <option value='vibration'>Vibration</option>
                      </select>
                    </div>
                  </>
                )}

                {node?.type === 'verify' && (
                  <>
                    <div>
                      <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>THRESHOLD</label>
                      <input
                        type='number'
                        value={config.threshold || 0}
                        onChange={(e) => handleUpdateNodeConfig('threshold', parseFloat(e.target.value))}
                        style={{
                          width: '100%',
                          background: '#0F0F12',
                          border: '1px solid #2E2E34',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#E4E4E4',
                          fontSize: '12px',
                          marginTop: '6px',
                        }}
                      />
                    </div>
                  </>
                )}

                {node?.type === 'actuate' && (
                  <>
                    <div>
                      <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>ACTION</label>
                      <select
                        value={config.action || 'open'}
                        onChange={(e) => handleUpdateNodeConfig('action', e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0F0F12',
                          border: '1px solid #2E2E34',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#E4E4E4',
                          fontSize: '12px',
                          marginTop: '6px',
                        }}
                      >
                        <option value='open'>Open Valve</option>
                        <option value='close'>Close Valve</option>
                        <option value='rotate'>Rotate</option>
                        <option value='calibrate'>Calibrate</option>
                      </select>
                    </div>
                  </>
                )}

                {node?.type === 'log' && (
                  <>
                    <div>
                      <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>LOG FORMAT</label>
                      <select
                        value={config.format || 'json'}
                        onChange={(e) => handleUpdateNodeConfig('format', e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0F0F12',
                          border: '1px solid #2E2E34',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#E4E4E4',
                          fontSize: '12px',
                          marginTop: '6px',
                        }}
                      >
                        <option value='json'>JSON</option>
                        <option value='csv'>CSV</option>
                        <option value='xml'>XML</option>
                      </select>
                    </div>
                  </>
                )}

                {node?.type === 'report' && (
                  <>
                    <div>
                      <label style={{ color: '#999', fontSize: '11px', fontWeight: '600' }}>RECIPIENT</label>
                      <input
                        type='text'
                        value={config.recipient || 'operator@plainview.io'}
                        onChange={(e) => handleUpdateNodeConfig('recipient', e.target.value)}
                        placeholder='Email or API endpoint'
                        style={{
                          width: '100%',
                          background: '#0F0F12',
                          border: '1px solid #2E2E34',
                          borderRadius: '6px',
                          padding: '6px 8px',
                          color: '#E4E4E4',
                          fontSize: '12px',
                          marginTop: '6px',
                        }}
                      />
                    </div>
                  </>
                )}
              </>
            )
          })()}

          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedNode(null)}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #2E2E34',
                borderRadius: '6px',
                padding: '8px',
                color: '#999',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              CLOSE
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default FlowEditor
