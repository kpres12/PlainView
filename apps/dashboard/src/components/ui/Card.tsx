import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  highlighted?: boolean
}

export function Card({ children, className = '', highlighted = false, onClick, ...rest }: CardProps) {
  return (
    <motion.div
      className={`
        bg-pv-dark border border-pv-darker rounded-lg p-4
        ${highlighted ? 'border-pv-amber shadow-lg shadow-pv-amber/20' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      {...(rest as any)}
    >
      {children}
    </motion.div>
  )
}
