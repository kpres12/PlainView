import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description: string;
  category: 'navigation' | 'action' | 'view';
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  onNavigate?: (view: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: 'inspect-valves',
      label: 'Inspect Valves',
      description: 'View valve status across all sites',
      category: 'navigation',
      shortcut: 'V',
      action: () => {
        onNavigate?.('valves');
        setIsOpen(false);
      },
    },
    {
      id: 'search-assets',
      label: 'Search Assets',
      description: 'Find specific assets by name or ID',
      category: 'navigation',
      shortcut: 'A',
      action: () => {
        setSearch('');
        setIsOpen(true);
      },
    },
    {
      id: 'view-missions',
      label: 'View Missions',
      description: 'See all active and planned missions',
      category: 'navigation',
      shortcut: 'M',
      action: () => {
        onNavigate?.('missions');
        setIsOpen(false);
      },
    },
    {
      id: 'replay-events',
      label: 'Replay Events',
      description: 'Play back event timeline from any point',
      category: 'view',
      shortcut: 'R',
      action: () => {
        onNavigate?.('replay');
        setIsOpen(false);
      },
    },
    {
      id: 'alerts-view',
      label: 'View Alerts',
      description: 'See all system alerts and anomalies',
      category: 'view',
      shortcut: 'L',
      action: () => {
        onNavigate?.('alerts');
        setIsOpen(false);
      },
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'View FlowIQ analytics and insights',
      category: 'view',
      shortcut: 'D',
      action: () => {
        onNavigate?.('analytics');
        setIsOpen(false);
      },
    },
  ];

  const filteredCommands = search.trim()
    ? commands.filter(
        (cmd) =>
          cmd.label.toLowerCase().includes(search.toLowerCase()) ||
          cmd.description.toLowerCase().includes(search.toLowerCase())
      )
    : commands;

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Open palette with / or Cmd+K
      if ((e.key === '/' || (e.metaKey && e.key === 'k') || (e.ctrlKey && e.key === 'k')) && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        default:
          break;
      }
    },
    [isOpen, selectedIndex, filteredCommands]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '20vh',
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              background: '#1A1A1E',
              border: '1px solid #F5A623',
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(245, 166, 35, 0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #2E2E34',
                gap: '12px',
              }}
            >
              <Search size={20} color="#F5A623" />
              <input
                autoFocus
                type="text"
                placeholder="Type a command or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#E4E4E4',
                  fontSize: '16px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              />
              <span style={{ color: '#666', fontSize: '12px' }}>ESC to close</span>
            </div>

            {/* Commands List */}
            <div
              style={{
                maxHeight: '400px',
                overflowY: 'auto',
                paddingTop: '8px',
                paddingBottom: '8px',
              }}
            >
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, idx) => (
                  <motion.div
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: idx === selectedIndex ? '#2E2E34' : 'transparent',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: idx === selectedIndex ? '#F5A623' : '#E4E4E4',
                          fontSize: '14px',
                          fontWeight: 500,
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {cmd.label}
                      </div>
                      <div
                        style={{
                          color: '#999',
                          fontSize: '12px',
                          marginTop: '4px',
                        }}
                      >
                        {cmd.description}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {cmd.shortcut && (
                        <span
                          style={{
                            background: '#2E2E34',
                            color: '#999',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          {cmd.shortcut}
                        </span>
                      )}
                      {idx === selectedIndex && <ChevronRight size={16} color="#F5A623" />}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    color: '#666',
                  }}
                >
                  No commands found
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #2E2E34',
                color: '#666',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>↑↓ Navigate</span>
              <span>Enter to select</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
