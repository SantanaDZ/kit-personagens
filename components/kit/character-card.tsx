'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { DownloadIllustrationButton } from './download-illustration-button'
import { CharacterLightbox } from './character-lightbox'
import { Maximize2, User } from 'lucide-react'
import { cn, slugify, getFileExtension } from '@/lib/utils'

interface CharacterCardProps {
  kitTitle: string
  characterName: string | null
  characterDescription: string | null
  characterImageUrl: string | null
  /** 'focus' = usado no Modo Ouvir do desktop (imagem 4:3, descrição maior) */
  variant?: 'default' | 'focus'
}

export function CharacterCard({
  kitTitle,
  characterName,
  characterDescription,
  characterImageUrl,
  variant = 'default',
}: CharacterCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!characterImageUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border py-12 text-center text-muted-foreground">
        <User className="h-10 w-10" />
        <p>Nenhum personagem disponível</p>
      </div>
    )
  }

  const alt = characterName || 'Personagem'
  const filename = `${slugify(characterName || kitTitle)}.${getFileExtension(characterImageUrl)}`

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-xl',
          variant === 'focus' ? 'aspect-[4/3]' : 'aspect-square'
        )}
      >
        <Image src={characterImageUrl} alt={alt} fill className="object-cover" />
      </div>

      {characterName && (
        <div>
          <h3 className="text-lg font-semibold">{characterName}</h3>
          {characterDescription && (
            <p
              className={cn(
                'mt-1 text-sm text-muted-foreground',
                variant === 'focus' && 'text-[15px] leading-[1.7]'
              )}
            >
              {characterDescription}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <DownloadIllustrationButton imageUrl={characterImageUrl} filename={filename} />
        <Button type="button" variant="outline" className="min-h-11" onClick={() => setLightboxOpen(true)}>
          <Maximize2 className="h-4 w-4" />
          <span>Ampliar</span>
        </Button>
      </div>

      <CharacterLightbox open={lightboxOpen} onOpenChange={setLightboxOpen} imageUrl={characterImageUrl} alt={alt} />
    </div>
  )
}
