import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

interface AlertProps {
  children: ReactNode
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  onClose?: () => void
  closeable?: boolean
}

export function Alert({ 
  children, 
  variant = 'info',
  title,
  onClose,
  closeable = true
}: AlertProps) {
  const config = {
    info: { icon: Info, bg: 'bg-pv-blue/10', border: 'border-pv-blue', text: 'text-pv-blue' },
    success: { icon: CheckCircle, bg: 'bg-pv-green/10', border: 'border-pv-green', text: 'text-pv-green' },
    warning: { icon: AlertTriangle, bg: 'bg-pv-amber/10', border: 'border-pv-amber', text: 'text-pv-amber' },
    error: { icon: AlertCircle, bg: 'bg-pv-red/10', border: 'border-pv-red', text: 'text-pv-red' },
  }

  const { icon: Icon, bg, border, text } = config[variant]

  return (
    <motion.div
      className={`${bg} border ${border} rounded-lg p-4 flex gap-3 items-start`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <Icon className={`${text} flex-shrink-0 mt-0.5`} size={20} />
      <div className="flex-1">
        {title && <div className="font-semibold text-pv-text mb-1">{title}</div>}
        <div className="text-pv-muted text-sm">{children}</div>
      </div>
      {closeable && (
        <button onClick={onClose} className="flex-shrink-0 text-pv-muted hover:text-pv-text transition-colors">
          <X size={16} />
        </button>
      )}
    </motion.div>
  )
}
