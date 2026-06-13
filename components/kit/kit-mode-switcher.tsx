'use client'

import { Music, BookOpen, FileText, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KitMode } from '@/lib/use-kit-mode'

interface KitModeSwitcherProps {
  activeMode: KitMode
  onModeChange: (mode: KitMode) => void
}

const MODES: { value: KitMode; label: string; icon: LucideIcon }[] = [
  { value: 'listen', label: 'Ouvir', icon: Music },
  { value: 'read', label: 'Ler', icon: BookOpen },
  { value: 'guide', label: 'Guia', icon: FileText },
]

export function KitModeSwitcher({ activeMode, onModeChange }: KitModeSwitcherProps) {
  return (
    <div className="kit-no-print hidden items-center gap-2 md:flex">
      {MODES.map(({ value, label, icon: Icon }) => {
        const isActive = activeMode === value

        return (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(value)}
            aria-pressed={isActive}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm transition-colors',
              isActive
                ? 'border-primary bg-primary/10 font-medium text-primary'
                : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
