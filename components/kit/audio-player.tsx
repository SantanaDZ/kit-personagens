'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { SeekBar } from './seek-bar'
import { useAudioPlayer } from './audio-player-provider'
import { Play, Pause, Volume2, VolumeX, AlertCircle, Music, Repeat } from 'lucide-react'

interface AudioPlayerProps {
  title: string
  coverImageUrl?: string | null
}

const SPEED_OPTIONS = [0.75, 1, 1.5] as const

function formatTime(time: number) {
  if (isNaN(time) || !isFinite(time)) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function AudioPlayer({ title, coverImageUrl }: AudioPlayerProps) {
  const {
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
    toggleLoop,
    handleSeek,
    handleSpeedChange,
    handleVolumeChange,
    toggleMute,
  } = useAudioPlayer()

  if (!hasAudio) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border py-12 text-center text-muted-foreground">
        <Music className="h-10 w-10" />
        <p>Nenhuma música disponível</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
        <AlertCircle className="h-8 w-8" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Music className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{formatTime(duration)}</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={togglePlay}
          disabled={isLoading}
          className="h-14 w-14 rounded-full"
          aria-label={isPlaying ? 'Pausar' : 'Tocar'}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
          {formatTime(currentTime)}
        </span>
        <SeekBar value={currentTime} max={duration} onChange={handleSeek} disabled={isLoading} />
        <span className="w-10 text-xs tabular-nums text-muted-foreground">{formatTime(duration)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((speed) => (
            <Button
              key={speed}
              type="button"
              variant={playbackRate === speed ? 'default' : 'outline'}
              size="sm"
              className="min-h-11 px-2.5 text-xs"
              onClick={() => handleSpeedChange(speed)}
              aria-pressed={playbackRate === speed}
            >
              {speed}x
            </Button>
          ))}
          <Button
            type="button"
            variant={isLooping ? 'default' : 'outline'}
            size="icon-sm"
            className="min-h-11 min-w-11"
            onClick={toggleLoop}
            aria-label="Repetir música"
            aria-pressed={isLooping}
          >
            <Repeat className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="min-h-11 min-w-11"
            onClick={toggleMute}
            aria-label={isMuted ? 'Ativar som' : 'Mudo'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            onValueChange={handleVolumeChange}
            className="w-20"
          />
        </div>
      </div>
    </div>
  )
}
