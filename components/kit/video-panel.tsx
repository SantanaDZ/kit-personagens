import { Video } from 'lucide-react'
import { SectionLabel } from '@/components/ui/section-label'

interface VideoPanelProps {
  videoUrl: string | null
  coverImageUrl: string | null
}

export function VideoPanel({ videoUrl, coverImageUrl }: VideoPanelProps) {
  return (
    <div>
      <SectionLabel icon={Video} label="Vídeo ilustrativo" />
      {videoUrl ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={videoUrl} controls className="w-full rounded-xl" poster={coverImageUrl || undefined} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center text-muted-foreground">
          <Video className="h-10 w-10" />
          <p>Vídeo não disponível para este kit</p>
        </div>
      )}
    </div>
  )
}
