'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Music, UserRound, FileText } from 'lucide-react'
import { SectionLabel } from '@/components/ui/section-label'
import { AudioPlayer } from './audio-player'
import { CharacterCard } from './character-card'
import { StorySection } from './story-section'
import { VideoPanel } from './video-panel'
import { GuideSection } from './guide-section'
import { useAudioPlayer } from './audio-player-provider'
import type { KitMode } from '@/lib/use-kit-mode'
import type { Kit } from '@/lib/types'

interface KitDesktopLayoutProps {
  kit: Kit
  activeMode: KitMode
}

const modeVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export function KitDesktopLayout({ kit, activeMode }: KitDesktopLayoutProps) {
  const { pause } = useAudioPlayer()
  const contentRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  // Modo Ler pausa o audio automaticamente ao ser ativado (sem retomar ao voltar para Ouvir).
  useEffect(() => {
    if (activeMode === 'read') pause()
  }, [activeMode, pause])

  // Ao trocar de modo, rola suavemente para o topo do conteudo (abaixo da barra de modos).
  // Ignora a primeira renderizacao para nao saltar a pagina ao restaurar o modo salvo.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [activeMode])

  return (
    <div ref={contentRef}>
      <AnimatePresence mode="wait">
        <motion.div key={activeMode} variants={modeVariants} initial="initial" animate="animate" exit="exit">
          {activeMode === 'listen' && (
            <div className="grid grid-cols-2 gap-6 md:items-start">
              <div>
                <SectionLabel icon={Music} label="Música do kit" />
                <AudioPlayer title={kit.music_title || 'Música'} coverImageUrl={kit.cover_image_url} />
              </div>
              <div>
                <SectionLabel icon={UserRound} label="Personagem" />
                <CharacterCard
                  kitTitle={kit.title}
                  characterName={kit.character_name}
                  characterDescription={kit.character_description}
                  characterImageUrl={kit.character_image_url}
                  variant="focus"
                />
              </div>
            </div>
          )}

          {activeMode === 'read' && (
            <div className="grid grid-cols-[3fr_2fr] gap-6 md:items-start">
              <StorySection
                title={kit.title}
                storyText={kit.story_text}
                videoUrl={kit.video_url}
                coverImageUrl={kit.cover_image_url}
                showVideo={false}
                readingModeLineHeight={2.2}
              />
              <VideoPanel videoUrl={kit.video_url} coverImageUrl={kit.cover_image_url} />
            </div>
          )}

          {activeMode === 'guide' && (
            <div className="mx-auto max-w-[680px]">
              <SectionLabel icon={FileText} label="Guia de uso terapêutico" />
              <GuideSection title={kit.title} guideText={kit.guide_text} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
