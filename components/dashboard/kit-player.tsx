'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Music, BookOpen, User, FileText, Play, Pause, Video } from 'lucide-react'
import Image from 'next/image'
import type { Kit } from '@/lib/types'
import { AudioPlayer } from './audio-player'
import { BackButton } from '@/components/ui/back-button'

interface KitPlayerProps {
  kit: Kit
}

export function KitPlayer({ kit }: KitPlayerProps) {
  const [activeTab, setActiveTab] = useState('musica')

  return (
    <div className="space-y-6">
      <div>
        <BackButton label="Voltar" fallbackHref="/dashboard" />
        <h1 className="text-[26px] font-bold tracking-tight md:text-3xl">{kit.title}</h1>
        {kit.description && (
          <p className="text-muted-foreground mt-1">{kit.description}</p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="musica" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">Musica</span>
          </TabsTrigger>
          <TabsTrigger value="historia" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Historia</span>
          </TabsTrigger>
          <TabsTrigger value="personagem" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Personagem</span>
          </TabsTrigger>
          <TabsTrigger value="guia" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Guia</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="musica" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                {kit.music_title || 'Musica do Kit'}
              </CardTitle>
              <CardDescription>Escute a musica do kit</CardDescription>
            </CardHeader>
            <CardContent>
              {kit.music_url ? (
                <AudioPlayer src={kit.music_url} title={kit.music_title || 'Musica'} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Music className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Nenhuma musica disponivel</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historia" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Historia
              </CardTitle>
              <CardDescription>Leia a historia do kit</CardDescription>
            </CardHeader>
            <CardContent>
              {kit.video_url && (
                <div className="mb-6">
                  <div className="aspect-video w-full overflow-hidden rounded-lg">
                    <video
                      src={kit.video_url}
                      controls
                      className="h-full w-full object-cover"
                      poster={kit.cover_image_url || undefined}
                    />
                  </div>
                </div>
              )}
              {kit.story_text ? (
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                    {kit.story_text}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Nenhuma historia disponivel</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personagem" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {kit.character_name || 'Personagem'}
              </CardTitle>
              {kit.character_description && (
                <CardDescription>{kit.character_description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {kit.character_image_url ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-lg">
                    <Image
                      src={kit.character_image_url}
                      alt={kit.character_name || 'Personagem'}
                      fill
                      className="object-contain"
                    />
                  </div>
                  {kit.character_name && (
                    <div className="text-center">
                      <h3 className="text-2xl font-bold">{kit.character_name}</h3>
                      {kit.character_description && (
                        <p className="mt-2 text-muted-foreground">{kit.character_description}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Nenhum personagem disponivel</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guia" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Guia de Uso
              </CardTitle>
              <CardDescription>Como utilizar este kit</CardDescription>
            </CardHeader>
            <CardContent>
              {kit.guide_text ? (
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                    {kit.guide_text}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Nenhum guia disponivel</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
