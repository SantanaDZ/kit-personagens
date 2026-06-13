import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionLabelProps {
  icon: LucideIcon
  label: string
  className?: string
}

export function SectionLabel({ icon: Icon, label, className }: SectionLabelProps) {
  return (
    <div
      className={cn(
        'mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
  )
}
