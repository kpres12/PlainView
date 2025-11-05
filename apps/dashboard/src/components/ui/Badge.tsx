interface BadgeProps {
  children: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-pv-dark text-pv-text border border-pv-muted',
    success: 'bg-pv-green/10 text-pv-green border border-pv-green/30',
    warning: 'bg-pv-amber/10 text-pv-amber border border-pv-amber/30',
    danger: 'bg-pv-red/10 text-pv-red border border-pv-red/30',
    info: 'bg-pv-blue/10 text-pv-blue border border-pv-blue/30',
  }

  return (
    <span className={`
      inline-flex items-center px-2 py-1 rounded text-xs font-mono tracking-wide
      ${variantClasses[variant]}
    `}>
      {children}
    </span>
  )
}
