'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'

interface SignedAudioResponse {
  url: string
  expiresAt: number
}

// Refaz o fetch da signed URL um pouco antes dela expirar, para
// nao cortar a reproducao de audios mais longos que o TTL do servidor.
const REFRESH_MARGIN_MS = 30_000
const MIN_REFRESH_DELAY_MS = 5_000

interface AudioPlayerContextValue {
  audioRef: RefObject<HTMLAudioElement | null>
  hasAudio: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLoading: boolean
  error: string | null
  playbackRate: number
  isLooping: boolean
  togglePlay: () => void
  pause: () => void
  seekBy: (delta: number) => void
  toggleLoop: () => void
  handleSeek: (value: number) => void
  handleSpeedChange: (speed: number) => void
  handleVolumeChange: (value: number[]) => void
  toggleMute: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null)

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('useAudioPlayer deve ser usado dentro de um AudioPlayerProvider')
  return ctx
}

interface AudioPlayerProviderProps {
  kitId: string
  hasAudio: boolean
  children: ReactNode
}

// Mantem o elemento <audio> e todo o estado de reproducao (posicao,
// velocidade, loop, volume) sempre montados, independente do modo de foco
// ativo na pagina do kit. Assim a troca de modo (Ouvir/Ler/Guia) nao reseta
// a reproducao em andamento.
export function AudioPlayerProvider({ kitId, hasAudio, children }: AudioPlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playbackRateRef = useRef(1)
  const isLoopingRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(hasAudio)
  const [error, setError] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLooping, setIsLooping] = useState(false)

  const fetchSignedUrl = useCallback(async () => {
    const audio = audioRef.current

    try {
      const res = await fetch(`/api/audio/${kitId}`, { cache: 'no-store' })

      if (!res.ok) {
        if (res.status === 401) setError('Faça login para ouvir esta música.')
        else if (res.status === 403) setError('Você não tem acesso a este kit.')
        else setError('Não foi possível carregar o áudio.')
        return
      }

      const data: SignedAudioResponse = await res.json()
      setError(null)

      if (audio) {
        const wasPlaying = !audio.paused
        const resumeAt = audio.currentTime
        audio.src = data.url
        audio.currentTime = resumeAt
        audio.playbackRate = playbackRateRef.current
        audio.loop = isLoopingRef.current
        if (wasPlaying) {
          audio.play().catch(() => {})
        }
      }

      const delay = Math.max(data.expiresAt - Date.now() - REFRESH_MARGIN_MS, MIN_REFRESH_DELAY_MS)
      refreshTimeoutRef.current = setTimeout(fetchSignedUrl, delay)
    } catch {
      setError('Não foi possível carregar o áudio.')
    } finally {
      setIsLoading(false)
    }
  }, [kitId])

  useEffect(() => {
    if (!hasAudio) return

    fetchSignedUrl()

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current)

      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
    }
  }, [fetchSignedUrl, hasAudio])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || error) return

    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [error])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const seekBy = useCallback((delta: number) => {
    const audio = audioRef.current
    if (!audio) return
    const max = audio.duration || Infinity
    const next = Math.min(Math.max(0, audio.currentTime + delta), max)
    audio.currentTime = next
    setCurrentTime(next)
  }, [])

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      const next = !prev
      isLoopingRef.current = next
      if (audioRef.current) audioRef.current.loop = next
      return next
    })
  }, [])

  // Atalhos de teclado: Espaco = play/pause, setas = +-10s, L = loop.
  // Ficam ativos globalmente (independente do modo de foco exibido), exceto
  // quando o foco esta num campo de formulario ou ha um dialog aberto (ex.:
  // lightbox do personagem).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isFormField =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
      const isDialogOpen = document.querySelector('[role="dialog"][data-state="open"]') !== null
      if (isFormField || isDialogOpen) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekBy(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          seekBy(10)
          break
        case 'l':
        case 'L':
          toggleLoop()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, seekBy, toggleLoop])

  const handleSeek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrentTime(value)
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed)
    playbackRateRef.current = speed
    if (audioRef.current) audioRef.current.playbackRate = speed
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return
    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume || 1
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  return (
    <AudioPlayerContext.Provider
      value={{
        audioRef,
        hasAudio,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isLoading,
        error,
        playbackRate,
        isLooping,
        togglePlay,
        pause,
        seekBy,
        toggleLoop,
        handleSeek,
        handleSpeedChange,
        handleVolumeChange,
        toggleMute,
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        preload="metadata"
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
      />
      {children}
    </AudioPlayerContext.Provider>
  )
}
