import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Music, BookOpen, User, FileText } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Kit } from '@/lib/types'

interface KitCardProps {
  kit: Kit
}

export function KitCard({ kit }: KitCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      {kit.cover_image_url ? (
        <div className="relative aspect-video w-full">
          <Image
            src={kit.cover_image_url}
            alt={kit.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-muted">
          <Music className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-1">{kit.title}</CardTitle>
        {kit.description && (
          <CardDescription className="line-clamp-2">{kit.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {kit.music_url && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              <Music className="h-3 w-3" /> Musica
            </span>
          )}
          {kit.story_text && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              <BookOpen className="h-3 w-3" /> Historia
            </span>
          )}
          {kit.character_name && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              <User className="h-3 w-3" /> Personagem
            </span>
          )}
          {kit.guide_text && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              <FileText className="h-3 w-3" /> Guia
            </span>
          )}
        </div>
        <Button asChild className="w-full">
          <Link href={`/dashboard/kit/${kit.id}`}>Acessar Kit</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
