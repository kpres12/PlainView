import { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (id: string) => void
}

export function Tabs({ tabs, defaultTab, onChange }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  const handleChange = (id: string) => {
    setActive(id)
    onChange?.(id)
  }

  return (
    <div>
      <div className="flex border-b border-pv-darker">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={`
              px-4 py-2 text-sm font-sans tracking-wide transition-colors relative
              ${active === tab.id ? 'text-pv-amber' : 'text-pv-muted hover:text-pv-text'}
            `}
          >
            {tab.label}
            {active === tab.id && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-pv-amber"
                layoutId="tabIndicator"
              />
            )}
          </button>
        ))}
      </div>
      <motion.div
        key={active}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {tabs.find(tab => tab.id === active)?.content}
      </motion.div>
    </div>
  )
}
