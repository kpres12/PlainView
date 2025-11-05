import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trash2, Play } from 'lucide-react';

interface MissionStep {
  id: string;
  assetId: string;
  assetName: string;
  action:
    | 'open'
    | 'close'
    | 'inspect'
    | 'actuate'
    | 'patrol'
    | 'thermal_scan'
    | 'visual_inspect'
    | 'measure_pressure'
    | 'measure_temperature'
    | 'navigate'
    | 'record';
  duration: number;
}

interface Mission {
  id: string;
  name: string;
  type: 'inspection' | 'patrol' | 'thermal_scan' | 'valve_ops' | 'survey' | 'delivery';
  steps: MissionStep[];
  status: 'draft' | 'ready' | 'executing' | 'completed';
}

interface MissionBuilderProps {
  onMissionCreate?: (mission: Mission) => void;
}

const mockAssets = [
  { id: 'asset-01', name: 'Valve V-3401' },
  { id: 'asset-02', name: 'Pump P-2101' },
  { id: 'asset-03', name: 'Pipeline-B' },
  { id: 'asset-04', name: 'Tank T-5001' },
];

const actions = [
  'open',
  'close',
  'inspect',
  'actuate',
  'patrol',
  'thermal_scan',
  'visual_inspect',
  'measure_pressure',
  'measure_temperature',
  'navigate',
  'record',
] as const;

const missionTypes = ['inspection', 'patrol', 'thermal_scan', 'valve_ops', 'survey', 'delivery'] as const;

