import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, MapPin, ChevronDown, X } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  location: string;
  assets: number;
  status: 'healthy' | 'warning' | 'critical';
  coordinates: [number, number]; // [lat, lng]
}

interface MultiSiteViewProps {
  currentSite?: string;
  onSiteChange?: (siteId: string) => void;
}

const sites: Site[] = [
  {
    id: 'site-01',
    name: 'Permian Basin',
    location: 'Texas, USA',
    assets: 24,
    status: 'healthy',
    coordinates: [31.8, -103.3],
  },
  {
    id: 'site-02',
    name: 'Eagle Ford',
    location: 'South Texas',
    assets: 18,
    status: 'warning',
    coordinates: [28.5, -97.8],
  },
  {
    id: 'site-03',
    name: 'Bakken',
    location: 'North Dakota',
    assets: 12,
    status: 'healthy',
    coordinates: [48.0, -102.0],
  },
  {
    id: 'site-04',
    name: 'Marcellus',
    location: 'Pennsylvania',
    assets: 16,
    status: 'critical',
    coordinates: [41.0, -76.5],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
      return '#5FFF96';
    case 'warning':
      return '#F5A623';
    case 'critical':
      return '#FF4040';
    default:
      return '#2E9AFF';
  }
};

export const MultiSiteView: React.FC<MultiSiteViewProps> = ({ currentSite, onSiteChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const activeSite = sites.find((s) => s.id === currentSite) || sites[0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Compact Global Map */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        style={{
          position: 'relative',
          width: '80px',
          height: '50px',
          background: 'linear-gradient(135deg, #0F0F12 0%, #1A1A1E 100%)',
          border: '1px solid #2E9AFF40',
          borderRadius: '6px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={() => setShowMapModal(true)}
      >
        {/* Simplified US map outline */}
        <svg style={{ width: '100%', height: '100%', position: 'absolute' }} viewBox="0 0 80 50">
          <path
            d="M 5 18 Q 12 14, 20 16 Q 28 15, 35 18 Q 42 17, 50 22 Q 55 25, 60 28 Q 65 30, 75 33"
            fill="none"
            stroke="#2E9AFF"
            strokeWidth="0.3"
            opacity="0.3"
          />
        </svg>

        {/* Site dots */}
        {sites.map((site) => {
          const x = ((site.coordinates[1] + 125) / 250) * 80;
          const y = ((site.coordinates[0] - 20) / 80) * 50;
          const isActive = site.id === currentSite;
          const color = getStatusColor(site.status);

          return (
            <motion.div
              key={site.id}
              animate={{ scale: isActive ? 1.3 : 1 }}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
                transform: 'translate(-50%, -50%)',
                zIndex: isActive ? 10 : 1,
              }}
            />
          );
        })}
      </motion.div>

      {/* Site Selector Dropdown */}
      <div style={{ position: 'relative' }}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#1A1A1E',
          border: `1px solid ${getStatusColor(activeSite.status)}`,
          borderRadius: '6px',
          padding: '6px 10px',
          color: '#E4E4E4',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: '600',
          letterSpacing: '0.05em',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
        }}
        whileHover={{ background: '#2E2E34', scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <MapPin size={12} color={getStatusColor(activeSite.status)} />
        <span>{activeSite.name}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={12} />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            background: '#1A1A1E',
            border: '1px solid #F5A623',
            borderRadius: '8px',
            minWidth: '200px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          }}
        >
          {sites.map((site, idx) => (
            <motion.button
              key={site.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                onSiteChange?.(site.id);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: site.id === currentSite ? '#2E2E34' : 'transparent',
                border: 'none',
                borderBottom: idx < sites.length - 1 ? '1px solid #2E2E34' : 'none',
                color: '#E4E4E4',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#2E2E34';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  site.id === currentSite ? '#2E2E34' : 'transparent';
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: getStatusColor(site.status) }}>
                  {site.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#999',
                    marginTop: '2px',
                  }}
                >
                  {site.location} • {site.assets} assets
                </div>
              </div>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: getStatusColor(site.status),
                  boxShadow: `0 0 8px ${getStatusColor(site.status)}`,
                }}
              />
            </motion.button>
          ))}
        </motion.div>
      )}
      </div>

      {/* Expandable Map Modal */}
      <AnimatePresence>
        {showMapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowMapModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '600px',
                height: '400px',
                background: 'linear-gradient(135deg, #0F0F12 0%, #1A1A1E 100%)',
                border: '2px solid #2E9AFF',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(46, 154, 255, 0.3), 0 0 40px rgba(46, 154, 255, 0.1)',
              }}
            >
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMapModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: '#FF4040',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(255, 64, 64, 0.3)',
                }}
              >
                <X size={18} color="#fff" />
              </motion.button>

              {/* Header */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '20px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  zIndex: 5,
                }}
              >
                <Globe size={20} color="#2E9AFF" />
                <h2 style={{ color: '#2E9AFF', fontSize: '16px', fontWeight: '700', margin: 0, letterSpacing: '0.1em' }}>
                  GLOBAL OPERATIONS
                </h2>
              </div>

              {/* Expanded Map */}
              <svg
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                }}
                viewBox="0 0 600 400"
              >
                {/* US Map outline */}
                <defs>
                  <linearGradient id="mapGradient" x1="0" y1="0" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2E9AFF" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#F5A623" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <rect width="600" height="400" fill="url(#mapGradient)" />
                <path
                  d="M 50 180 Q 100 120, 150 140 Q 200 130, 250 160 Q 300 150, 350 200 Q 400 220, 450 260 Q 500 280, 550 320"
                  fill="none"
                  stroke="#2E9AFF"
                  strokeWidth="1"
                  opacity="0.3"
                />
              </svg>

              {/* Enlarged Site dots with labels */}
              {sites.map((site, idx) => {
                const x = ((site.coordinates[1] + 125) / 250) * 600;
                const y = ((site.coordinates[0] - 20) / 80) * 400;
                const isActive = site.id === currentSite;
                const color = getStatusColor(site.status);

                return (
                  <motion.div
                    key={site.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.1, type: 'spring', damping: 20, stiffness: 300 }}
                    onClick={() => {
                      onSiteChange?.(site.id);
                      setShowMapModal(false);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${x}px`,
                      top: `${y}px`,
                      cursor: 'pointer',
                    }}
                  >
                    {/* Site dot */}
                    <motion.div
                      animate={{ scale: isActive ? 1.5 : 1 }}
                      transition={{ type: 'spring', damping: 20 }}
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40`,
                        transform: 'translate(-50%, -50%)',
                        border: `2px solid ${color}`,
                      }}
                    />

                    {/* Label */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 + 0.2 }}
                      style={{
                        position: 'absolute',
                        top: '20px',
                        left: '-60px',
                        background: '#1A1A1E',
                        border: `1px solid ${color}`,
                        borderRadius: '6px',
                        padding: '8px 12px',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
                        minWidth: '140px',
                      }}
                    >
                      <div style={{ color, fontSize: '12px', fontWeight: '700', letterSpacing: '0.05em' }}>
                        {site.name}
                      </div>
                      <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>
                        {site.location}
                      </div>
                      <div style={{ color: '#666', fontSize: '10px', marginTop: '4px' }}>
                        {site.assets} assets • {site.status.toUpperCase()}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiSiteView;
