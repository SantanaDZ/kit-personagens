import { Video } from 'lucide-react'
import { SectionLabel } from '@/components/ui/section-label'
import { getYouTubeEmbedUrl } from '@/lib/utils'

interface VideoPanelProps {
  videoUrl: string | null
  coverImageUrl: string | null
}

export function VideoPanel({ videoUrl, coverImageUrl }: VideoPanelProps) {
  const embedUrl = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null

  return (
    <div>
      <SectionLabel icon={Video} label="Vídeo ilustrativo" />
      {embedUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl">
          <iframe
            src={embedUrl}
            title="Vídeo ilustrativo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : videoUrl ? (
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
