'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useReadingFontSize } from '@/lib/use-reading-prefs'
import { formatStoryText, splitParagraphs } from '@/lib/format-story-text'
import { ReadingMode } from './reading-mode'
import { BookOpen, Eye } from 'lucide-react'

interface StorySectionProps {
  title: string
  storyText: string | null
  videoUrl: string | null
  coverImageUrl: string | null
  showVideo?: boolean
  readingModeLineHeight?: number
}

export function StorySection({
  title,
  storyText,
  videoUrl,
  coverImageUrl,
  showVideo = true,
  readingModeLineHeight = 2,
}: StorySectionProps) {
  const [isReadingMode, setIsReadingMode] = useState(false)
  const { fontSize, increase, decrease, canIncrease, canDecrease } = useReadingFontSize()

  if (!storyText) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border py-12 text-center text-muted-foreground">
        <BookOpen className="h-10 w-10" />
        <p>Nenhuma história disponível</p>
      </div>
    )
  }

  const paragraphs = splitParagraphs(formatStoryText(storyText))

  return (
    <div className="space-y-4">
      {showVideo && videoUrl && (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <video
            src={videoUrl}
            controls
            className="h-full w-full object-cover"
            poster={coverImageUrl || undefined}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="min-h-11 min-w-11"
            onClick={decrease}
            disabled={!canDecrease}
            aria-label="Diminuir tamanho da fonte"
          >
            <span className="text-sm font-semibold">A-</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="min-h-11 min-w-11"
            onClick={increase}
            disabled={!canIncrease}
            aria-label="Aumentar tamanho da fonte"
          >
            <span className="text-sm font-semibold">A+</span>
          </Button>
        </div>
        <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setIsReadingMode(true)}>
          <Eye className="h-4 w-4" />
          <span>Modo leitura</span>
        </Button>
      </div>

      <div className="max-w-[65ch]">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-6" style={{ fontSize, lineHeight: 1.8 }}>
            {paragraph}
          </p>
        ))}
      </div>

      {isReadingMode && (
        <ReadingMode
          title={title}
          paragraphs={paragraphs}
          fontSize={fontSize}
          lineHeight={readingModeLineHeight}
          onClose={() => setIsReadingMode(false)}
        />
      )}
    </div>
  )
}
