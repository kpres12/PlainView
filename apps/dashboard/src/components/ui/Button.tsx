import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = ''
}: ButtonProps) {
  const baseClasses = 'font-sans tracking-wide transition-all duration-200 inline-flex items-center justify-center rounded'
  
  const variantClasses = {
    primary: 'bg-pv-amber text-pv-black hover:bg-opacity-80 disabled:opacity-50',
    secondary: 'bg-pv-dark border border-pv-amber text-pv-amber hover:bg-pv-darker disabled:opacity-50',
    danger: 'bg-pv-red text-pv-black hover:bg-opacity-80 disabled:opacity-50',
    ghost: 'text-pv-amber hover:bg-pv-darker disabled:opacity-50',
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
    >
      {children}
    </motion.button>
  )
}
