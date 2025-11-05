interface SliderProps {
  min: number
  max: number
  value: number
  onChange: (value: number) => void
  label?: string
  step?: number
}

export function Slider({ min, max, value, onChange, label, step = 1 }: SliderProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm text-pv-muted tracking-wide">{label}</label>
      )}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-1 bg-pv-darker rounded appearance-none cursor-pointer accent-pv-amber"
        />
        <span className="text-pv-amber font-mono text-sm min-w-12 text-right">
          {value.toFixed(0)}
        </span>
      </div>
    </div>
  )
}
