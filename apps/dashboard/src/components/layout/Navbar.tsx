import { useState } from 'react'
import { useAppStore } from '../../store'
import { Menu, AlertCircle, Zap, MapPin, Gauge, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { MultiSiteView } from '../ui/MultiSiteView'

export function Navbar() {
  const { activeView, setActiveView } = useAppStore()
  const [currentSite, setCurrentSite] = useState('site-01')

  const navItems = [
    { id: 'command-center' as const, icon: MapPin, label: 'COMMAND CENTER' },
    { id: 'missions' as const, icon: Zap, label: 'MISSIONS' },
    { id: 'analytics' as const, icon: Gauge, label: 'FLOWIQ' },
    { id: 'alerts' as const, icon: AlertCircle, label: 'ALERTS' },
    { id: 'settings' as const, icon: Settings, label: 'SETTINGS' },
  ]

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '64px',
      backgroundColor: '#0C0C0E',
      borderBottom: '1px solid #1F2022',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Pumpjack Logo */}
          <div style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>
            ⛏️
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '0.15em', color: '#E4E4E4' }}>PLAINVIEW</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid #1F2022', paddingLeft: '24px' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isActive ? 'rgba(245, 166, 35, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(245, 166, 35, 0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  color: isActive ? '#F5A623' : '#A8A8A8',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  textTransform: 'uppercase',
                }}
                whileHover={{ 
                  scale: 1.08,
                  backgroundColor: isActive ? 'rgba(245, 166, 35, 0.2)' : 'rgba(245, 166, 35, 0.08)',
                  color: '#FFB74D',
                }}
                whileTap={{ scale: 0.96 }}
              >
                <Icon size={16} />
                {item.label}
                {isActive && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      bottom: '-10px',
                      left: '6px',
                      right: '6px',
                      height: '3px',
                      backgroundColor: '#F5A623',
                      borderRadius: '2px',
                    }}
                    layoutId="navIndicator"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#A8A8A8' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#5FFF96', borderRadius: '50%' }} />
          <span>ONLINE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid #1F2022', paddingLeft: '16px' }}>
          <MultiSiteView currentSite={currentSite} onSiteChange={setCurrentSite} />
        </div>
      </div>
    </nav>
  )
}
