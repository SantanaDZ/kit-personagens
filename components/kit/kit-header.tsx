'use client'

import { BackButton } from '@/components/ui/back-button'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DownloadIllustrationButton } from './download-illustration-button'
import { MoreVertical, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { formatStoryText } from '@/lib/format-story-text'
import { slugify, getFileExtension } from '@/lib/utils'
import type { Kit } from '@/lib/types'

interface KitHeaderProps {
  kit: Kit
}

const SUBTITLE_MAX_LENGTH = 200

function buildSubtitle(kit: Kit): string | null {
  if (kit.description) return kit.description
  if (!kit.story_text) return null

  const text = formatStoryText(kit.story_text).replace(/\s+/g, ' ').trim()
  if (text.length <= SUBTITLE_MAX_LENGTH) return text

  const truncated = text.slice(0, SUBTITLE_MAX_LENGTH)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : SUBTITLE_MAX_LENGTH)}…`
}

export function KitHeader({ kit }: KitHeaderProps) {
  const subtitle = buildSubtitle(kit)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link do kit copiado!')
    } catch {
      toast.error('Não foi possível copiar o link.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <BackButton label="Voltar" fallbackHref="/dashboard" className="-ml-2" />
        <div className="flex items-center gap-1">
          {kit.character_image_url && (
            <DownloadIllustrationButton
              imageUrl={kit.character_image_url}
              filename={`${slugify(kit.character_name || kit.title)}.${getFileExtension(kit.character_image_url)}`}
              label="Baixar ilustração"
              showLabel={false}
              size="icon"
              className="min-h-11 min-w-11"
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Mais opções">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleCopyLink}>
                <LinkIcon className="h-4 w-4" />
                <span>Copiar link do kit</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-[28px]">{kit.title}</h1>
        {subtitle && (
          <p className="mt-1 line-clamp-1 text-[15px] text-muted-foreground md:line-clamp-2">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
