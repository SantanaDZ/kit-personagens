'use client'

import { cn } from '@/lib/utils'

interface SeekBarProps {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
}

// Barra de progresso do player de audio. Usa <input type="range"> com
// estilizacao propria (.kit-seek-range em globals.css) em vez do
// components/ui/slider.tsx compartilhado, para garantir track >= 6px e
// thumb >= 18px exigidos para uso em touch sem afetar outros usos do Slider
// (ex.: volume).
export function SeekBar({ value, max, onChange, disabled, className }: SeekBarProps) {
  const safeMax = max > 0 ? max : 1
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100))

  return (
    <input
      type="range"
      className={cn('kit-seek-range', className)}
      min={0}
      max={safeMax}
      step={0.1}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        background: `linear-gradient(to right, var(--primary) ${percent}%, var(--muted) ${percent}%)`,
      }}
      aria-label="Progresso da musica"
    />
  )
}
