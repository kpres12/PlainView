import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface CinematicScene {
  id: string;
  duration: number; // ms
  camera?: {
    from: [number, number, number]; // [x, y, z]
    to: [number, number, number];
  };
  onComplete?: () => void;
}

interface CinematicTransitionProps {
  scene?: CinematicScene;
  active?: boolean;
  children?: React.ReactNode;
}

export const CinematicTransition: React.FC<CinematicTransitionProps> = ({
  scene,
  active = false,
  children,
}) => {
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!scene || !active) {
      setProgress(0);
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const startTime = Date.now();
    const duration = scene.duration;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const newProgress = Math.min(elapsed / duration, 1);

      setProgress(newProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
        scene.onComplete?.();
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [scene, active]);

  // Easing function (cubic-bezier equivalent)
  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Calculate camera position
  const getCameraPosition = () => {
    if (!scene?.camera) return [0, 0, 0];

    const eased = easeInOutCubic(progress);
    const [fromX, fromY, fromZ] = scene.camera.from;
    const [toX, toY, toZ] = scene.camera.to;

    return [
      fromX + (toX - fromX) * eased,
      fromY + (toY - fromY) * eased,
      fromZ + (toZ - fromZ) * eased,
    ];
  };

  return (
    <motion.div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        perspective: '1200px',
      }}
      animate={{
        opacity: active && isPlaying ? 1 : 0.5,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Cinematic overlay with progress */}
      {active && isPlaying && (
        <>
          {/* Top bar */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0))',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          />

          {/* Bottom bar */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          />

          {/* Progress indicator */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 11,
            }}
          >
            <div
              style={{
                width: '200px',
                height: '3px',
                background: 'rgba(245, 166, 35, 0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #F5A623, #2E9AFF)',
                  borderRadius: '2px',
                }}
                animate={{ scaleX: progress }}
                transition={{ type: 'tween', duration: 0 }}
                initial={{ scaleX: 0 }}
              />
            </div>
            <span
              style={{
                color: '#F5A623',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {Math.round(progress * 100)}%
            </span>
          </motion.div>

          {/* Camera info */}
          <motion.div
            style={{
              position: 'absolute',
              top: '24px',
              left: '24px',
              zIndex: 11,
            }}
          >
            <div
              style={{
                color: '#2E9AFF',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '8px',
              }}
            >
              CINEMATIC MODE
            </div>
            {scene?.camera && (
              <div
                style={{
                  color: '#999',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  lineHeight: '1.6',
                }}
              >
                {getCameraPosition().map((v, i) => (
                  <div key={i}>
                    {['X', 'Y', 'Z'][i]}: {v.toFixed(2)}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Content */}
      <div
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};

export default CinematicTransition;
