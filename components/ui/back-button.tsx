'use client'

import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  label?: string
  fallbackHref?: string
  className?: string
}

export function BackButton({ label = 'Voltar', fallbackHref = '/', className }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 py-3 text-[15px] text-muted-foreground transition-colors hover:text-foreground',
        'rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </button>
  )
}
