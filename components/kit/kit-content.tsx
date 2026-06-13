'use client'

import { useRef } from 'react'
import { Music, UserRound, BookOpen, FileText } from 'lucide-react'
import { SectionLabel } from '@/components/ui/section-label'
import { KitHeader } from './kit-header'
import { KitProgressIndex, type ProgressSection } from './kit-progress-index'
import { KitModeSwitcher } from './kit-mode-switcher'
import { KitDesktopLayout } from './kit-desktop-layout'
import { AudioPlayer } from './audio-player'
import { AudioPlayerProvider } from './audio-player-provider'
import { CharacterCard } from './character-card'
import { StorySection } from './story-section'
import { GuideSection } from './guide-section'
import { useKitMode } from '@/lib/use-kit-mode'
import type { Kit } from '@/lib/types'

interface KitContentProps {
  kit: Kit
}

export function KitContent({ kit }: KitContentProps) {
  const playerRef = useRef<HTMLElement>(null)
  const characterRef = useRef<HTMLElement>(null)
  const storyRef = useRef<HTMLElement>(null)
  const guideRef = useRef<HTMLElement>(null)

  const [activeMode, setActiveMode] = useKitMode(kit.id)

  const sections: ProgressSection[] = [
    { label: 'Música', icon: Music, ref: playerRef },
    { label: 'Personagem', icon: UserRound, ref: characterRef },
    { label: 'História', icon: BookOpen, ref: storyRef },
    { label: 'Guia', icon: FileText, ref: guideRef },
  ]

  return (
    <AudioPlayerProvider kitId={kit.id} hasAudio={!!kit.music_path}>
      <div className="space-y-6">
        <KitHeader kit={kit} />

        {/* Mobile: scroll vertical continuo (inalterado) */}
        <div className="md:hidden">
          <KitProgressIndex sections={sections} />

          <div className="space-y-6">
            <section ref={playerRef}>
              <SectionLabel icon={Music} label="Música do kit" />
              <AudioPlayer title={kit.music_title || 'Música'} coverImageUrl={kit.cover_image_url} />
            </section>

            <section ref={characterRef}>
              <SectionLabel icon={UserRound} label="Personagem" />
              <CharacterCard
                kitTitle={kit.title}
                characterName={kit.character_name}
                characterDescription={kit.character_description}
                characterImageUrl={kit.character_image_url}
              />
            </section>

            <section ref={storyRef}>
              <SectionLabel icon={BookOpen} label="História" />
              <StorySection
                title={kit.title}
                storyText={kit.story_text}
                videoUrl={kit.video_url}
                coverImageUrl={kit.cover_image_url}
              />
            </section>

            <section ref={guideRef}>
              <SectionLabel icon={FileText} label="Guia de uso" />
              <GuideSection title={kit.title} guideText={kit.guide_text} />
            </section>
          </div>
        </div>

        {/* Desktop: 3 modos de foco (Ouvir / Ler / Guia) */}
        <div className="hidden space-y-6 md:block">
          <KitModeSwitcher activeMode={activeMode} onModeChange={setActiveMode} />
          <KitDesktopLayout kit={kit} activeMode={activeMode} />
        </div>
      </div>
    </AudioPlayerProvider>
  )
}
