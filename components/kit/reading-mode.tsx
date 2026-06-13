'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ReadingModeProps {
  title: string
  paragraphs: string[]
  fontSize: number
  lineHeight?: number
  onClose: () => void
}

export function ReadingMode({ title, paragraphs, fontSize, lineHeight = 2, onClose }: ReadingModeProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#FEFCE8] px-6 py-12 md:px-12">
      <div className="mx-auto max-w-[65ch] pb-20">
        <h2 className="mb-6 text-2xl font-bold text-stone-800">{title}</h2>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-6 text-stone-800" style={{ fontSize, lineHeight }}>
            {paragraph}
          </p>
        ))}
      </div>

      <Button
        type="button"
        onClick={onClose}
        size="lg"
        className="fixed bottom-6 right-6 z-[101] min-h-11 rounded-full shadow-lg"
      >
        <X className="h-4 w-4" />
        <span>Sair do modo leitura</span>
      </Button>
    </div>,
    document.body
  )
}
