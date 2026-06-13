'use client'

import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

interface CharacterLightboxProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  alt: string
}

export function CharacterLightbox({ open, onOpenChange, imageUrl, alt }: CharacterLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] p-2 sm:max-w-2xl sm:p-4">
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <div className="relative h-[70vh] w-full overflow-hidden rounded-lg">
          <Image src={imageUrl} alt={alt} fill className="object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