export const MissionBuilder: React.FC<MissionBuilderProps> = ({ onMissionCreate }) => {
  const [mission, setMission] = useState<Mission>({
    id: `mission-${Date.now()}`,
    name: 'New Mission',
    type: 'inspection',
    steps: [],
    status: 'draft',
  });

  const [draggedAsset, setDraggedAsset] = useState<typeof mockAssets[0] | null>(null);
  const [draggingStepId, setDraggingStepId] = useState<string | null>(null);

  const handleAssetDragStart = (asset: typeof mockAssets[0]) => {
    setDraggedAsset(asset);
  };

  const handleDropNewStep = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedAsset) return;

    const newStep: MissionStep = {
      id: `step-${Date.now()}`,
      assetId: draggedAsset.id,
      assetName: draggedAsset.name,
      action: mission.type === 'thermal_scan' ? 'thermal_scan' : 'inspect',
      duration: 30,
    };

    setMission((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
    setDraggedAsset(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeStep = (stepId: string) => {
    setMission((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId),
    }));
  };

  const updateStep = (stepId: string, updates: Partial<MissionStep>) => {
    setMission((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
    }));
  };

  const reorderSteps = (sourceId: string, targetId: string) => {
    setMission((prev) => {
      const idxFrom = prev.steps.findIndex((s) => s.id === sourceId);
      const idxTo = prev.steps.findIndex((s) => s.id === targetId);
      if (idxFrom < 0 || idxTo < 0 || idxFrom === idxTo) return prev;
      const next = [...prev.steps];
      const [moved] = next.splice(idxFrom, 1);
      next.splice(idxTo, 0, moved);
      return { ...prev, steps: next };
    });
  };

  const calculateTotalDuration = () => {
    return mission.steps.reduce((sum, step) => sum + step.duration, 0);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '24px',
        padding: '24px',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Assets Palette */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3
          style={{
            margin: 0,
            color: '#F5A623',
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Available Assets
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          {mockAssets.map((asset) => (
            <motion.div
              key={asset.id}
              draggable
              onDragStart={() => handleAssetDragStart(asset)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: '#1A1A1E',
                border: '1px solid #2E9AFF',
                borderRadius: '8px',
                padding: '12px',
                cursor: 'grab',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#2E9AFF',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                <Zap size={14} />
                <span>{asset.name}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <p style={{ color: '#666', fontSize: '11px', marginTop: '16px', fontStyle: 'italic' }}>
          Drag assets to the mission timeline to add steps.
        </p>
      </div>

      {/* Mission Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div>
          <h3
            style={{
              margin: '0 0 12px 0',
              color: '#F5A623',
              fontSize: '14px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Mission Timeline
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '8px' }}>
            <input
              type="text"
              value={mission.name}
              onChange={(e) => setMission((prev) => ({ ...prev, name: e.target.value }))}
              style={{
                width: '100%',
                background: '#0F0F12',
                border: '1px solid #2E2E34',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#E4E4E4',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <select
              value={mission.type}
              onChange={(e) => setMission((prev) => ({ ...prev, type: e.target.value as Mission['type'] }))}
              style={{
                width: '100%',
                background: '#0F0F12',
                border: '1px solid #2E2E34',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#E4E4E4',
                fontSize: '13px',
                outline: 'none',
                textTransform: 'capitalize',
              }}
            >
              {missionTypes.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drop Zone */}
        <motion.div
          onDragOver={handleDragOver}
          onDrop={handleDropNewStep}
          animate={{
            borderColor: draggedAsset ? '#F5A623' : '#2E2E34',
            background: draggedAsset ? 'rgba(245, 166, 35, 0.05)' : 'transparent',
          }}
          style={{
            flex: 1,
            border: '2px dashed',
            borderColor: '#2E2E34',
            borderRadius: '8px',
            padding: '16px',
            overflow: 'auto',
            minHeight: '200px',
            transition: 'all 0.2s ease',
          }}
        >
          {mission.steps.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
                textAlign: 'center',
              }}
            >
              <Zap size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>Drag assets here to build your mission</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AnimatePresence>
                {mission.steps.map((step, idx) => (
                  <motion.div
                    key={step.id}
                    draggable
                    onDragStart={() => setDraggingStepId(step.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={() => {
                      if (draggingStepId && draggingStepId !== step.id) reorderSteps(draggingStepId, step.id);
                      setDraggingStepId(null);
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    style={{
                      background: '#1A1A1E',
                      border: draggingStepId === step.id ? '1px dashed #F5A623' : '1px solid #2E9AFF',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'grab',
                    }}
                  >
                    <div
                      style={{
                        background: '#2E9AFF',
                        color: '#0C0C0E',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#E4E4E4', fontSize: '13px', fontWeight: 500 }}>
                        {step.assetName}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '11px', color: '#999' }}>
                        <select
                          value={step.action}
                          onChange={(e) => updateStep(step.id, { action: e.target.value as any })}
                          style={{
                            background: '#0F0F12',
                            border: '1px solid #2E2E34',
                            borderRadius: '4px',
                            padding: '4px 6px',
                            color: '#E4E4E4',
                            fontSize: '11px',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                          }}
                        >
                          {actions.map((a) => (
                            <option key={a} value={a}>
                              {a.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="5"
                          max="300"
                          value={step.duration}
                          onChange={(e) => updateStep(step.id, { duration: parseInt(e.target.value) })}
                          style={{
                            width: '50px',
                            background: '#0F0F12',
                            border: '1px solid #2E2E34',
                            borderRadius: '4px',
                            padding: '4px 6px',
                            color: '#E4E4E4',
                            fontSize: '11px',
                          }}
                        />
                        <span>sec</span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeStep(step.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#FF4040',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Mission Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: '#1A1A1E',
            border: '1px solid #2E2E34',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '24px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#999' }}>Type:</span>
              <span style={{ color: '#2E9AFF', marginLeft: '8px', fontWeight: 600 }}>
                {mission.type.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span style={{ color: '#999' }}>Steps:</span>
              <span style={{ color: '#F5A623', marginLeft: '8px', fontWeight: 600 }}>
                {mission.steps.length}
              </span>
            </div>
            <div>
              <span style={{ color: '#999' }}>Duration:</span>
              <span style={{ color: '#5FFF96', marginLeft: '8px', fontWeight: 600 }}>
                {calculateTotalDuration()}s
              </span>
            </div>
          </div>

          <motion.button
            onClick={() => {
              if (mission.steps.length > 0) {
                onMissionCreate?.({ ...mission, status: 'ready' });
              }
            }}
            whileHover={{ scale: mission.steps.length > 0 ? 1.05 : 1 }}
            whileTap={{ scale: mission.steps.length > 0 ? 0.95 : 1 }}
            disabled={mission.steps.length === 0}
            style={{
              background: mission.steps.length > 0 ? '#F5A623' : '#444',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              color: mission.steps.length > 0 ? '#0C0C0E' : '#666',
              fontSize: '12px',
              fontWeight: 600,
              cursor: mission.steps.length > 0 ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            <Play size={14} />
            Execute Mission
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default MissionBuilder;
